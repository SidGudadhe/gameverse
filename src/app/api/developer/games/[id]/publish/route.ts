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
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    const body = await req.json();
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json({ success: false, error: 'Missing target versionId.' }, { status: 400 });
    }

    const targetVersion = gvDb.getVersionById(versionId);
    if (!targetVersion || targetVersion.gameId !== game.id) {
      return NextResponse.json({ success: false, error: 'Specified version does not exist for this game.' }, { status: 404 });
    }

    // Verify version is eligible for publishing (Approved or Admin bypass)
    if (targetVersion.status !== 'APPROVED' && targetVersion.status !== 'PUBLISHED' && user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: `Version cannot be published until QA review is complete (current status: ${targetVersion.status}).`,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const previousVersionId = game.currentVersionId;

    // Atomic version pointer switch
    gvDb.updateVersion(targetVersion.id, {
      status: 'PUBLISHED',
      publishedAt: targetVersion.publishedAt || now,
    });

    const updatedGame = gvDb.updateGame(game.id, {
      status: 'PUBLISHED',
      currentVersionId: targetVersion.id,
      publishedAt: game.publishedAt || now,
      updatedAt: now,
    });

    // Audit log
    gvDb.logAudit({
      actorId: user.userId,
      actorName: user.name,
      action: 'PUBLISH_GAME_VERSION',
      targetType: 'GAME',
      targetId: game.id,
      details: {
        gameId: game.id,
        previousVersionId,
        newVersionId: targetVersion.id,
        versionNumber: targetVersion.versionNumber,
      },
      ipAddress: '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `Version ${targetVersion.versionNumber} is now atomically active on GameVerse!`,
      game: updatedGame,
      version: targetVersion,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Publishing failed: ${err.message}` },
      { status: 500 }
    );
  }
}
