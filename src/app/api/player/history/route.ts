import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/security/middleware';
import { gvDb } from '../../../../lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const history = gvDb.getPlayHistory(user!.userId, 20);

    return NextResponse.json({
      success: true,
      history,
      count: history.length,
    });
  } catch (err: any) {
    console.error('Error fetching play history:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { gameId, playSeconds = 0 } = body;

    if (!gameId) {
      return NextResponse.json({ error: 'gameId is required.' }, { status: 400 });
    }

    const game = gvDb.getGameById(gameId) || gvDb.getGameBySlug(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
    }

    const item = gvDb.recordPlayHistory(user!.userId, game.id, Number(playSeconds) || 0);

    return NextResponse.json({
      success: true,
      historyItem: item,
    });
  } catch (err: any) {
    console.error('Error recording play history:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
