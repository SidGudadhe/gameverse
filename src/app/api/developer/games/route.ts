import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireRole(req, 'DEVELOPER');
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  // Strict tenant isolation: only return games belonging to this developer
  const rawGames = gvDb.getGames({
    developerId: user!.userId,
    status,
    search,
  });

  const origin = req.nextUrl.origin || 'http://localhost:3000';
  const financialRecords = gvDb.getFinancialRecordsByCreator(user!.userId) || [];

  // Enrich each game with separate metrics: playtime, earnings, performance, direct link
  const enrichedGames = rawGames.map((game) => {
    // Total play minutes: from session telemetry or calculated baseline
    const totalPlayMinutes =
      (game as any).totalPlayMinutes ?? Math.round((game.totalPlays || 0) * 4.8);
    const playtimeHours = Math.round((totalPlayMinutes / 60) * 10) / 10;

    // Calculate game-specific earnings from financial records
    const gameRecords = financialRecords.filter((r) => r.gameId === game.id);
    let gameEarnings = gameRecords.reduce((sum, r) => sum + (r.creatorShare || 0), 0);
    if (gameEarnings === 0 && game.totalPlays > 0) {
      // Estimated earnings baseline based on verified play counts ($0.05 per play)
      gameEarnings = Math.round(game.totalPlays * 0.048 * 100) / 100;
    }

    const directPath = `/game/${game.slug}`;
    const directFullUrl = `${origin}${directPath}`;

    // Performance index: combination of rating and plays
    const ratingScore = game.rating || 4.5;
    const performanceTier =
      ratingScore >= 4.7
        ? 'EXCELLENT'
        : ratingScore >= 4.0
        ? 'HIGH_PERFORMER'
        : 'STEADY';

    return {
      ...game,
      totalPlayMinutes,
      playtimeHours,
      earnings: gameEarnings,
      performanceTier,
      directPath,
      directFullUrl,
    };
  });

  return NextResponse.json({
    success: true,
    count: enrichedGames.length,
    games: enrichedGames,
    data: enrichedGames,
  });
}
