import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { validateAndScanZip, extractArchiveSafely, computeSha256 } from '../src/lib/security';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';

describe('Phase 4: Game Submission & Secure Archive Processing Pipeline', () => {
  const TEST_DEV_ID = 'usr-dev-1';
  const TEST_DEV_2_ID = 'usr-dev-2';

  beforeEach(() => {
    // Ensure test directories exist
    const testDir = path.join(process.cwd(), '.data', 'test_sandbox');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  it('1. should validate a legitimate HTML5 game archive with entry index.html and assets', () => {
    const zip = new AdmZip();
    zip.addFile('index.html', Buffer.from('<!DOCTYPE html><html><head><title>Space Blast</title></head><body><canvas id="game"></canvas></body></html>'));
    zip.addFile('js/main.js', Buffer.from('console.log("Game engine loaded");'));
    zip.addFile('assets/ship.png', Buffer.from('fake-png-data'));

    const buffer = zip.toBuffer();
    const scan = validateAndScanZip(buffer);

    expect(scan.passed).toBe(true);
    expect(scan.hasEntryFile).toBe(true);
    expect(scan.extractedFilesCount).toBe(3);
    expect(scan.scanErrors.length).toBe(0);
    expect(scan.sha256).toBeDefined();
    expect(scan.sha256.length).toBe(64);
  });

  it('2. should reject an archive with path traversal (Zip Slip exploit) during scan and extraction', () => {
    const zip = new AdmZip();
    zip.addFile('index.html', Buffer.from('<html></html>'));
    zip.addFile('harmless.txt', Buffer.from('data'));
    // Manually force path traversal entry name
    zip.getEntries()[1].entryName = '../../../../etc/shadow';

    const buffer = zip.toBuffer();
    const scan = validateAndScanZip(buffer);

    expect(scan.passed).toBe(false);
    expect(scan.suspiciousFilesDetected.some((s) => s.includes('Path traversal'))).toBe(true);

    // Extraction should also refuse to extract
    const targetDir = path.join(process.cwd(), '.data', 'test_sandbox', 'slip_target');
    const extractRes = extractArchiveSafely(buffer, targetDir);
    expect(extractRes.success).toBe(false);
  });

  it('3. should reject an archive with prohibited executables (.exe, .bat, .sh, .dll)', () => {
    const zip = new AdmZip();
    zip.addFile('index.html', Buffer.from('<html></html>'));
    zip.addFile('launcher.exe', Buffer.from('MZ...binary'));

    const buffer = zip.toBuffer();
    const scan = validateAndScanZip(buffer);

    expect(scan.passed).toBe(false);
    expect(scan.suspiciousFilesDetected.some((s) => s.includes('.exe'))).toBe(true);
    expect(scan.scanErrors.some((e) => e.includes('.exe'))).toBe(true);
  });

  it('4. should reject an archive that is missing the required root index.html', () => {
    const zip = new AdmZip();
    zip.addFile('app.js', Buffer.from('console.log("no html");'));
    zip.addFile('readme.txt', Buffer.from('docs'));

    const buffer = zip.toBuffer();
    const scan = validateAndScanZip(buffer);

    expect(scan.passed).toBe(false);
    expect(scan.hasEntryFile).toBe(false);
    expect(scan.scanErrors.some((e) => e.includes('index.html'))).toBe(true);
  });

  it('5. should safely extract a verified archive onto disk and verify file existence', () => {
    const zip = new AdmZip();
    zip.addFile('index.html', Buffer.from('<!DOCTYPE html><html><body><h1>Safe Game</h1></body></html>'));
    zip.addFile('bundle.js', Buffer.from('window.initGame = true;'));

    const buffer = zip.toBuffer();
    const extractTarget = path.join(process.cwd(), '.data', 'test_sandbox', 'extracted_game');

    const extractResult = extractArchiveSafely(buffer, extractTarget);
    expect(extractResult.success).toBe(true);
    expect(extractResult.filesExtracted).toBe(2);

    expect(fs.existsSync(path.join(extractTarget, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(extractTarget, 'bundle.js'))).toBe(true);

    const indexContent = fs.readFileSync(path.join(extractTarget, 'index.html'), 'utf-8');
    expect(indexContent).toContain('Safe Game');
  });

  it('6. should persist game, version, submission, and AI rights declaration into database', () => {
    const gameId = `game-retro-strike-${Date.now()}`;
    const versionId = `ver-retro-strike-1_0_0-${Date.now()}`;

    // 1. Create Game
    const game = gvDb.createGame({
      id: gameId,
      developerId: TEST_DEV_ID,
      developerName: 'PixelForge Studios',
      categoryId: 'cat-arcade',
      categoryName: 'Arcade',
      slug: `retro-strike-${Date.now()}`,
      title: 'Retro Strike 2026',
      shortDescription: 'Fast arcade shooter with retro synthwave music.',
      engine: 'Phaser 3 / HTML5 Canvas',
      orientation: 'LANDSCAPE',
      status: 'SUBMITTED',
      currentVersionId: versionId,
    });

    expect(game.id).toBe(gameId);
    expect(game.status).toBe('SUBMITTED');

    // 2. Create Version
    const version = gvDb.createVersion({
      id: versionId,
      gameId,
      versionNumber: '1.0.0',
      changelog: 'Initial public alpha release',
      archiveChecksum: computeSha256(Buffer.from('alpha-build')),
      archiveSizeBytes: 2048,
      status: 'SUBMITTED',
      scanResults: {
        passed: true,
        extractedFilesCount: 5,
        uncompressedSizeBytes: 10240,
        hasEntryFile: true,
        suspiciousFilesDetected: [],
      },
    });

    expect(version.id).toBe(versionId);
    expect(version.versionNumber).toBe('1.0.0');

    // 3. Create Rights Declaration with AI Disclosure
    const rights = gvDb.saveRightsDeclaration({
      versionId,
      aiDisclosure: 'AI_ASSISTED',
      thirdPartyAssetsDeclared: true,
      licensingNotes: 'Music from Incompetech CC-BY 3.0',
      rightsConfirmed: true,
    });

    expect(rights.aiDisclosure).toBe('AI_ASSISTED');
    expect(rights.rightsConfirmed).toBe(true);

    // 4. Create QA Submission
    const submission = gvDb.createSubmission({
      versionId,
      gameId,
      gameTitle: game.title,
      developerName: 'PixelForge Studios',
      manualNotes: 'Ready for operations QA review.',
    });

    expect(submission.status).toBe('SUBMITTED');
    expect(submission.gameId).toBe(gameId);
  });

  it('7. should enforce multi-tenant isolation on creator submissions', () => {
    // Submissions for Dev 1 should only return Dev 1's games
    const dev1Subs = gvDb.getSubmissionsByCreator(TEST_DEV_ID);
    const dev2Subs = gvDb.getSubmissionsByCreator(TEST_DEV_2_ID);

    // Verify Dev 2 cannot see Dev 1's submission records
    const dev1SubIds = new Set(dev1Subs.map((s) => s.id));
    for (const sub2 of dev2Subs) {
      expect(dev1SubIds.has(sub2.id)).toBe(false);
    }
  });

  it('8. should record audit logs for game submissions', () => {
    const log = gvDb.logAudit({
      actorId: TEST_DEV_ID,
      actorName: 'PixelForge Studios',
      action: 'SUBMIT_GAME',
      targetType: 'GAME_SUBMISSION',
      targetId: 'sub-test-audit',
      details: { title: 'Audit Test Game', version: '1.0.0' },
      ipAddress: '127.0.0.1',
    });

    expect(log.id).toBeDefined();
    expect(log.action).toBe('SUBMIT_GAME');

    const recentLogs = gvDb.getAuditLogs(10);
    expect(recentLogs.some((l) => l.action === 'SUBMIT_GAME')).toBe(true);
  });
});
