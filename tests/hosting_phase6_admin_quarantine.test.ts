import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';
import { GET as getSubmissionRoute } from '../src/app/api/admin/submissions/[id]/route';
import { POST as reviewSubmissionRoute } from '../src/app/api/admin/submissions/[id]/review/route';

describe('Phase 6: Admin Panel Extended Version Review & Emergency Quarantine', () => {
  const adminId = 'admin-qa-operator';
  const devId = 'dev-studio-99';
  let gameId = '';
  let adminToken = '';
  let devToken = '';

  let submissionId = '';
  let ver1Id = '';
  let ver2Id = '';

  beforeEach(() => {
    gameId = `game-quarantine-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Generate auth tokens
    adminToken = generateToken({
      userId: adminId,
      email: 'admin@gameverse.com',
      role: 'ADMIN',
      name: 'Security Admin',
    });

    devToken = generateToken({
      userId: devId,
      email: 'dev@studio.com',
      role: 'DEVELOPER',
      name: 'Indie Studio',
    });

    // 2. Seed Game
    const game = gvDb.createGame({
      id: gameId,
      title: 'Galactic Defense Protocol',
      slug: `galactic-defense-${Date.now()}`,
      description: 'Tactical fleet simulation.',
      category: 'STRATEGY',
      developerId: devId,
      developerName: 'Orbital Dynamics',
      engine: 'HTML5 Canvas',
      orientation: 'LANDSCAPE',
      status: 'PUBLISHED',
    });

    // 3. Seed Version 1 (Clean, Published Build)
    const ver1 = gvDb.createVersion({
      id: `ver-${Date.now()}-1`,
      gameId: game.id,
      versionNumber: '1.0.0',
      changelog: 'Initial stable fleet build',
      status: 'PUBLISHED',
      storagePrefix: `games/${game.id}/versions/1.0.0/`,
      entryPoint: 'index.html',
      totalSizeBytes: 1048576,
      fileCount: 5,
    });
    ver1Id = ver1.id;

    gvDb.updateGame(game.id, {
      currentVersionId: ver1.id,
      status: 'PUBLISHED',
    });

    // 4. Seed Version 2 (Compromised Update Build)
    const ver2 = gvDb.createVersion({
      id: `ver-${Date.now()}-2`,
      gameId: game.id,
      versionNumber: '2.0.0',
      changelog: 'Graphics overhaul and engine patch',
      status: 'SUBMITTED',
      storagePrefix: `games/${game.id}/versions/2.0.0/`,
      entryPoint: 'index.html',
      totalSizeBytes: 2097152,
      fileCount: 8,
    });
    ver2Id = ver2.id;

    // Seed Manifest for v2
    gvDb.createManifest({
      id: `mnf-${ver2.id}`,
      versionId: ver2.id,
      gameId: game.id,
      entryPoint: 'index.html',
      totalFilesCount: 8,
      totalSizeBytes: 2097152,
      manifestHash: 'sha256-mock-manifest-hash',
      files: [
        {
          path: 'index.html',
          sizeBytes: 1024,
          sha256: 'sha256-index-file',
          contentType: 'text/html; charset=utf-8',
          storageKey: `games/${game.id}/versions/2.0.0/index.html`,
          cdnUrl: `https://cdn.gameverse.com/games/${game.id}/versions/2.0.0/index.html`,
        },
        {
          path: 'game.js',
          sizeBytes: 2000000,
          sha256: 'sha256-game-file',
          contentType: 'application/javascript; charset=utf-8',
          storageKey: `games/${game.id}/versions/2.0.0/game.js`,
          cdnUrl: `https://cdn.gameverse.com/games/${game.id}/versions/2.0.0/game.js`,
        },
      ],
    });

    // 5. Seed Submission for v2
    const sub = gvDb.createSubmission({
      gameId: game.id,
      versionId: ver2.id,
      developerId: devId,
      developerName: 'Orbital Dynamics',
      gameTitle: 'Galactic Defense Protocol',
      status: 'SUBMITTED',
    });
    submissionId = sub.id;
  });

  describe('1. Role Authorization Checks', () => {
    it('should reject unauthenticated or developer requests with 401/403', async () => {
      // Developer cannot access admin submission details
      const reqDev = new NextRequest(`http://localhost:3000/api/admin/submissions/${submissionId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${devToken}` },
      });
      const resDev = await getSubmissionRoute(reqDev, { params: { id: submissionId } });
      expect(resDev.status).toBe(403);

      // Unauthenticated request
      const reqAnon = new NextRequest(`http://localhost:3000/api/admin/submissions/${submissionId}`, {
        method: 'GET',
      });
      const resAnon = await getSubmissionRoute(reqAnon, { params: { id: submissionId } });
      expect(resAnon.status).toBe(401);
    });
  });

  describe('2. Extended Admin Review Metadata & Manifest Inspection', () => {
    it('should return rich Phase 6 inspection data including manifest, allVersions, and rollbacks', async () => {
      const req = new NextRequest(`http://localhost:3000/api/admin/submissions/${submissionId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const res = await getSubmissionRoute(req, { params: { id: submissionId } });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.submission.id).toBe(submissionId);
      expect(data.game.id).toBe(gameId);
      expect(data.version.id).toBe(ver2Id);

      // Phase 6 Manifest verification
      expect(data.manifest).toBeDefined();
      expect(data.manifest.versionId).toBe(ver2Id);
      expect(data.manifest.files.length).toBe(2);
      expect(data.manifest.files[0].path).toBe('index.html');

      // Phase 6 Version history & Rollbacks
      expect(data.allVersions.length).toBeGreaterThanOrEqual(2);
      expect(data.allVersions.some((v: any) => v.id === ver1Id)).toBe(true);
      expect(data.allVersions.some((v: any) => v.id === ver2Id)).toBe(true);
    });
  });

  describe('3. Build Approval & Catalog Publishing', () => {
    it('should approve submission and atomically publish version 2.0.0', async () => {
      const req = new NextRequest(`http://localhost:3000/api/admin/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          decision: 'APPROVE',
          notes: 'Tested in 16:9 sandbox. 60 FPS verified, zero memory leaks.',
        }),
      });

      const res = await reviewSubmissionRoute(req, { params: { id: submissionId } });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.version.status).toBe('PUBLISHED');
      expect(data.game.currentVersionId).toBe(ver2Id);

      // Verify DB state
      const updatedGame = gvDb.getGameById(gameId);
      expect(updatedGame?.currentVersionId).toBe(ver2Id);
    });
  });

  describe('4. Emergency Quarantine & Automatic Fallback', () => {
    it('should reject quarantine request if mandatory reason is missing or too short', async () => {
      const req = new NextRequest(`http://localhost:3000/api/admin/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          decision: 'QUARANTINE',
          quarantineReason: 'bad', // < 5 chars
        }),
      });

      const res = await reviewSubmissionRoute(req, { params: { id: submissionId } });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('minimum 5 chars');
    });

    it('should quarantine active compromised build and automatically roll back to previous safe version', async () => {
      // 1. First make v2 active
      gvDb.updateGame(gameId, { currentVersionId: ver2Id, status: 'PUBLISHED' });
      gvDb.updateVersion(ver2Id, { status: 'PUBLISHED' });

      expect(gvDb.getGameById(gameId)?.currentVersionId).toBe(ver2Id);

      // 2. Admin detects malicious behavior in v2 and issues EMERGENCY QUARANTINE
      const req = new NextRequest(`http://localhost:3000/api/admin/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          decision: 'QUARANTINE',
          quarantineReason: 'Detected unauthorized outbound cryptomining socket in engine bundle',
        }),
      });

      const res = await reviewSubmissionRoute(req, { params: { id: submissionId } });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.version.status).toBe('QUARANTINED');

      // Crucial: The game must have automatically rolled back to ver1 (v1.0.0)
      const restoredGame = gvDb.getGameById(gameId);
      expect(restoredGame?.currentVersionId).toBe(ver1Id);
      expect(restoredGame?.status).toBe('PUBLISHED');

      // Verify audit trail recorded emergency rollback
      const rollbacks = gvDb.getRollbackHistory(gameId);
      expect(rollbacks.length).toBeGreaterThan(0);
      expect(rollbacks[0].reason).toContain('AUTOMATIC EMERGENCY ROLLBACK');
      expect(rollbacks[0].toVersionId).toBe(ver1Id);
    });

    it('should suspend game completely if quarantined version has no prior safe build', () => {
      const singleGameId = `game-single-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const singleVer = gvDb.createVersion({
        id: `ver-solo-${Date.now()}`,
        gameId: singleGameId,
        versionNumber: '1.0.0',
        status: 'PUBLISHED',
      });

      gvDb.createGame({
        id: singleGameId,
        title: 'Solo Title',
        slug: `solo-title-${Date.now()}`,
        developerId: devId,
        status: 'PUBLISHED',
        currentVersionId: singleVer.id,
      });

      const soloSub = gvDb.createSubmission({
        gameId: singleGameId,
        versionId: singleVer.id,
        developerId: devId,
        gameTitle: 'Solo Title',
        status: 'SUBMITTED',
      });

      // Quarantine solo version
      const req = new NextRequest(`http://localhost:3000/api/admin/submissions/${soloSub.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          decision: 'QUARANTINE',
          quarantineReason: 'Malicious payload in index.html',
        }),
      });

      return reviewSubmissionRoute(req, { params: { id: soloSub.id } }).then(async (res) => {
        expect(res.status).toBe(200);
        // Since there was no prior safe version, the entire game is suspended
        const gameAfter = gvDb.getGameById(singleGameId);
        expect(gameAfter?.status).toBe('SUSPENDED');
      });
    });
  });

  describe('5. Admin Direct Rollback Override', () => {
    it('should allow admin to manually force rollback to a known good build', async () => {
      // Game currently points to ver2
      gvDb.updateGame(gameId, { currentVersionId: ver2Id, status: 'PUBLISHED' });

      const req = new NextRequest(`http://localhost:3000/api/admin/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          decision: 'ADMIN_ROLLBACK',
          targetVersionId: ver1Id,
          notes: 'Admin manual rollback due to player regression reports on level 3',
        }),
      });

      const res = await reviewSubmissionRoute(req, { params: { id: submissionId } });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);

      const revertedGame = gvDb.getGameById(gameId);
      expect(revertedGame?.currentVersionId).toBe(ver1Id);

      const rollbacks = gvDb.getRollbackHistory(gameId);
      expect(rollbacks.some((r) => r.reason.includes('ADMIN OVERRIDE'))).toBe(true);
    });
  });
});
