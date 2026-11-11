import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
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

/**
 * Safely extracts a validated ZIP archive buffer into targetDir.
 * Fully protects against Zip Slip attacks by verifying all entry destinations.
 */
export function extractArchiveSafely(
  buffer: Buffer,
  targetDir: string
): { success: boolean; filesExtracted: number; error?: string } {
  try {
    const scan = validateAndScanZip(buffer);
    if (!scan.passed) {
      return { success: false, filesExtracted: 0, error: scan.scanErrors.join('; ') };
    }

    const zip = new AdmZip(buffer);
    const resolvedTarget = path.resolve(targetDir);

    if (!fs.existsSync(resolvedTarget)) {
      fs.mkdirSync(resolvedTarget, { recursive: true });
    }

    const entries = zip.getEntries();
    let count = 0;

    for (const entry of entries) {
      // Zip Slip defense: verify destination is strictly within resolvedTarget
      const entryDest = path.resolve(resolvedTarget, entry.entryName);
      if (!entryDest.startsWith(resolvedTarget + path.sep) && entryDest !== resolvedTarget) {
        throw new Error(`Zip slip path traversal detected: ${entry.entryName}`);
      }

      if (entry.isDirectory) {
        if (!fs.existsSync(entryDest)) {
          fs.mkdirSync(entryDest, { recursive: true });
        }
      } else {
        const parent = path.dirname(entryDest);
        if (!fs.existsSync(parent)) {
          fs.mkdirSync(parent, { recursive: true });
        }
        fs.writeFileSync(entryDest, entry.getData());
        count++;
      }
    }

    return { success: true, filesExtracted: count };
  } catch (err: any) {
    return { success: false, filesExtracted: 0, error: err.message };
  }
}

// ================= PHASE 14: SANDBOX, CSP & ORIGIN ISOLATION =================

export const PROHIBITED_SANDBOX_FLAGS = [
  'allow-top-navigation',
  'allow-top-navigation-by-user-activation',
  'allow-modals',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-same-origin-with-parent',
];

export const REQUIRED_SANDBOX_FLAGS = [
  'allow-scripts',
  'allow-same-origin',
  'allow-pointer-lock',
];

/**
 * Validates that an iframe sandbox attribute meets GameVerse security isolation directives.
 * Strictly prevents top-navigation redirects, modal freezes, and popup escapes.
 */
export function validateSandboxFlags(sandboxAttribute: string): {
  secure: boolean;
  violations: string[];
  allowedFlags: string[];
} {
  const flags = sandboxAttribute
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const violations: string[] = [];

  for (const dangerous of PROHIBITED_SANDBOX_FLAGS) {
    if (flags.includes(dangerous)) {
      violations.push(`Forbidden dangerous sandbox flag detected: "${dangerous}"`);
    }
  }

  for (const required of REQUIRED_SANDBOX_FLAGS) {
    if (!flags.includes(required)) {
      violations.push(`Missing required sandbox security flag: "${required}"`);
    }
  }

  return {
    secure: violations.length === 0,
    violations,
    allowedFlags: flags,
  };
}

/**
 * Returns parent and sandbox origin configuration.
 */
export function getSandboxOriginConfig(): {
  parentOrigin: string;
  sandboxOrigin: string;
  isOriginIsolated: boolean;
} {
  const parentOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN || 'http://localhost:3000';
  const sandboxOrigin = process.env.NEXT_PUBLIC_SANDBOX_ORIGIN || 'http://localhost:5001';

  const isIsolated = verifyOriginIsolation(parentOrigin, sandboxOrigin);

  return {
    parentOrigin,
    sandboxOrigin,
    isOriginIsolated: isIsolated,
  };
}

/**
 * Verifies that the parent origin and untrusted iframe origin are strictly isolated.
 * Disallows identical origin for untrusted user-submitted executable game code.
 */
export function verifyOriginIsolation(parentOrigin: string, iframeOrigin: string): boolean {
  try {
    const parentUrl = new URL(parentOrigin);
    const iframeUrl = new URL(iframeOrigin);

    // If hostnames or ports differ, origins are isolated
    const isDifferentHost = parentUrl.hostname !== iframeUrl.hostname;
    const isDifferentPort = parentUrl.port !== iframeUrl.port;
    const isDifferentProtocol = parentUrl.protocol !== iframeUrl.protocol;

    return isDifferentHost || isDifferentPort || isDifferentProtocol;
  } catch {
    // If not parseable as absolute URLs, check string equality
    return parentOrigin.trim() !== iframeOrigin.trim();
  }
}

/**
 * Returns standard HTTP security headers for GameVerse.
 */
export function getStandardSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: data:; connect-src 'self' https:; frame-src 'self' http://localhost:5001 https://*.gameverse.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self';",
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-XSS-Protection': '1; mode=block',
  };
}

