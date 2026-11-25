import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';
import { gameverseStorage, resolvePlayableGameUrl } from '@/lib/storage';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const game = gvDb.getGameBySlug(params.slug) || gvDb.getGameById(params.slug);

    if (!game || game.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'Game not found or has not been published to the catalog.' },
        { status: 404 }
      );
    }

    // Version details
    const version = game.currentVersionId
      ? gvDb.getVersionById(game.currentVersionId)
      : null;

    // CDN Serving URLs + live playable fallback URL when external CDN isn't configured
    const cdnUrl = version
      ? gameverseStorage.getPublicCdnUrl(
          `games/${game.id}/versions/${version.versionNumber}/${version.entryFile || 'index.html'}`
        )
      : null;
    const playableUrl = resolvePlayableGameUrl(
      game.id,
      version?.id || game.currentVersionId || 'v1',
      version?.versionNumber,
      version?.entryFile || 'index.html'
    );
    const stableGameUrl = gameverseStorage.getStableGameUrl(game.slug);

    // Studio / Developer profile
    const developerProfile = gvDb.getProfileByUserId(game.developerId);

    // Rights & AI disclosure
    const rights = game.currentVersionId
      ? gvDb.getRightsDeclarationByVersionId(game.currentVersionId)
      : null;

    // Related games from same category
    const relatedGames = gvDb
      .getGames({ categoryId: game.categoryId, status: 'PUBLISHED' })
      .filter((g) => g.id !== game.id)
      .slice(0, 4);

    return NextResponse.json({
      success: true,
      game,
      version,
      cdnUrl,
      playableUrl,
      stableGameUrl,
      developerProfile,
      rights,
      relatedGames,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to fetch game details: ${err.message}` },
      { status: 500 }
    );
  }
}
