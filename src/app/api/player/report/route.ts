import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, gameTitle, gameSlug, reason, details } = body;

    if (!gameId && !gameSlug) {
      return NextResponse.json(
        { error: 'Missing game identifier' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Log the audit event
    gvDb.logAudit({
      actorId: 'usr-anonymous-player',
      actorName: 'Player',
      actorRole: 'PLAYER',
      action: 'GAME_REPORTED',
      targetType: 'GAME',
      targetId: gameId || gameSlug,
      details: {
        gameTitle,
        gameSlug,
        reason,
        details: details || '',
        reportedAt: new Date().toISOString(),
      },
      ipAddress,
    });

    // Also file a technical support ticket so admin/developer can track it
    try {
      const game = gameId ? gvDb.getGameById(gameId) : gvDb.getGameBySlug(gameSlug);
      if (game) {
        gvDb.createSupportTicket({
          creatorId: game.developerId,
          subject: `Player Bug Report: ${game.title} - ${reason}`,
          category: 'TECHNICAL',
          message: `Reason: ${reason}\nDetails: ${details || 'None provided'}\nGame Slug: ${game.slug}\nReported on: ${new Date().toLocaleString()}`,
        });
      }
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      message: 'Report received successfully',
    });
  } catch (error: any) {
    console.error('Failed to submit game report:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing report' },
      { status: 500 }
    );
  }
}
