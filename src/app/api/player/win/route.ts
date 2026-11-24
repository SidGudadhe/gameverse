import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/security/middleware';
import { gvDb } from '../../../../lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const totalWins = gvDb.getPlayerTotalWins(user!.userId, 5);
    const allWins = gvDb.getPlayerGameWins(user!.userId);

    return NextResponse.json({
      success: true,
      totalWins,
      totalWinnings: totalWins,
      minPlayMinutesRequired: 5,
      wins: allWins,
    });
  } catch (err: any) {
    console.error('Error fetching player game wins:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const { gameId, playSeconds = 0, score } = body;

    if (!gameId) {
      return NextResponse.json({ error: 'gameId is required.' }, { status: 400 });
    }

    const game = gvDb.getGameById(gameId) || gvDb.getGameBySlug(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
    }

    const numericSeconds = Number(playSeconds) || 0;
    const result = gvDb.recordGameWin(
      user!.userId,
      game.id,
      numericSeconds,
      typeof score === 'number' ? score : undefined
    );

    const totalWins = gvDb.getPlayerTotalWins(user!.userId, 5);

    return NextResponse.json({
      success: true,
      isQualified: result.isQualified,
      message: result.isQualified
        ? 'Game win registered! Playtime exceeded 5 minutes, counted in Total Winnings.'
        : 'Game win registered! Playtime was under 5 minutes (requires 5+ mins to count in Total Winnings).',
      win: result.win,
      totalWins,
      totalWinnings: totalWins,
    });
  } catch (err: any) {
    console.error('Error recording game win:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
