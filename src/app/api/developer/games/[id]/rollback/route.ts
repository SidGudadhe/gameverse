import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const game = gvDb.getGameById(params.id) || gvDb.getGameBySlug(params.id);
    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found.' }, { status: 404 });
    }

    if (game.developerId !== user.userId && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Access denied: not your game.' }, { status: 403 });
    }

    const body = await req.json();
    const { targetVersionId, reason } = body;

    if (!targetVersionId) {
      return NextResponse.json({ success: false, error: 'Missing targetVersionId for rollback.' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'A specific operational rollback reason (minimum 5 chars) is mandatory for audit compliance.' },
        { status: 400 }
      );
    }

    if (game.status === 'SUSPENDED' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Suspended games cannot be rolled back or republished without Admin review.' },
        { status: 403 }
      );
    }

    const targetVersion = gvDb.getVersionById(targetVersionId);
    if (!targetVersion || targetVersion.gameId !== game.id) {
      return NextResponse.json(
        { success: false, error: 'Target rollback version not found for this game.' },
        { status: 404 }
      );
    }

    if (
      targetVersion.status !== 'APPROVED' &&
      targetVersion.status !== 'PUBLISHED' &&
      user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Rollback denied: version ${targetVersion.versionNumber} is not QA-approved (status: ${targetVersion.status}).`,
        },
        { status: 403 }
      );
    }

    if (targetVersion.id === game.currentVersionId) {
      return NextResponse.json(
        { success: false, error: 'The specified version is already the active published version.' },
        { status: 400 }
      );
    }

    const fromVersionId = game.currentVersionId || 'unknown';

    // Atomically revert published version pointer
    const updatedGame = gvDb.updateGame(game.id, {
      currentVersionId: targetVersion.id,
      status: 'PUBLISHED',
      updatedAt: new Date().toISOString(),
    });

    // Record immutable rollback event in database
    const rollbackRecord = gvDb.recordRollback({
      gameId: game.id,
      fromVersionId,
      toVersionId: targetVersion.id,
      triggeredBy: user.userId,
      triggeredByName: user.name,
      triggeredByRole: user.role,
      reason: reason.trim(),
    });

    // Audit log
    gvDb.logAudit({
      actorId: user.userId,
      actorName: user.name,
      action: 'ROLLBACK_GAME_VERSION',
      targetType: 'GAME',
      targetId: game.id,
      details: {
        gameId: game.id,
        fromVersionId,
        toVersionId: targetVersion.id,
        toVersionNumber: targetVersion.versionNumber,
        reason: reason.trim(),
        rollbackRecordId: rollbackRecord.id,
      },
      ipAddress: '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back to version ${targetVersion.versionNumber}.`,
      game: updatedGame,
      targetVersion,
      rollbackRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Rollback operation failed: ${err.message}` },
      { status: 500 }
    );
  }
}
