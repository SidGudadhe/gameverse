import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { generateToken } from '../src/lib/auth';
import {
  scanAndValidateGameZip,
  validateZipBuffer,
  buildGameFileManifest,
} from '../src/lib/storage/scanner';
import { gameverseStorage } from '../src/lib/storage';
import { gvDb } from '../src/lib/database';
import AdmZip from 'adm-zip';

import { POST as createSessionRoute } from '../src/app/api/developer/upload/session/route';
import { PUT as presignedUploadRoute } from '../src/app/api/developer/upload/presigned/route';
import { POST as processUploadRoute } from '../src/app/api/developer/upload/process/route';
import { GET as getVersionsRoute, POST as createVersionRoute } from '../src/app/api/developer/games/[id]/versions/route';
import { POST as publishVersionRoute } from '../src/app/api/developer/games/[id]/publish/route';
import { POST as rollbackVersionRoute } from '../src/app/api/developer/games/[id]/rollback/route';
import { GET as getGameSlugRoute } from '../src/app/api/games/[slug]/route';
import { GET as sandboxFilesRoute } from '../src/app/api/sandbox/files/[gameId]/[versionId]/[...file]/route';

describe('Phase 2: Game Upload, Deep Security Scanning & Version Lifecycle', () => {
  const testGameId = 'test-game-p2';
  const testDevId = 'dev-test-123';

  beforeAll(() => {
    // Clean up version 3.0.0 for testGameId so end-to-end version creation is idempotent
    if (gvDb.state.versions) {
      gvDb.state.versions = gvDb.state.versions.filter(
        (v) => !(v.gameId === testGameId && v.versionNumber === '3.0.0')
      );
    }

    // Register test developer and game in gvDb
    const existingGame = gvDb.getGameById(testGameId);
    if (!existingGame) {
      gvDb.createGame({
        id: testGameId,
        title: 'Velocity Strike Turbo',
        slug: 'velocity-strike-turbo',
        description: 'High-speed anti-gravity racing simulation.',
        category: 'RACING',
        developerId: testDevId,
        developerName: 'CyberPulse Studios',
        engine: 'HTML5 Canvas',
        orientation: 'LANDSCAPE',
        status: 'PUBLISHED',
      });
    }
  });

  describe('1. ZIP Magic Bytes & Archive Integrity Validation', () => {
    it('should approve valid ZIP file starting with PK magic bytes', () => {
      const zip = new AdmZip();
      zip.addFile('index.html', Buffer.from('<!DOCTYPE html><html><body><h1>Game</h1></body></html>', 'utf-8'));
      zip.addFile('game.js', Buffer.from('console.log("game started");', 'utf-8'));
      const buffer = zip.toBuffer();

      const validation = validateZipBuffer(buffer);
      expect(validation.isValid).toBe(true);
      expect(validation.magicBytesDetected).toBe(true);
    });

    it('should reject non-ZIP files disguised with .zip extension (missing PK magic bytes)', () => {
      const fakeZip = Buffer.from('This is a plain text file pretending to be a game zip', 'utf-8');
      const validation = validateZipBuffer(fakeZip);
      expect(validation.isValid).toBe(false);
      expect(validation.magicBytesDetected).toBe(false);
      expect(validation.error).toContain('magic bytes');
    });

    it('should reject corrupted or truncated buffers smaller than 22 bytes', () => {
      const tinyBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const validation = validateZipBuffer(tinyBuffer);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('truncated');
    });
  });

  describe('2. Deep Security Scanning (Zip Slip, Malware, Bombs, Missing Entry)', () => {
    it('should reject archives with Zip Slip / path traversal attacks (../)', async () => {
      const zip = new AdmZip();
      zip.addFile('index.html', Buffer.from('<h1>Game</h1>', 'utf-8'));
      zip.addFile('payload.txt', Buffer.from('root:x:0:0:', 'utf-8'));
      // Inject actual Zip Slip traversal sequence into raw archive entry header
      const entries = zip.getEntries();
      const payloadEntry = entries.find((e) => e.entryName === 'payload.txt');
      if (payloadEntry) {
        payloadEntry.entryName = '../../../../etc/passwd';
      }
      const buffer = zip.toBuffer();

      const result = await scanAndValidateGameZip(buffer);
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.rule === 'PATH_TRAVERSAL_DETECTED')).toBe(true);
    });

    it('should reject archives containing prohibited executable files (.exe, .bat, .sh, .dll)', async () => {
      const zip = new AdmZip();
      zip.addFile('index.html', Buffer.from('<h1>Game</h1>', 'utf-8'));
      zip.addFile('assets/payload.exe', Buffer.from('MZ000000', 'utf-8'));
      zip.addFile('scripts/runner.bat', Buffer.from('@echo off', 'utf-8'));
      const buffer = zip.toBuffer();

      const result = await scanAndValidateGameZip(buffer);
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.rule === 'PROHIBITED_FILE_TYPE')).toBe(true);
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject archives missing the root entry point (index.html)', async () => {
      const zip = new AdmZip();
      zip.addFile('main.js', Buffer.from('console.log("no html");', 'utf-8'));
      zip.addFile('styles.css', Buffer.from('body { color: red; }', 'utf-8'));
      const buffer = zip.toBuffer();

      const result = await scanAndValidateGameZip(buffer);
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.rule === 'MISSING_ENTRY_POINT')).toBe(true);
    });

    it('should successfully scan clean game build and extract file metadata', async () => {
      const zip = new AdmZip();
      zip.addFile('index.html', Buffer.from('<!DOCTYPE html><html><head><script src="app.js"></script><link rel="stylesheet" href="style.css"></head><body><canvas id="c"></canvas></body></html>', 'utf-8'));
      zip.addFile('app.js', Buffer.from('const canvas = document.getElementById("c");', 'utf-8'));
      zip.addFile('style.css', Buffer.from('body { background: #000; }', 'utf-8'));
      const buffer = zip.toBuffer();

      const result = await scanAndValidateGameZip(buffer);
      expect(result.passed).toBe(true);
      expect(result.violations.length).toBe(0);
      expect(result.entryPointFound).toBe(true);
      expect(result.fileCount).toBe(3);
      expect(result.sha256).toBeDefined();
      expect(result.sha256.length).toBe(64);
    });
  });

  describe('3. Build Manifest & Checksum Generation', () => {
    it('should generate deterministic SHA-256 hashes and MIME types for all game assets', () => {
      const files = [
        { path: 'index.html', content: Buffer.from('<!DOCTYPE html><html></html>', 'utf-8') },
        { path: 'js/main.js', content: Buffer.from('console.log("ready");', 'utf-8') },
        { path: 'css/main.css', content: Buffer.from('body { margin: 0; }', 'utf-8') },
        { path: 'assets/logo.png', content: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
      ];

      const manifest = buildGameFileManifest(testGameId, 'v1.0.0', files);
      expect(manifest.gameId).toBe(testGameId);
      expect(manifest.versionId).toBe('v1.0.0');
      expect(manifest.entryPoint).toBe('index.html');
      expect(manifest.files.length).toBe(4);
      expect(manifest.totalSizeBytes).toBeGreaterThan(0);

      const htmlEntry = manifest.files.find((f) => f.path === 'index.html');
      expect(htmlEntry?.contentType).toBe('text/html; charset=utf-8');
      expect(htmlEntry?.sha256).toBeDefined();

      const jsEntry = manifest.files.find((f) => f.path === 'js/main.js');
      expect(jsEntry?.contentType).toBe('application/javascript; charset=utf-8');

      const pngEntry = manifest.files.find((f) => f.path === 'assets/logo.png');
      expect(pngEntry?.contentType).toBe('image/png');
    });
  });

  describe('4. Presigned Upload Session & Database Storage Tracking', () => {
    it('should create upload session and record it in database', () => {
      const session = gvDb.createUploadSession({
        id: `sess-${Date.now()}`,
        developerId: testDevId,
        gameId: testGameId,
        fileName: 'build-v1.zip',
        fileSizeBytes: 2048576,
        contentType: 'application/zip',
        storageKey: `uploads/${testDevId}/build-v1.zip`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'PENDING_UPLOAD',
      });

      expect(session.id).toBeDefined();
      expect(session.status).toBe('PENDING_UPLOAD');

      const retrieved = gvDb.getUploadSessionById(session.id);
      expect(retrieved?.fileName).toBe('build-v1.zip');

      // Update session status to PROCESSING then COMPLETED
      gvDb.updateUploadSessionStatus(session.id, 'PROCESSING');
      expect(gvDb.getUploadSessionById(session.id)?.status).toBe('PROCESSING');

      gvDb.updateUploadSessionStatus(session.id, 'COMPLETED', {
        sha256: 'mock-sha-256-string',
        fileCount: 15,
      });
      const completed = gvDb.getUploadSessionById(session.id);
      expect(completed?.status).toBe('COMPLETED');
      expect(completed?.metadata?.fileCount).toBe(15);
    });
  });

  describe('5. Developer Version Lifecycle (No Overwrites & Immutable Builds)', () => {
    it('should create v1 and v2 builds without overwriting previous versions', async () => {
      // 1. Upload assets for v1
      const v1Key = gameverseStorage.getGameAssetStorageKey(testGameId, 'v1.0.0', 'index.html');
      await gameverseStorage.uploadObject(
        v1Key,
        Buffer.from('<html><body>v1.0.0</body></html>', 'utf-8'),
        'text/html; charset=utf-8'
      );

      // Create v1 record in DB
      const version1 = gvDb.createVersion({
        id: 'ver-p2-v1',
        gameId: testGameId,
        versionNumber: '1.0.0',
        changelog: 'Initial release',
        status: 'PUBLISHED',
        storagePrefix: `games/${testGameId}/versions/v1.0.0/`,
        entryPoint: 'index.html',
        totalSizeBytes: 1024,
        fileCount: 1,
        archiveChecksum: 'sha256-v1-hash',
      });

      // Point game to v1
      gvDb.updateGame(testGameId, {
        currentVersionId: version1.id,
        status: 'PUBLISHED',
      });

      // 2. Upload assets for v2 (new version build)
      const v2Key = gameverseStorage.getGameAssetStorageKey(testGameId, 'v2.0.0', 'index.html');
      await gameverseStorage.uploadObject(
        v2Key,
        Buffer.from('<html><body>v2.0.0 with Turbo Engine</body></html>', 'utf-8'),
        'text/html; charset=utf-8'
      );

      const version2 = gvDb.createVersion({
        id: 'ver-p2-v2',
        gameId: testGameId,
        versionNumber: '2.0.0',
        changelog: 'Turbo engine upgrade',
        status: 'SUBMITTED',
        storagePrefix: `games/${testGameId}/versions/v2.0.0/`,
        entryPoint: 'index.html',
        totalSizeBytes: 2048,
        fileCount: 2,
        archiveChecksum: 'sha256-v2-hash',
      });

      // Verify both version objects coexist in storage without overwrite
      const objV1 = await gameverseStorage.getObject(v1Key);
      const objV2 = await gameverseStorage.getObject(v2Key);

      expect(objV1?.body.toString('utf-8')).toBe('<html><body>v1.0.0</body></html>');
      expect(objV2?.body.toString('utf-8')).toBe('<html><body>v2.0.0 with Turbo Engine</body></html>');

      // Verify versions list in database
      const versions = gvDb.getVersionsByGameId(testGameId);
      expect(versions.length).toBeGreaterThanOrEqual(2);
      expect(versions.some((v) => v.versionNumber === '1.0.0')).toBe(true);
      expect(versions.some((v) => v.versionNumber === '2.0.0')).toBe(true);
    });

    it('should support atomic publishing to promote v2 as active version', () => {
      // Game initially points to v1
      const initialGame = gvDb.getGameById(testGameId);
      expect(initialGame?.currentVersionId).toBe('ver-p2-v1');

      // Promote v2
      gvDb.updateGame(testGameId, {
        currentVersionId: 'ver-p2-v2',
        status: 'PUBLISHED',
      });
      gvDb.updateVersion('ver-p2-v2', {
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
      });

      const updatedGame = gvDb.getGameById(testGameId);
      expect(updatedGame?.currentVersionId).toBe('ver-p2-v2');

      // Previous version record remains intact
      const v1 = gvDb.getVersionById('ver-p2-v1');
      expect(v1).toBeDefined();
      expect(v1?.versionNumber).toBe('1.0.0');
    });

    it('should execute instant atomic rollback to v1 with audit trail', () => {
      const rollbackRecord = gvDb.createRollbackRecord({
        id: `rb-${Date.now()}`,
        gameId: testGameId,
        fromVersionId: 'ver-p2-v2',
        toVersionId: 'ver-p2-v1',
        fromVersionNumber: '2.0.0',
        toVersionNumber: '1.0.0',
        reason: 'Audio desynchronization in webgl context on v2.0.0',
        performedBy: testDevId,
        performedByName: 'Lead Developer',
      });

      expect(rollbackRecord.id).toBeDefined();

      // Atomically switch active version pointer back to v1
      gvDb.updateGame(testGameId, {
        currentVersionId: 'ver-p2-v1',
      });

      const revertedGame = gvDb.getGameById(testGameId);
      expect(revertedGame?.currentVersionId).toBe('ver-p2-v1');

      // Verify rollback history
      const rollbacks = gvDb.getRollbackHistory(testGameId);
      expect(rollbacks.length).toBeGreaterThan(0);
      expect(rollbacks[0].reason).toContain('Audio desynchronization');
    });
  });

  describe('6. CDN & Player URL Offloading', () => {
    it('should construct direct CDN URLs offloading static asset traffic from Next.js server', () => {
      const game = gvDb.getGameById(testGameId);
      expect(game).toBeDefined();

      const version = gvDb.getVersionById(game!.currentVersionId!);
      expect(version).toBeDefined();

      const stableUrl = gameverseStorage.getStableGamePlayerUrl(game!.slug);
      expect(stableUrl).toBe(`https://play.gameverse.com/${game!.slug}/`);

      const cdnAssetUrl = gameverseStorage.getCdnUrl(
        gameverseStorage.getGameAssetStorageKey(game!.id, version!.versionNumber, 'index.html')
      );
      expect(cdnAssetUrl).toBe(
        `https://cdn.gameverse.com/games/${game!.id}/versions/${version!.versionNumber}/index.html`
      );
    });
  });

  describe('7. End-to-End API Route Handlers Workflow', () => {
    const devToken = generateToken({
      userId: testDevId,
      email: 'dev@cyberpulse.com',
      role: 'DEVELOPER',
      name: 'CyberPulse Studios',
    });

    let createdSessionId = '';
    let presignedUrl = '';
    let storageKey = '';
    let newVersionId = '';

    it('should create an upload session via POST /api/developer/upload/session', async () => {
      const req = new NextRequest('http://localhost:3000/api/developer/upload/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken}`,
        },
        body: JSON.stringify({
          gameId: testGameId,
          fileName: 'game-build-v3.0.0.zip',
          fileSizeBytes: 1048576,
          versionNumber: '3.0.0',
        }),
      });

      const res = await createSessionRoute(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.session.id).toBeDefined();
      expect(data.session.uploadUrl).toBeDefined();
      expect(data.session.storageKey).toContain(testGameId);

      createdSessionId = data.session.id;
      presignedUrl = data.session.uploadUrl;
      storageKey = data.session.storageKey;
    });

    it('should upload binary game archive via PUT /api/developer/upload/presigned', async () => {
      const zip = new AdmZip();
      zip.addFile(
        'index.html',
        Buffer.from('<!DOCTYPE html><html><body><h1>Turbo v3.0.0</h1></body></html>', 'utf-8')
      );
      zip.addFile('engine.js', Buffer.from('console.log("Engine v3 initialized");', 'utf-8'));
      const zipBuffer = zip.toBuffer();

      const uploadUrlObj = new URL(presignedUrl);
      const req = new NextRequest(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/zip',
        },
        body: zipBuffer,
      });

      const res = await presignedUploadRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.key).toBe(storageKey);
    });

    it('should process and scan the uploaded session via POST /api/developer/upload/process', async () => {
      const req = new NextRequest('http://localhost:3000/api/developer/upload/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken}`,
        },
        body: JSON.stringify({
          sessionId: createdSessionId,
          gameId: testGameId,
          versionNumber: '3.0.0',
        }),
      });

      const res = await processUploadRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.scanResult.passed).toBe(true);
      expect(data.scanResult.hasEntryFile).toBe(true);
      expect(data.session.status).toBe('COMPLETED');
    });

    it('should create new version build via POST /api/developer/games/[id]/versions', async () => {
      const req = new NextRequest(`http://localhost:3000/api/developer/games/${testGameId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken}`,
        },
        body: JSON.stringify({
          versionNumber: '3.0.0',
          changelog: 'Complete 60 FPS graphics rewrite and multiplayer netcode',
          uploadSessionId: createdSessionId,
        }),
      });

      const res = await createVersionRoute(req, { params: { id: testGameId } });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.version.versionNumber).toBe('3.0.0');
      expect(data.manifest).toBeDefined();

      newVersionId = data.version.id;
    });

    it('should list all versions via GET /api/developer/games/[id]/versions', async () => {
      const req = new NextRequest(`http://localhost:3000/api/developer/games/${testGameId}/versions`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${devToken}`,
        },
      });

      const res = await getVersionsRoute(req, { params: { id: testGameId } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.versions.length).toBeGreaterThanOrEqual(3);
      expect(data.versions.some((v: any) => v.versionNumber === '3.0.0')).toBe(true);
    });

    it('should atomically publish version 3.0.0 via POST /api/developer/games/[id]/publish', async () => {
      // Approve version 3.0.0 to simulate completed QA review
      gvDb.updateVersion(newVersionId, { status: 'APPROVED' });

      const req = new NextRequest(`http://localhost:3000/api/developer/games/${testGameId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken}`,
        },
        body: JSON.stringify({
          versionId: newVersionId,
        }),
      });

      const res = await publishVersionRoute(req, { params: { id: testGameId } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.game.currentVersionId).toBe(newVersionId);
    });

    it('should resolve public CDN url for players via GET /api/games/[slug]', async () => {
      const req = new NextRequest(`http://localhost:3000/api/games/velocity-strike-turbo`);
      const res = await getGameSlugRoute(req, { params: { slug: 'velocity-strike-turbo' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.game.slug).toBe('velocity-strike-turbo');
      expect(data.cdnUrl).toBeDefined();
      expect(data.cdnUrl).toContain('cdn.gameverse.com');
      expect(data.stableGameUrl).toBe('https://play.gameverse.com/velocity-strike-turbo/');
    });

    it('should atomically rollback to previous version via POST /api/developer/games/[id]/rollback', async () => {
      const req = new NextRequest(`http://localhost:3000/api/developer/games/${testGameId}/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken}`,
        },
        body: JSON.stringify({
          targetVersionId: 'ver-p2-v1',
          reason: 'Emergency rollback: GPU driver conflict on MacOS Safari in v3.0.0',
        }),
      });

      const res = await rollbackVersionRoute(req, { params: { id: testGameId } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.game.currentVersionId).toBe('ver-p2-v1');
      expect(data.rollbackRecord.reason).toContain('GPU driver conflict');
    });

    it('should serve files through sandboxed route with security headers', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/sandbox/files/${testGameId}/${newVersionId}/index.html`
      );
      const res = await sandboxFilesRoute(req, {
        params: { gameId: testGameId, versionId: newVersionId, file: ['index.html'] },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/html');
      expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });
});
