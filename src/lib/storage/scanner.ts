import crypto from 'crypto';
import path from 'path';
import AdmZip from 'adm-zip';
import {
  GameManifestEntry,
  GameFileManifest,
} from '@/types';
import { resolveMimeType, getAssetCacheControl } from './index';

export interface DeepScanResult {
  passed: boolean;
  isZipFormat: boolean;
  entryPoint: string;
  hasEntryFile: boolean;
  entryPointFound: boolean;
  totalFilesCount: number;
  fileCount: number;
  uncompressedSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio: number;
  sha256: string;
  suspiciousFilesDetected: string[];
  scanErrors: string[];
  missingAssetReferences: string[];
  violations: { rule: string; message: string; file?: string }[];
  filesList: {
    path: string;
    sizeBytes: number;
    sha256: string;
    contentType: string;
  }[];
}

export const UPLOAD_SECURITY_LIMITS = {
  MAX_ZIP_SIZE_BYTES: 100 * 1024 * 1024, // 100 MB compressed
  MAX_UNCOMPRESSED_SIZE_BYTES: 350 * 1024 * 1024, // 350 MB decompressed
  MAX_COMPRESSION_RATIO: 10, // 10:1 ratio limit for ZIP bomb mitigation
  MAX_FILE_COUNT: 5000,
  PROHIBITED_EXTENSIONS: [
    '.exe', '.dll', '.so', '.dylib', '.bat', '.cmd', '.sh',
    '.vbs', '.scr', '.msi', '.jar', '.com', '.pif', '.hta', '.cpl',
    '.ps1', '.bash', '.app', '.reg'
  ],
  WINDOWS_RESERVED_NAMES: [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ],
};

/**
 * Validates actual ZIP file magic bytes (PK\x03\x04 or PK\x05\x06 or PK\x07\x08).
 * Ensures an uploaded file is a legitimate ZIP archive and not an disguised executable or corrupt blob.
 */
export function isLegitimateZipBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;
  // Standard ZIP Local File Header magic number: 0x50 0x4B 0x03 0x04 (PK\x03\x04)
  // Standard ZIP Empty Archive magic number: 0x50 0x4B 0x05 0x06 (PK\x05\x06)
  const b0 = buffer[0];
  const b1 = buffer[1];
  const b2 = buffer[2];
  const b3 = buffer[3];

  const isLocalFileHeader = b0 === 0x50 && b1 === 0x4b && b2 === 0x03 && b3 === 0x04;
  const isEmptyArchive = b0 === 0x50 && b1 === 0x4b && b2 === 0x05 && b3 === 0x06;
  const isSpannedArchive = b0 === 0x50 && b1 === 0x4b && b2 === 0x07 && b3 === 0x08;

  return isLocalFileHeader || isEmptyArchive || isSpannedArchive;
}

/**
 * Validates ZIP buffer integrity and returns structured status.
 */
export function validateZipBuffer(buffer: Buffer): {
  isValid: boolean;
  magicBytesDetected: boolean;
  error?: string;
} {
  if (!buffer || buffer.length < 22) {
    return {
      isValid: false,
      magicBytesDetected: false,
      error: 'Archive buffer is empty or truncated (< 22 bytes minimum ZIP size).',
    };
  }
  const isZip = isLegitimateZipBuffer(buffer);
  if (!isZip) {
    return {
      isValid: false,
      magicBytesDetected: false,
      error: 'Invalid archive format. Missing standard PK magic bytes header.',
    };
  }
  return {
    isValid: true,
    magicBytesDetected: true,
  };
}

/**
 * Parses an HTML file to find local relative asset references (<script src>, <link href>, <img src>, audio).
 * Validates whether all locally referenced game scripts and stylesheets exist in the archive.
 */
export function extractHtmlAssetReferences(htmlContent: string): string[] {
  const references: string[] = [];
  // Match script src, link href, img src, source src
  const regex = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(htmlContent)) !== null) {
    const rawRef = match[1].trim();
    // Exclude data URIs, anchor hashes, and external absolute URLs (e.g. http://, https://, //)
    if (
      !rawRef.startsWith('data:') &&
      !rawRef.startsWith('#') &&
      !rawRef.startsWith('http://') &&
      !rawRef.startsWith('https://') &&
      !rawRef.startsWith('//')
    ) {
      // Strip query parameters or hashes
      const cleanPath = rawRef.split('?')[0].split('#')[0];
      if (cleanPath && !references.includes(cleanPath)) {
        references.push(cleanPath);
      }
    }
  }

  return references;
}

/**
 * Deep security inspection and manifest calculation for untrusted game ZIP archives.
 */
