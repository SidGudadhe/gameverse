import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Strictly require gamer authentication! Anonymous guests cannot submit game requests without an account.
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required: You must have an account to request new game titles. Please sign in or register.',
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const title = (body.title || body.query || '').trim();

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Game title is required to submit a request.' },
        { status: 400 }
      );
    }

    const recorded = gvDb.recordGameRequest({
      userId: user!.userId,
      title,
      userName: user!.name,
      userEmail: user!.email,
    });

    return NextResponse.json({
      success: true,
      message: `Your request for "${title}" has been submitted successfully!`,
      request: recorded,
    });
  } catch (err: any) {
    console.error('Error recording game request:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing title request' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const requests = gvDb.getGameRequests(user!.userId);
    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch game requests' }, { status: 500 });
  }
}
