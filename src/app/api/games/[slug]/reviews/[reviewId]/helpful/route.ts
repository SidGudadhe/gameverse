import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../../../lib/security/middleware';
import { gvDb } from '../../../../../../../lib/database';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    slug: string;
    reviewId: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const result = gvDb.voteHelpfulReview(params.reviewId, user!.userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      review: result.review,
      helpfulCount: result.review?.helpfulCount || 1,
    });
  } catch (err: any) {
    console.error('Error voting review as helpful:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