export function scanAndValidateGameZip(
  buffer: Buffer,
  options?: {
    customEntryPoint?: string;
    maxUploadSizeBytes?: number;
  }
): DeepScanResult {
  const scanErrors: string[] = [];
  const suspiciousFilesDetected: string[] = [];
  const missingAssetReferences: string[] = [];
  const violations: { rule: string; message: string; file?: string }[] = [];
  const filesList: DeepScanResult['filesList'] = [];

  const maxCompressed = options?.maxUploadSizeBytes || UPLOAD_SECURITY_LIMITS.MAX_ZIP_SIZE_BYTES;
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  // 1. Verify ZIP Magic Bytes
  const isZipFormat = isLegitimateZipBuffer(buffer);
  if (!isZipFormat) {
    const errMsg = 'Invalid archive format. File header is not a valid ZIP binary signature.';
    scanErrors.push(errMsg);
    violations.push({ rule: 'INVALID_ARCHIVE_FORMAT', message: errMsg });
    return {
      passed: false,
      isZipFormat: false,
      entryPoint: options?.customEntryPoint || 'index.html',
      hasEntryFile: false,
      entryPointFound: false,
      totalFilesCount: 0,
      fileCount: 0,
      uncompressedSizeBytes: 0,
      compressedSizeBytes: buffer.length,
      compressionRatio: 0,
      sha256,
      suspiciousFilesDetected: ['Invalid ZIP magic bytes signature.'],
      scanErrors,
      missingAssetReferences: [],
      violations,
      filesList: [],
    };
  }

  // 2. Validate Compressed Size
  if (buffer.length > maxCompressed) {
    const errMsg = `Compressed archive size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds allowed limit of ${(maxCompressed / 1024 / 1024).toFixed(2)} MB.`;
    scanErrors.push(errMsg);
    violations.push({ rule: 'ZIP_SIZE_EXCEEDED', message: errMsg });
  }

  // 3. Parse ZIP entries
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch (err: any) {
    const errMsg = `Failed to decompress archive: ${err.message}`;
    scanErrors.push(errMsg);
    violations.push({ rule: 'CORRUPTED_ARCHIVE', message: errMsg });
    return {
      passed: false,
      isZipFormat: true,
      entryPoint: options?.customEntryPoint || 'index.html',
      hasEntryFile: false,
      entryPointFound: false,
      totalFilesCount: 0,
      fileCount: 0,
      uncompressedSizeBytes: 0,
      compressedSizeBytes: buffer.length,
      compressionRatio: 0,
      sha256,
      suspiciousFilesDetected: [],
      scanErrors,
      missingAssetReferences: [],
      violations,
      filesList: [],
    };
  }

  const entries = zip.getEntries();
  const totalFilesCount = entries.filter((e) => !e.isDirectory).length;

  if (totalFilesCount === 0) {
    const errMsg = 'Archive is empty. Must contain at least one valid HTML5 game file.';
    scanErrors.push(errMsg);
    violations.push({ rule: 'EMPTY_ARCHIVE', message: errMsg });
  }

  if (totalFilesCount > UPLOAD_SECURITY_LIMITS.MAX_FILE_COUNT) {
    const errMsg = `Total file count (${totalFilesCount}) exceeds maximum allowed limit of ${UPLOAD_SECURITY_LIMITS.MAX_FILE_COUNT} files.`;
    scanErrors.push(errMsg);
    violations.push({ rule: 'MAX_FILES_EXCEEDED', message: errMsg });
  }

  // Detect common single-directory wrapper (e.g. "MyGame/index.html")
  const rootDirs = new Set<string>();
  let hasDirectRootFiles = false;
  for (const entry of entries) {
    const normalizedName = entry.entryName.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalizedName) continue;
    const parts = normalizedName.split('/').filter(Boolean);
    if (parts.length > 1) {
      rootDirs.add(parts[0]);
    } else if (!entry.isDirectory) {
      hasDirectRootFiles = true;
    }
  }
  const commonPrefix = !hasDirectRootFiles && rootDirs.size === 1 ? Array.from(rootDirs)[0] + '/' : '';

  let totalUncompressedBytes = 0;
  let entryFileBuffer: Buffer | null = null;
  const relativeFilePaths = new Set<string>();

  for (const entry of entries) {
    const rawName = entry.entryName;

    // Check for directory traversal sequences (Zip Slip attack)
    if (
      rawName.includes('..') ||
      rawName.startsWith('/') ||
      rawName.startsWith('\\') ||
      rawName.includes('\0')
    ) {
      const msg = `Path traversal / Zip Slip pattern detected: "${rawName}"`;
      suspiciousFilesDetected.push(msg);
      scanErrors.push(msg);
      violations.push({ rule: 'PATH_TRAVERSAL_DETECTED', message: msg, file: rawName });
      continue;
    }

    // Normalized relative path
    let relPath = rawName.replace(/\\/g, '/');
    if (commonPrefix && relPath.startsWith(commonPrefix)) {
      relPath = relPath.slice(commonPrefix.length);
    }
    relPath = relPath.replace(/^\/+/, '');

    if (!relPath) continue;

    // Windows device name checks (prevent DOS crash on Windows extraction)
    const baseSegment = path.basename(relPath).toUpperCase();
    const nameWithoutExt = baseSegment.split('.')[0];
    if (UPLOAD_SECURITY_LIMITS.WINDOWS_RESERVED_NAMES.includes(nameWithoutExt)) {
      const msg = `Reserved system filename prohibited: "${relPath}"`;
      suspiciousFilesDetected.push(msg);
      scanErrors.push(msg);
      violations.push({ rule: 'WINDOWS_RESERVED_NAME', message: msg, file: relPath });
    }

    if (!entry.isDirectory) {
      const entrySize = entry.header.size;
      totalUncompressedBytes += entrySize;

      // Prohibited executable extension checks
      const ext = path.extname(relPath).toLowerCase();
      if (UPLOAD_SECURITY_LIMITS.PROHIBITED_EXTENSIONS.includes(ext)) {
        const msg = `Dangerous file type "${ext}" rejected in "${relPath}"`;
        suspiciousFilesDetected.push(msg);
        scanErrors.push(msg);
        violations.push({ rule: 'PROHIBITED_FILE_TYPE', message: msg, file: relPath });
      }

      // Check for symbolic links (UNIX mode 0120000)
      const isSymlink = (entry.attr >>> 16) === 0o120000;
      if (isSymlink) {
        const msg = `Symbolic links are strictly prohibited for game security: "${relPath}"`;
        suspiciousFilesDetected.push(msg);
        scanErrors.push(msg);
        violations.push({ rule: 'PROHIBITED_FILE_TYPE', message: msg, file: relPath });
      }

      relativeFilePaths.add(relPath);

      // Extract data and calculate per-file SHA-256
      let fileData: Buffer;
      try {
        fileData = entry.getData();
      } catch (err: any) {
        const msg = `Corrupted file entry "${relPath}": ${err.message}`;
        scanErrors.push(msg);
        violations.push({ rule: 'CORRUPTED_ENTRY', message: msg, file: relPath });
        continue;
      }

      const fileSha256 = crypto.createHash('sha256').update(fileData).digest('hex');
      const contentType = resolveMimeType(relPath);

      filesList.push({
        path: relPath,
        sizeBytes: entrySize,
        sha256: fileSha256,
        contentType,
      });

      // Target entry file (default index.html or custom entry)
      const targetEntry = (options?.customEntryPoint || 'index.html').toLowerCase();
      if (relPath.toLowerCase() === targetEntry) {
        entryFileBuffer = fileData;
      }
    }
  }

  // 4. Decompression Bomb Check
  if (totalUncompressedBytes > UPLOAD_SECURITY_LIMITS.MAX_UNCOMPRESSED_SIZE_BYTES) {
    const msg = `Total uncompressed size (${(totalUncompressedBytes / 1024 / 1024).toFixed(2)} MB) exceeds safe ceiling of ${(UPLOAD_SECURITY_LIMITS.MAX_UNCOMPRESSED_SIZE_BYTES / 1024 / 1024).toFixed(2)} MB.`;
    scanErrors.push(msg);
    violations.push({ rule: 'ZIP_BOMB_LIMIT_EXCEEDED', message: msg });
  }

  const compressionRatio = buffer.length > 0 ? totalUncompressedBytes / buffer.length : 1;
  if (
    compressionRatio > UPLOAD_SECURITY_LIMITS.MAX_COMPRESSION_RATIO &&
    totalUncompressedBytes > 10 * 1024 * 1024
  ) {
    const msg = `Compression ratio (${compressionRatio.toFixed(1)}:1) exceeds safety threshold of ${UPLOAD_SECURITY_LIMITS.MAX_COMPRESSION_RATIO}:1 (potential ZIP bomb).`;
    scanErrors.push(msg);
    violations.push({ rule: 'ZIP_BOMB_LIMIT_EXCEEDED', message: msg });
  }

  // 5. Entry point verification
  const effectiveEntryPoint = options?.customEntryPoint || 'index.html';
  const hasEntryFile = entryFileBuffer !== null;
  if (!hasEntryFile) {
    const msg = `Missing mandatory game entry file "${effectiveEntryPoint}" in the archive root.`;
    scanErrors.push(msg);
    violations.push({ rule: 'MISSING_ENTRY_POINT', message: msg });
  } else if (entryFileBuffer) {
    // 6. Validate internal HTML asset references
    try {
      const htmlString = entryFileBuffer.toString('utf-8');
      const references = extractHtmlAssetReferences(htmlString);

      for (const ref of references) {
        // Resolve relative to index.html
        const normalizedRef = path.normalize(ref).replace(/\\/g, '/').replace(/^\/+/, '');
        if (!relativeFilePaths.has(normalizedRef)) {
          // Check if file exists without leading './'
          const altRef = normalizedRef.replace(/^\.\//, '');
          if (!relativeFilePaths.has(altRef)) {
            missingAssetReferences.push(ref);
          }
        }
      }

      if (missingAssetReferences.length > 0) {
        // Log warning for missing assets (e.g. 404 assets that would break gameplay)
        suspiciousFilesDetected.push(
          `Entry file references ${missingAssetReferences.length} missing asset(s): ${missingAssetReferences.slice(0, 3).join(', ')}`
        );
      }
    } catch {
      // Non-fatal parse warning
    }
  }

  const passed = scanErrors.length === 0 && hasEntryFile && violations.length === 0;

  return {
    passed,
    isZipFormat,
    entryPoint: effectiveEntryPoint,
    hasEntryFile,
    entryPointFound: hasEntryFile,
    totalFilesCount,
    fileCount: totalFilesCount,
    uncompressedSizeBytes: totalUncompressedBytes,
    compressedSizeBytes: buffer.length,
    compressionRatio: Number(compressionRatio.toFixed(2)),
    sha256,
    suspiciousFilesDetected,
    scanErrors,
    missingAssetReferences,
    violations,
    filesList,
  };
}

