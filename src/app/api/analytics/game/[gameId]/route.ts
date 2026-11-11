import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '../../../../../lib/database';

export async function GET(
  req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params;

    const game = gvDb.getGameById(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
    }

    const analytics = gvDb.getGameAnalytics(gameId);

    return NextResponse.json({
      success: true,
      game: {
        id: game.id,
        title: game.title,
        totalPlays: game.totalPlays,
        totalPlayMinutes: game.totalPlayMinutes || 0,
      },
      analytics,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to retrieve game analytics: ${err.message}` },
      { status: 500 }
    );
  }
}
