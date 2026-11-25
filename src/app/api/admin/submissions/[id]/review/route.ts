import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Role Authorization (Moderator or Admin)
    const { user, errorResponse } = requireRole(req, 'MODERATOR');
    if (errorResponse) return errorResponse;
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const submission = gvDb.getSubmissionById(params.id);
    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { decision, notes, rejectionReason, quarantineReason, targetVersionId } = body;

    if (!['APPROVE', 'REQUEST_CHANGES', 'REJECT', 'QUARANTINE', 'ADMIN_ROLLBACK'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review decision. Must be APPROVE, REQUEST_CHANGES, REJECT, QUARANTINE, or ADMIN_ROLLBACK.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let updatedSubmission: any = null;
    let updatedGame: any = null;
    let updatedVersion: any = null;

    if (decision === 'APPROVE') {
      // 1. Update Submission
      updatedSubmission = gvDb.updateSubmissionStatus(params.id, 'APPROVED', {
        reviewedBy: user.name || 'System Moderator',
        manualNotes: notes || 'Verified sandbox compatibility, responsive viewport, and safety.',
      });

      // 2. Update Version to PUBLISHED
      updatedVersion = gvDb.updateVersion(submission.versionId, {
        status: 'PUBLISHED',
        publishedAt: now,
      });

      // 3. Update Game to PUBLISHED and set current version
      updatedGame = gvDb.updateGame(submission.gameId, {
        status: 'PUBLISHED',
        publishedAt: now,
        currentVersionId: submission.versionId,
      });

      // 4. Audit Log
      gvDb.logAudit({
        actorId: user.userId,
        actorName: user.name,
        action: 'APPROVE_GAME',
        targetType: 'GAME_SUBMISSION',
        targetId: submission.id,
        details: {
          gameId: submission.gameId,
          versionId: submission.versionId,
          gameTitle: submission.gameTitle,
          notes,
        },
        ipAddress: '127.0.0.1',
      });
    } else if (decision === 'REQUEST_CHANGES') {
      if (!notes) {
        return NextResponse.json(
          { success: false, error: 'Feedback notes explaining requested changes are required.' },
          { status: 400 }
        );
      }

      // 1. Update Submission
      updatedSubmission = gvDb.updateSubmissionStatus(params.id, 'CHANGES_REQUESTED', {
        reviewedBy: user.name || 'System Moderator',
        manualNotes: notes,
      });

      // 2. Update candidate Version status; keep an already-PUBLISHED game online if another live version is active
      updatedVersion = gvDb.updateVersion(submission.versionId, {
        status: 'CHANGES_REQUESTED',
      });
      const existingGame = gvDb.getGameById(submission.gameId);
      const hasDifferentLiveVersion = Boolean(
        existingGame &&
          existingGame.status === 'PUBLISHED' &&
          existingGame.currentVersionId &&
          existingGame.currentVersionId !== submission.versionId
      );
      updatedGame = hasDifferentLiveVersion
        ? existingGame
        : gvDb.updateGame(submission.gameId, {
            status: 'CHANGES_REQUESTED',
          });

      // 3. Audit Log
      gvDb.logAudit({
        actorId: user.userId,
        actorName: user.name,
        action: 'REQUEST_CHANGES_GAME',
        targetType: 'GAME_SUBMISSION',
        targetId: submission.id,
        details: {
          gameId: submission.gameId,
          versionId: submission.versionId,
          notes,
        },
        ipAddress: '127.0.0.1',
      });
    } else if (decision === 'REJECT') {
      const reason = rejectionReason || notes;
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'A clear rejection reason must be provided.' },
          { status: 400 }
        );
      }

      // 1. Update Submission
      updatedSubmission = gvDb.updateSubmissionStatus(params.id, 'REJECTED', {
        reviewedBy: user.name || 'System Moderator',
        rejectionReason: reason,
        manualNotes: notes,
      });

      // 2. Update candidate Version status; keep an already-PUBLISHED game online if another live version is active
      updatedVersion = gvDb.updateVersion(submission.versionId, {
        status: 'REJECTED',
      });
      const existingGame = gvDb.getGameById(submission.gameId);
      const hasDifferentLiveVersion = Boolean(
        existingGame &&
          existingGame.status === 'PUBLISHED' &&
          existingGame.currentVersionId &&
          existingGame.currentVersionId !== submission.versionId
      );
      updatedGame = hasDifferentLiveVersion
        ? existingGame
        : gvDb.updateGame(submission.gameId, {
            status: 'REJECTED',
          });

      // 3. Audit Log
      gvDb.logAudit({
        actorId: user.userId,
        actorName: user.name,
        action: 'REJECT_GAME',
        targetType: 'GAME_SUBMISSION',
        targetId: submission.id,
        details: {
          gameId: submission.gameId,
          versionId: submission.versionId,
          reason,
        },
        ipAddress: '127.0.0.1',
      });
    } else if (decision === 'QUARANTINE') {
      const reason = quarantineReason || rejectionReason || notes;
      if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
        return NextResponse.json(
          { success: false, error: 'A specific reason (minimum 5 chars) is required to quarantine this build.' },
          { status: 400 }
        );
      }

      // 1. Mark version as QUARANTINED
      updatedVersion = gvDb.updateVersion(submission.versionId, {
        status: 'QUARANTINED',
      });

      // 2. Mark submission as REJECTED with quarantine notes
      updatedSubmission = gvDb.updateSubmissionStatus(params.id, 'REJECTED', {
        reviewedBy: user.name || 'Security Moderator',
        rejectionReason: `[QUARANTINED]: ${reason}`,
        manualNotes: notes,
      });

      // 3. Check if quarantined version is the currently active live version
      const game = gvDb.getGameById(submission.gameId);
      if (game && game.currentVersionId === submission.versionId) {
        // Find latest safe approved or published version
        const versions = gvDb.getVersionsByGameId(submission.gameId);
        const safeVersion = versions
          .filter((v) => v.id !== submission.versionId && (v.status === 'PUBLISHED' || v.status === 'APPROVED'))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (safeVersion) {
          // Emergency rollback to previous safe version
          updatedGame = gvDb.updateGame(submission.gameId, {
            currentVersionId: safeVersion.id,
            status: 'PUBLISHED',
          });

          gvDb.recordRollback({
            gameId: submission.gameId,
            fromVersionId: submission.versionId,
            toVersionId: safeVersion.id,
            fromVersionNumber: updatedVersion?.versionNumber || 'quarantined',
            toVersionNumber: safeVersion.versionNumber,
            reason: `[AUTOMATIC EMERGENCY ROLLBACK] Quarantined build: ${reason}`,
            performedBy: user.userId,
            performedByName: user.name || 'Security Admin',
          });
        } else {
          // No prior safe build exists, suspend the entire game
          updatedGame = gvDb.updateGame(submission.gameId, {
            status: 'SUSPENDED',
          });
        }
      } else {
        updatedGame = game;
      }

      // 4. Audit Log
      gvDb.logAudit({
        actorId: user.userId,
        actorName: user.name,
        action: 'QUARANTINE_GAME_BUILD',
        targetType: 'GAME_BUILD',
        targetId: submission.versionId,
        details: {
          gameId: submission.gameId,
          versionId: submission.versionId,
          reason,
          revertedToVersionId: updatedGame?.currentVersionId,
        },
        ipAddress: '127.0.0.1',
      });
    } else if (decision === 'ADMIN_ROLLBACK') {
      if (!targetVersionId) {
        return NextResponse.json(
          { success: false, error: 'targetVersionId is required for admin rollback.' },
          { status: 400 }
        );
      }

      const targetVer = gvDb.getVersionById(targetVersionId);
      if (!targetVer || targetVer.gameId !== submission.gameId) {
        return NextResponse.json(
          { success: false, error: 'Target rollback version not found for this game.' },
          { status: 404 }
        );
      }

      const reason = notes || rejectionReason || 'Operational admin override rollback.';
      const currentGame = gvDb.getGameById(submission.gameId);
      const fromVerId = currentGame?.currentVersionId || submission.versionId;
      const fromVer = gvDb.getVersionById(fromVerId);

      updatedGame = gvDb.updateGame(submission.gameId, {
        currentVersionId: targetVer.id,
        status: 'PUBLISHED',
      });

      gvDb.recordRollback({
        gameId: submission.gameId,
        fromVersionId: fromVerId,
        toVersionId: targetVer.id,
        fromVersionNumber: fromVer?.versionNumber || 'unknown',
        toVersionNumber: targetVer.versionNumber,
        reason: `[ADMIN OVERRIDE] ${reason}`,
        performedBy: user.userId,
        performedByName: user.name || 'System Admin',
      });

      gvDb.logAudit({
        actorId: user.userId,
        actorName: user.name,
        action: 'ADMIN_ROLLBACK_VERSION',
        targetType: 'GAME_VERSION',
        targetId: targetVer.id,
        details: {
          gameId: submission.gameId,
          fromVersionId: fromVerId,
          toVersionId: targetVer.id,
          reason,
        },
        ipAddress: '127.0.0.1',
      });

      updatedVersion = targetVer;
      updatedSubmission = submission;
    }

    return NextResponse.json({
      success: true,
      message: `Submission successfully updated with decision: ${decision}`,
      submission: updatedSubmission,
      game: updatedGame,
      version: updatedVersion,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Review processing failed: ${err.message}` },
      { status: 500 }
    );
  }
}
