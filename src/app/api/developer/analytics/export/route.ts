import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '../../../../../lib/security/middleware';
import { gvDb } from '../../../../../lib/database';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const gameIdFilter = searchParams.get('gameId');

    const developerGames = gvDb.getGames({ developerId: user!.userId });
    const developerGameIds = new Set(developerGames.map((g) => g.id));

    if (gameIdFilter && !developerGameIds.has(gameIdFilter)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const targetGames = gameIdFilter
      ? developerGames.filter((g) => g.id === gameIdFilter)
      : developerGames;

    // Collect report records
    const records = targetGames.map((g) => {
      const sessions = gvDb.getSessionsByGameId(g.id);
      const valid = sessions.filter((s) => !s.isIvt && s.activeSeconds >= 10);
      const ivt = sessions.filter((s) => s.isIvt);
      const seconds = valid.reduce((acc, s) => acc + s.activeSeconds, 0);

      const uniquePlayers = new Set(sessions.map((s) => s.playerId || s.ipHash || 'anon')).size;
      const referralStarts = sessions.filter((s) => !!s.referralToken).length;

      return {
        gameId: g.id,
        gameTitle: g.title,
        status: g.status,
        totalStarts: sessions.length,
        validSessions: valid.length,
        ivtFilteredSessions: ivt.length,
        uniquePlayers,
        totalPlayMinutes: Math.round((seconds / 60) * 10) / 10,
        avgSessionSeconds: valid.length > 0 ? Math.round(seconds / valid.length) : 0,
        referralStarts,
      };
    });

    if (format === 'json') {
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        developerId: user!.userId,
        count: records.length,
        data: records,
      });
    }

    // CSV Format
    const headers = [
      'Game ID',
      'Game Title',
      'Status',
      'Total Starts',
      'Valid Sessions',
      'IVT Filtered',
      'Unique Players',
      'Total Play Minutes',
      'Avg Session (sec)',
      'Referral Starts',
    ];

    const csvRows = [
      headers.join(','),
      ...records.map((r) =>
        [
          `"${r.gameId}"`,
          `"${r.gameTitle.replace(/"/g, '""')}"`,
          r.status,
          r.totalStarts,
          r.validSessions,
          r.ivtFilteredSessions,
          r.uniquePlayers,
          r.totalPlayMinutes,
          r.avgSessionSeconds,
          r.referralStarts,
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="gameverse-analytics.csv"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Export compilation failed: ${err.message}` },
      { status: 500 }
    );
  }
}
