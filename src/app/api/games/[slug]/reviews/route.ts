import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/security/middleware';
import { gvDb } from '../../../../../lib/database';
import { moderateReviewContent, checkPlayerVerification } from '../../../../../lib/community';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const game = gvDb.getGameBySlug(params.slug) || gvDb.getGameById(params.slug);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const reviews = gvDb.getReviewsByGame(game.id);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      breakdown[star] += 1;
    });

    return NextResponse.json({
      success: true,
      gameId: game.id,
      gameTitle: game.title,
      averageRating: game.rating,
      totalReviews: reviews.length,
      breakdown,
      reviews,
    });
  } catch (err: any) {
    console.error('Error fetching game reviews:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const game = gvDb.getGameBySlug(params.slug) || gvDb.getGameById(params.slug);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const body = await req.json();
    const { rating, comment } = body;

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5 stars.' },
        { status: 400 }
      );
    }

    // Moderate review content
    const moderation = moderateReviewContent(comment);
    if (!moderation.approved) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 });
    }

    // Check player verification status (>= 60s active playtime)
    const isVerifiedPlayer = checkPlayerVerification(user!.userId, game.id);

    // Resolve user details for review attribution
    let profile = gvDb.getProfileByUserId(user!.userId);
    const dbUser = gvDb.findUserById(user!.userId);

    const username = profile?.username || user?.email.split('@')[0] || `player_${user!.userId.slice(-5)}`;
    const displayName = profile?.displayName || dbUser?.name || 'Player';
    const userAvatar = profile?.avatarUrl || dbUser?.avatarUrl;

    const review = gvDb.createReview({
      gameId: game.id,
      userId: user!.userId,
      username,
      displayName,
      userAvatar,
      rating: Math.round(numRating),
      comment: comment.trim(),
      isVerifiedPlayer,
    });

    const updatedGame = gvDb.getGameById(game.id);

    return NextResponse.json({
      success: true,
      review,
      isVerifiedPlayer,
      aggregateRating: updatedGame?.rating || game.rating,
      totalReviews: updatedGame?.totalReviews || 1,
    });
  } catch (err: any) {
    console.error('Error submitting review:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
