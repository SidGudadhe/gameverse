import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/security/middleware';
import { gvDb } from '../../../../lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const favoriteGames = gvDb.getFavoriteGames(user!.userId);
    const favorites = gvDb.getFavoritesByUser(user!.userId);

    return NextResponse.json({
      success: true,
      favorites,
      games: favoriteGames,
      count: favoriteGames.length,
    });
  } catch (err: any) {
    console.error('Error fetching favorites:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json({ error: 'gameId is required.' }, { status: 400 });
    }

    const game = gvDb.getGameById(gameId) || gvDb.getGameBySlug(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
    }

    const favorite = gvDb.addFavorite(user!.userId, game.id);

    return NextResponse.json({
      success: true,
      favorited: true,
      favorite,
      gameId: game.id,
    });
  } catch (err: any) {
    console.error('Error adding favorite:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
