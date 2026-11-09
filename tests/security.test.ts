import { describe, it, expect } from 'vitest';
import AdmZip from 'adm-zip';
import { validateAndScanZip, computeSha256 } from '../src/lib/security';

describe('Archive Security Scanner & ZIP Bomb Prevention', () => {
  it('should accept a valid game ZIP containing index.html and assets', () => {
    const zip = new AdmZip();
    zip.addFile('index.html', Buffer.from('<!DOCTYPE html><html><body><h1>Game</h1></body></html>'));
    zip.addFile('game.js', Buffer.from('console.log("running");'));
    zip.addFile('assets/sprite.png', Buffer.from('fake-png-bytes'));

    const buffer = zip.toBuffer();
    const result = validateAndScanZip(buffer);

    expect(result.passed).toBe(true);
    expect(result.hasEntryFile).toBe(true);
    expect(result.extractedFilesCount).toBe(3);
    expect(result.scanErrors.length).toBe(0);
    expect(result.sha256).toBeDefined();
  });

  it('should reject a ZIP archive that lacks index.html', () => {
    const zip = new AdmZip();
    zip.addFile('main.js', Buffer.from('console.log("no entry");'));
    zip.addFile('style.css', Buffer.from('body { color: red; }'));

    const buffer = zip.toBuffer();
    const result = validateAndScanZip(buffer);

    expect(result.passed).toBe(false);
    expect(result.hasEntryFile).toBe(false);
    expect(result.scanErrors).toContain('Missing required entry file "index.html" in the archive root.');
  });

  it('should flag and reject prohibited executable files (.exe, .dll, .bat)', () => {
    const zip = new AdmZip();
    zip.addFile('index.html', Buffer.from('<html></html>'));
    zip.addFile('malicious_payload.exe', Buffer.from('MZ...'));

    const buffer = zip.toBuffer();
    const result = validateAndScanZip(buffer);

    expect(result.passed).toBe(false);
    expect(result.suspiciousFilesDetected.length).toBeGreaterThan(0);
    expect(result.scanErrors.some((e) => e.includes('.exe'))).toBe(true);
  });

  it('should detect path traversal attempts with ../', () => {
    const zip = new AdmZip();
    zip.addFile('index.html', Buffer.from('<html></html>'));
    zip.addFile('exploit.txt', Buffer.from('root:x:0:0:...'));
    zip.getEntries()[1].entryName = '../etc/passwd';

    const buffer = zip.toBuffer();
    const result = validateAndScanZip(buffer);

    expect(result.passed).toBe(false);
    expect(result.suspiciousFilesDetected.some((s) => s.includes('Path traversal'))).toBe(true);
  });

  it('should correctly calculate deterministic SHA-256 checksums', () => {
    const testBuffer = Buffer.from('GameVerse Deterministic Build 2026');
    const checksum1 = computeSha256(testBuffer);
    const checksum2 = computeSha256(testBuffer);

    expect(checksum1).toBe(checksum2);
    expect(checksum1.length).toBe(64);
  });
});
