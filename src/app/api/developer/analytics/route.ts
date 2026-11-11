import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '../../../../lib/security/middleware';
import { gvDb } from '../../../../lib/database';
import { PlayerSession } from '../../../../types';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const gameIdFilter = searchParams.get('gameId');
    const timeframe = searchParams.get('timeframe') || '30d';

    // 1. Fetch developer's games (Tenant Isolation)
    const developerGames = gvDb.getGames({ developerId: user!.userId });
    const developerGameIds = new Set(developerGames.map((g) => g.id));

    // If specific game requested, ensure ownership
    if (gameIdFilter) {
      if (!developerGameIds.has(gameIdFilter)) {
        return NextResponse.json(
          { error: 'Forbidden: You do not own or have access to this game.' },
          { status: 403 }
        );
      }
    }

    const targetGameIds = gameIdFilter
      ? [gameIdFilter]
      : developerGames.map((g) => g.id);

    // 2. Fetch all sessions for target games
    let allSessions: PlayerSession[] = [];
    for (const gid of targetGameIds) {
      allSessions = allSessions.concat(gvDb.getSessionsByGameId(gid));
    }

    // 3. Apply timeframe filter
    const now = Date.now();
    let cutoffMs = 0;
    if (timeframe === '7d') cutoffMs = now - 7 * 86400 * 1000;
    else if (timeframe === '30d') cutoffMs = now - 30 * 86400 * 1000;

    const filteredSessions = cutoffMs > 0
      ? allSessions.filter((s) => new Date(s.startTime).getTime() >= cutoffMs)
      : allSessions;

    // 4. Calculate Aggregate Summary
    const totalStarts = filteredSessions.length;
    const validSessions = filteredSessions.filter((s) => !s.isIvt && s.activeSeconds >= 10);
    const ivtSessionsCount = filteredSessions.filter((s) => s.isIvt).length;
    const ivtRate = totalStarts > 0 ? Math.round((ivtSessionsCount / totalStarts) * 1000) / 10 : 0;

    const playerIds = new Set<string>();
    const guestIps = new Set<string>();
    filteredSessions.forEach((s) => {
      if (s.playerId) playerIds.add(s.playerId);
      else if (s.ipHash) guestIps.add(s.ipHash);
    });
    const uniquePlayers = playerIds.size + guestIps.size || (totalStarts > 0 ? 1 : 0);

    const totalSeconds = validSessions.reduce((acc, s) => acc + s.activeSeconds, 0);
    const totalPlayMinutes = Math.round((totalSeconds / 60) * 10) / 10;
    const avgSessionSeconds =
      validSessions.length > 0 ? Math.round(totalSeconds / validSessions.length) : 0;

    // 5. Device Distribution
    const desktopCount = filteredSessions.filter((s) => s.deviceType === 'DESKTOP').length;
    const mobileCount = filteredSessions.filter((s) => s.deviceType === 'MOBILE').length;
    const tabletCount = filteredSessions.filter((s) => s.deviceType === 'TABLET').length;

    const devices = {
      desktop: desktopCount,
      mobile: mobileCount,
      tablet: tabletCount,
      desktopPct: totalStarts > 0 ? Math.round((desktopCount / totalStarts) * 100) : 0,
      mobilePct: totalStarts > 0 ? Math.round((mobileCount / totalStarts) * 100) : 0,
      tabletPct: totalStarts > 0 ? Math.round((tabletCount / totalStarts) * 100) : 0,
    };

    // 6. Referral & Acquisition Channels
    const referralSessions = filteredSessions.filter((s) => !!s.referralToken);
    const organicSessions = filteredSessions.filter((s) => !s.referralToken);

    // Group by referral token
    const tokenMap: Record<string, { token: string; clicks: number; uniquePlayers: Set<string>; playMinutes: number }> = {};
    referralSessions.forEach((s) => {
      const tok = s.referralToken!;
      if (!tokenMap[tok]) {
        tokenMap[tok] = { token: tok, clicks: 0, uniquePlayers: new Set(), playMinutes: 0 };
      }
      tokenMap[tok].clicks += 1;
      tokenMap[tok].uniquePlayers.add(s.playerId || s.ipHash || 'anon');
      tokenMap[tok].playMinutes += Math.round((s.activeSeconds / 60) * 10) / 10;
    });

    const referralList = Object.values(tokenMap).map((t) => ({
      token: t.token,
      clicks: t.clicks,
      uniquePlayers: t.uniquePlayers.size,
      playMinutes: Math.round(t.playMinutes * 10) / 10,
    }));

    const acquisition = {
      organicStarts: organicSessions.length,
      referralStarts: referralSessions.length,
      organicPct: totalStarts > 0 ? Math.round((organicSessions.length / totalStarts) * 100) : 100,
      referralPct: totalStarts > 0 ? Math.round((referralSessions.length / totalStarts) * 100) : 0,
      referralTokens: referralList,
    };

    // 7. Daily Timeline Trend (Last 7 or 14 points)
    const daysCount = timeframe === '7d' ? 7 : 14;
    const timeline: { date: string; starts: number; playMinutes: number; uniquePlayers: number }[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const daySessions = filteredSessions.filter((s) => s.startTime.startsWith(dateStr));
      const dayValid = daySessions.filter((s) => !s.isIvt);
      const daySeconds = dayValid.reduce((acc, s) => acc + s.activeSeconds, 0);

      const dayPlayers = new Set<string>();
      daySessions.forEach((s) => dayPlayers.add(s.playerId || s.ipHash || 'anon'));

      timeline.push({
        date: displayLabel,
        starts: daySessions.length,
        playMinutes: Math.round((daySeconds / 60) * 10) / 10,
        uniquePlayers: dayPlayers.size,
      });
    }

    // 8. Retention Curve
    const playerSessionDates: Record<string, string[]> = {};
    allSessions.forEach((s) => {
      const key = s.playerId || s.ipHash || 'anon';
      if (!playerSessionDates[key]) playerSessionDates[key] = [];
      playerSessionDates[key].push(s.startTime);
    });

    let day1Retained = 0;
    let day7Retained = 0;
    let day30Retained = 0;
    const totalTrackedPlayers = Object.keys(playerSessionDates).length;

    Object.values(playerSessionDates).forEach((dates) => {
      if (dates.length < 2) return;
      const sorted = dates.map((d) => new Date(d).getTime()).sort((a, b) => a - b);
      const first = sorted[0];
      const maxDeltaHours = (sorted[sorted.length - 1] - first) / (1000 * 3600);

      if (maxDeltaHours >= 24) day1Retained += 1;
      if (maxDeltaHours >= 24 * 7) day7Retained += 1;
      if (maxDeltaHours >= 24 * 30) day30Retained += 1;
    });

    const retention = {
      day1Pct: totalTrackedPlayers > 0 ? Math.round((day1Retained / totalTrackedPlayers) * 1000) / 10 : 0,
      day7Pct: totalTrackedPlayers > 0 ? Math.round((day7Retained / totalTrackedPlayers) * 1000) / 10 : 0,
      day30Pct: totalTrackedPlayers > 0 ? Math.round((day30Retained / totalTrackedPlayers) * 1000) / 10 : 0,
    };

    // 9. Per-Game Breakdown Table
    const perGameStats = developerGames
      .filter((g) => targetGameIds.includes(g.id))
      .map((g) => {
        const gameSessions = filteredSessions.filter((s) => s.gameId === g.id);
        const gameValid = gameSessions.filter((s) => !s.isIvt && s.activeSeconds >= 10);
        const gameIvt = gameSessions.filter((s) => s.isIvt).length;
        const gSeconds = gameValid.reduce((acc, s) => acc + s.activeSeconds, 0);

        const gPlayers = new Set<string>();
        gameSessions.forEach((s) => gPlayers.add(s.playerId || s.ipHash || 'anon'));

        return {
          id: g.id,
          title: g.title,
          slug: g.slug,
          status: g.status,
          thumbnailUrl: g.thumbnailUrl,
          totalStarts: gameSessions.length,
          validSessions: gameValid.length,
          ivtCount: gameIvt,
          uniquePlayers: gPlayers.size,
          playMinutes: Math.round((gSeconds / 60) * 10) / 10,
          avgSessionSeconds: gameValid.length > 0 ? Math.round(gSeconds / gameValid.length) : 0,
          referralStarts: gameSessions.filter((s) => !!s.referralToken).length,
        };
      });

    // 10. Ad Monetization Breakdown
    const adStats = gvDb.getAdStats(gameIdFilter || undefined, user!.userId);

    return NextResponse.json({
      success: true,
      timeframe,
      selectedGameId: gameIdFilter || 'all',
      summary: {
        totalStarts,
        validSessions: validSessions.length,
        ivtSessionsCount,
        ivtRate,
        uniquePlayers,
        totalPlayMinutes,
        avgSessionSeconds,
        monetizableSessions: validSessions.length,
        adImpressions: adStats.totalImpressions,
        billableAdImpressions: adStats.billableImpressions,
        estimatedAdEarnings: adStats.creatorEarnings,
      },
      adMonetization: adStats,
      timeline,
      devices,
      acquisition,
      retention,
      games: perGameStats,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to compile developer analytics: ${err.message}` },
      { status: 500 }
    );
  }
}