/**
 * Builds a deterministic GameFileManifest from verified scan results and storage keys.
 */
/**
 * Builds a deterministic GameFileManifest from verified scan results and storage keys,
 * or directly from a list of files.
 */
export function buildGameFileManifest(
  paramsOrGameId:
    | {
        gameId: string;
        versionId: string;
        cdnDomain: string;
        storagePrefix: string;
        scanResult: DeepScanResult;
      }
    | string,
  maybeVersionId?: string,
  maybeFiles?: { path: string; content: Buffer }[]
): GameFileManifest {
  if (typeof paramsOrGameId === 'object') {
    const { gameId, versionId, cdnDomain, storagePrefix, scanResult } = paramsOrGameId;
    const cleanCdn = (cdnDomain || 'https://cdn.gameverse.com').replace(/\/+$/, '');
    const cleanPrefix = (storagePrefix || `games/${gameId}/versions/${versionId}`).replace(/^\/+|\/+$/g, '');

    const manifestFiles: GameManifestEntry[] = scanResult.filesList.map((file) => {
      const storageKey = `${cleanPrefix}/${file.path}`;
      const cdnUrl = `${cleanCdn}/${storageKey}`;
      return {
        path: file.path,
        sizeBytes: file.sizeBytes,
        sha256: file.sha256,
        contentType: file.contentType,
        storageKey,
        cdnUrl,
      };
    });

    const sortedHashes = manifestFiles
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((f) => `${f.path}:${f.sha256}`)
      .join('\n');

    const manifestHash = crypto.createHash('sha256').update(sortedHashes).digest('hex');

    return {
      id: `mnf-${versionId}`,
      versionId,
      gameId,
      entryPoint: scanResult.entryPoint,
      files: manifestFiles,
      totalFilesCount: manifestFiles.length,
      totalSizeBytes: scanResult.uncompressedSizeBytes,
      manifestHash,
      createdAt: new Date().toISOString(),
    };
  }

  // Direct signature: (gameId, versionId, files)
  const gameId = paramsOrGameId;
  const versionId = maybeVersionId || 'v1.0.0';
  const rawFiles = maybeFiles || [];
  let totalSizeBytes = 0;

  const manifestFiles: GameManifestEntry[] = rawFiles.map((file) => {
    const sizeBytes = file.content.length;
    totalSizeBytes += sizeBytes;
    const sha256 = crypto.createHash('sha256').update(file.content).digest('hex');
    const storageKey = `games/${gameId}/versions/${versionId}/${file.path}`;
    const cdnUrl = `https://cdn.gameverse.com/${storageKey}`;
    return {
      path: file.path,
      sizeBytes,
      sha256,
      contentType: resolveMimeType(file.path),
      storageKey,
      cdnUrl,
    };
  });

  const sortedHashes = manifestFiles
    .slice()
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((f) => `${f.path}:${f.sha256}`)
    .join('\n');

  const manifestHash = crypto.createHash('sha256').update(sortedHashes).digest('hex');

  return {
    id: `mnf-${versionId}`,
    versionId,
    gameId,
    entryPoint: 'index.html',
    files: manifestFiles,
    totalFilesCount: manifestFiles.length,
    totalSizeBytes,
    manifestHash,
    createdAt: new Date().toISOString(),
  };
}
