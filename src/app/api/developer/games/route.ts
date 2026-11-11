import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireRole(req, 'DEVELOPER');
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  // Strict tenant isolation: only return games where developerId === user.userId
  const games = gvDb.getGames({
    developerId: user!.userId,
    status,
    search,
  });

  return NextResponse.json({
    success: true,
    count: games.length,
    data: games,
  });
}
