import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function GET(
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

    const versions = gvDb.getVersionsByGameId(game.id);
    const storageMetrics = gvDb.getStorageMetrics(game.id);

    return NextResponse.json({
      success: true,
      game,
      versionsCount: versions.length,
      currentVersion: versions.find((v) => v.id === game.currentVersionId) || null,
      storageMetrics,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to fetch game: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const {
      title,
      shortDescription,
      fullDescription,
      controlsGuide,
      orientation,
      thumbnailUrl,
      bannerUrl,
      categoryId,
      categoryName,
    } = body;

    const updates: Partial<typeof game> = {};
    if (title && title.trim().length >= 3) updates.title = title.trim();
    if (shortDescription !== undefined) updates.shortDescription = shortDescription;
    if (fullDescription !== undefined) updates.fullDescription = fullDescription;
    if (controlsGuide !== undefined) updates.controlsGuide = controlsGuide;
    if (orientation) updates.orientation = orientation;
    if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;
    if (bannerUrl) updates.bannerUrl = bannerUrl;
    if (categoryId) updates.categoryId = categoryId;
    if (categoryName) updates.categoryName = categoryName;

    const updated = gvDb.updateGame(game.id, updates);

    // Audit log
    gvDb.logAudit({
      actorId: user.userId,
      actorName: user.name,
      action: 'UPDATE_GAME_SETTINGS',
      targetType: 'GAME',
      targetId: game.id,
      details: { updates },
      ipAddress: '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Game settings updated successfully.',
      game: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to update settings: ${err.message}` },
      { status: 500 }
    );
  }
}
