import { describe, it, expect, beforeEach } from 'vitest';
import { gvDb } from '../src/lib/database';
import { generateToken, hasRequiredRole } from '../src/lib/auth';

describe('Phase 5: Admin Portal & QA Review Workspace', () => {
  const ADMIN_USER_ID = 'usr-admin-1';
  const MODERATOR_USER_ID = 'usr-mod-1';
  const DEVELOPER_USER_ID = 'usr-dev-1';
  const PLAYER_USER_ID = 'usr-player-1';

  let testSubmissionId: string;
  let testGameId: string;
  let testVersionId: string;

  beforeEach(() => {
    // Set up a fresh test game submission for each test
    testGameId = `game-qa-test-${Date.now()}`;
    testVersionId = `ver-qa-test-${Date.now()}`;

    const game = gvDb.createGame({
      id: testGameId,
      developerId: DEVELOPER_USER_ID,
      developerName: 'PixelForge Studios',
      categoryId: 'cat-arcade',
      categoryName: 'Arcade',
      slug: `qa-test-runner-${Date.now()}`,
      title: 'QA Test Runner',
      shortDescription: 'Game for QA review testing.',
      status: 'SUBMITTED',
      currentVersionId: testVersionId,
    });

    const version = gvDb.createVersion({
      id: testVersionId,
      gameId: testGameId,
      versionNumber: '1.0.0',
      status: 'SUBMITTED',
      archiveChecksum: 'a1b2c3d4e5f6',
      archiveSizeBytes: 1048576,
    });

    const submission = gvDb.createSubmission({
      versionId: testVersionId,
      gameId: testGameId,
      gameTitle: game.title,
      developerName: 'PixelForge Studios',
      manualNotes: 'Initial QA build for Phase 5 verification',
    });

    testSubmissionId = submission.id;
  });

  it('1. should enforce RBAC role hierarchy: only MODERATOR or ADMIN can access QA review', () => {
    expect(hasRequiredRole('ADMIN', 'MODERATOR')).toBe(true);
    expect(hasRequiredRole('SUPER_ADMIN', 'MODERATOR')).toBe(true);
    expect(hasRequiredRole('MODERATOR', 'MODERATOR')).toBe(true);

    // Standard player and developer cannot perform moderator actions
    expect(hasRequiredRole('PLAYER', 'MODERATOR')).toBe(false);
    expect(hasRequiredRole('DEVELOPER', 'MODERATOR')).toBe(false);
    expect(hasRequiredRole('GUEST', 'MODERATOR')).toBe(false);
  });

  it('2. should list all submissions across all developers for administrative overview', () => {
    const allSubs = gvDb.getSubmissions();
    expect(allSubs.length).toBeGreaterThan(0);
    expect(allSubs.some((s) => s.id === testSubmissionId)).toBe(true);
  });

  it('3. should transition build to APPROVED and publish game and version to the catalog', () => {
    const updatedSub = gvDb.updateSubmissionStatus(testSubmissionId, 'APPROVED', {
      reviewedBy: 'Lead QA Admin',
      manualNotes: 'Controls verified at 60 FPS. Zero CSP issues.',
    });

    expect(updatedSub).toBeDefined();
    expect(updatedSub?.status).toBe('APPROVED');
    expect(updatedSub?.reviewedBy).toBe('Lead QA Admin');

    // Update version to PUBLISHED
    const updatedVer = gvDb.updateVersion(testVersionId, {
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
    });
    expect(updatedVer?.status).toBe('PUBLISHED');

    // Update game to PUBLISHED
    const updatedGame = gvDb.updateGame(testGameId, {
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
      currentVersionId: testVersionId,
    });
    expect(updatedGame?.status).toBe('PUBLISHED');

    // Verify audit log
    const auditLog = gvDb.logAudit({
      actorId: ADMIN_USER_ID,
      actorName: 'System Admin',
      action: 'APPROVE_GAME',
      targetType: 'GAME_SUBMISSION',
      targetId: testSubmissionId,
      details: { title: 'QA Test Runner', version: '1.0.0' },
      ipAddress: '127.0.0.1',
    });
    expect(auditLog.action).toBe('APPROVE_GAME');
  });

  it('4. should transition build to CHANGES_REQUESTED with reviewer feedback', () => {
    const updatedSub = gvDb.updateSubmissionStatus(testSubmissionId, 'CHANGES_REQUESTED', {
      reviewedBy: 'Lead QA Admin',
      manualNotes: 'Audio is missing in Chrome due to unhandled AudioContext resume. Please fix and resubmit.',
    });

    expect(updatedSub?.status).toBe('CHANGES_REQUESTED');
    expect(updatedSub?.manualNotes).toContain('AudioContext resume');

    gvDb.updateVersion(testVersionId, { status: 'CHANGES_REQUESTED' });
    gvDb.updateGame(testGameId, { status: 'CHANGES_REQUESTED' });

    const fetchedGame = gvDb.getGameById(testGameId);
    expect(fetchedGame?.status).toBe('CHANGES_REQUESTED');
  });

  it('5. should transition build to REJECTED with recorded rejection reason', () => {
    const updatedSub = gvDb.updateSubmissionStatus(testSubmissionId, 'REJECTED', {
      reviewedBy: 'Lead QA Admin',
      rejectionReason: 'Violates platform safety policy: External unauthorized tracking script detected.',
      manualNotes: 'Third party analytics endpoint blocked by CSP.',
    });

    expect(updatedSub?.status).toBe('REJECTED');
    expect(updatedSub?.rejectionReason).toContain('Violates platform safety policy');

    gvDb.updateVersion(testVersionId, { status: 'REJECTED' });
    gvDb.updateGame(testGameId, { status: 'REJECTED' });

    const fetchedGame = gvDb.getGameById(testGameId);
    expect(fetchedGame?.status).toBe('REJECTED');

    // Verify audit log
    const auditLog = gvDb.logAudit({
      actorId: ADMIN_USER_ID,
      actorName: 'System Admin',
      action: 'REJECT_GAME',
      targetType: 'GAME_SUBMISSION',
      targetId: testSubmissionId,
      details: { reason: 'Policy violation' },
      ipAddress: '127.0.0.1',
    });
    expect(auditLog.action).toBe('REJECT_GAME');
  });

  it('6. should retrieve submission details with linked game and version info', () => {
    const sub = gvDb.getSubmissionById(testSubmissionId);
    expect(sub).toBeDefined();

    const game = gvDb.getGameById(sub!.gameId);
    expect(game).toBeDefined();
    expect(game?.id).toBe(testGameId);

    const version = gvDb.getVersionById(sub!.versionId);
    expect(version).toBeDefined();
    expect(version?.id).toBe(testVersionId);
  });
});
