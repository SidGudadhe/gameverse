import crypto from 'crypto';
import path from 'path';
import AdmZip from 'adm-zip';

export interface ArchiveScanResult {
  passed: boolean;
  extractedFilesCount: number;
  uncompressedSizeBytes: number;
  hasEntryFile: boolean;
  suspiciousFilesDetected: string[];
  scanErrors: string[];
  sha256: string;
}

export const SECURITY_LIMITS = {
  MAX_ARCHIVE_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB compressed
  MAX_UNCOMPRESSED_SIZE_BYTES: 250 * 1024 * 1024, // 250 MB decompressed
  MAX_COMPRESSION_RATIO: 10, // 10:1 ratio limit for ZIP bomb mitigation
  MAX_FILE_COUNT: 2000,
  PROHIBITED_EXTENSIONS: [
    '.exe', '.dll', '.so', '.dylib', '.bat', '.cmd', '.sh', 
    '.vbs', '.scr', '.msi', '.jar', '.com', '.pif', '.hta', '.cpl'
  ],
};

export function computeSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function validateAndScanZip(buffer: Buffer): ArchiveScanResult {
  const scanErrors: string[] = [];
  const suspiciousFilesDetected: string[] = [];
  let totalUncompressedBytes = 0;
  let hasEntryFile = false;
  let fileCount = 0;

  const sha256 = computeSha256(buffer);

  if (buffer.length > SECURITY_LIMITS.MAX_ARCHIVE_SIZE_BYTES) {
    scanErrors.push(`Archive compressed size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds limit of 50 MB.`);
  }

  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch (err: any) {
    return {
      passed: false,
      extractedFilesCount: 0,
      uncompressedSizeBytes: 0,
      hasEntryFile: false,
      suspiciousFilesDetected: [],
      scanErrors: [`Invalid or corrupted ZIP archive: ${err.message}`],
      sha256,
    };
  }

  const entries = zip.getEntries();
  fileCount = entries.length;

  if (fileCount > SECURITY_LIMITS.MAX_FILE_COUNT) {
    scanErrors.push(`File count (${fileCount}) exceeds safety threshold of ${SECURITY_LIMITS.MAX_FILE_COUNT} files.`);
  }

  for (const entry of entries) {
    const entryName = entry.entryName;

    // Check for directory traversal attacks (e.g. ../ or absolute paths)
    const normalized = path.normalize(entryName).replace(/^(\.\.[\/\\])+/, '');
    if (entryName.includes('..') || entryName.startsWith('/') || entryName.startsWith('\\')) {
      suspiciousFilesDetected.push(`Path traversal attempt detected in entry: ${entryName}`);
      scanErrors.push(`Path traversal detected: ${entryName}`);
    }

    if (!entry.isDirectory) {
      totalUncompressedBytes += entry.header.size;

      // Check for prohibited executable file types
      const ext = path.extname(entryName).toLowerCase();
      if (SECURITY_LIMITS.PROHIBITED_EXTENSIONS.includes(ext)) {
        suspiciousFilesDetected.push(`Prohibited executable detected: ${entryName}`);
        scanErrors.push(`Prohibited file type ${ext} found in ${entryName}`);
      }

      // Check for root or top-level index.html
      if (entryName.toLowerCase() === 'index.html' || entryName.toLowerCase().endsWith('/index.html')) {
        hasEntryFile = true;
      }
    }
  }

  // Decompression bomb check
  if (totalUncompressedBytes > SECURITY_LIMITS.MAX_UNCOMPRESSED_SIZE_BYTES) {
    scanErrors.push(`Total uncompressed size (${(totalUncompressedBytes / 1024 / 1024).toFixed(2)} MB) exceeds 250 MB limit.`);
  }

  const compressionRatio = buffer.length > 0 ? totalUncompressedBytes / buffer.length : 1;
  if (compressionRatio > SECURITY_LIMITS.MAX_COMPRESSION_RATIO && totalUncompressedBytes > 10 * 1024 * 1024) {
    scanErrors.push(`Compression ratio (${compressionRatio.toFixed(1)}:1) exceeds safe threshold of 10:1 (potential ZIP bomb).`);
  }

  if (!hasEntryFile) {
    scanErrors.push('Missing required entry file "index.html" in the archive root.');
  }

  const passed = scanErrors.length === 0 && hasEntryFile;

  return {
    passed,
    extractedFilesCount: fileCount,
    uncompressedSizeBytes: totalUncompressedBytes,
    hasEntryFile,
    suspiciousFilesDetected,
    scanErrors,
    sha256,
  };
}
