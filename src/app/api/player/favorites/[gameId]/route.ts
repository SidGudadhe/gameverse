import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, extractAuth } from '../../../../../lib/security/middleware';
import { gvDb } from '../../../../../lib/database';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    gameId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = extractAuth(req);
    if (!authUser) {
      return NextResponse.json({ isFavorited: false });
    }

    const isFavorited = gvDb.isGameFavorited(authUser.userId, params.gameId);
    return NextResponse.json({ isFavorited });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const removed = gvDb.removeFavorite(user!.userId, params.gameId);

    return NextResponse.json({
      success: true,
      favorited: false,
      removed,
    });
  } catch (err: any) {
    console.error('Error removing favorite:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
