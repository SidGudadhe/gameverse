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
    const { decision, notes, rejectionReason } = body;

    if (!['APPROVE', 'REQUEST_CHANGES', 'REJECT'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review decision. Must be APPROVE, REQUEST_CHANGES, or REJECT.' },
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

      // 2. Update Version & Game
      updatedVersion = gvDb.updateVersion(submission.versionId, {
        status: 'CHANGES_REQUESTED',
      });
      updatedGame = gvDb.updateGame(submission.gameId, {
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

      // 2. Update Version & Game
      updatedVersion = gvDb.updateVersion(submission.versionId, {
        status: 'REJECTED',
      });
      updatedGame = gvDb.updateGame(submission.gameId, {
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
