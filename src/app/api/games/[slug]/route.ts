import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';

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
