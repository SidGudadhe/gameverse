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

    const userAgent = req.headers.get('user-agent') || '';
    const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    const body = await req.json().catch(() => ({}));
    const { gameId, sessionToken, playSeconds = 0, score } = body;

    if (!gameId) {
      return NextResponse.json({ error: 'gameId is required.' }, { status: 400 });
    }

    const game = gvDb.getGameById(gameId) || gvDb.getGameBySlug(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
    }

    // Enterprise Backend Anti-Cheat & Anti-Bot Verification
    const verification = gvDb.verifyAndRecordSessionWin({
      userId: user!.userId,
      gameId: game.id,
      sessionToken,
      score: typeof score === 'number' ? score : undefined,
      userAgent,
      ip: rawIp,
      playSeconds: Number(playSeconds) || 0,
    });

    if (!verification.success) {
      let status = 400;
      if (
        verification.code === 'BOT_DETECTED' ||
        verification.code === 'IVT_DETECTED' ||
        verification.code === 'PLAYER_MISMATCH' ||
        verification.code === 'TIME_WARP'
      ) {
        status = 403;
      } else if (verification.code === 'REPLAY_CLAIM') {
        status = 409;
      } else if (verification.code === 'WIN_COOLDOWN') {
        status = 429;
      }

      return NextResponse.json(
        {
          error: verification.error || 'Win verification failed.',
          code: verification.code,
          isQualified: false,
          totalWins: verification.totalWins,
          totalWinnings: verification.totalWins,
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      isQualified: verification.isQualified,
      message: verification.message,
      win: verification.win,
      totalWins: verification.totalWins,
      totalWinnings: verification.totalWins,
      verifiedActiveSeconds: verification.activeSeconds,
    });
  } catch (err: any) {
    console.error('Error recording game win:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
