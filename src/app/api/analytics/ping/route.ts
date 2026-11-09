import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameId, eventType, sessionToken, activeSeconds } = body;

    if (!gameId || !eventType) {
      return NextResponse.json(
        { success: false, error: 'gameId and eventType are required.' },
        { status: 400 }
      );
    }

    if (eventType === 'game_started') {
      const game = db.getGameById(gameId);
      if (game) {
        db.updateGame(gameId, { totalPlays: game.totalPlays + 1 });
      }
    }

    return NextResponse.json({
      success: true,
      recordedEvent: {
        gameId,
        eventType,
        sessionToken: sessionToken || 'sess-anon',
        activeSeconds: activeSeconds || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
