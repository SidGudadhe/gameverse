import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '../../../../lib/security/middleware';
import { gvDb } from '../../../../lib/database';
import { generateReferralToken, generateSocialShareLinks } from '../../../../lib/referrals';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const gameIdFilter = searchParams.get('gameId');

    const devGames = gvDb.getGames({ developerId: user!.userId });
    const devGameIds = new Set(devGames.map((g) => g.id));

    if (gameIdFilter && !devGameIds.has(gameIdFilter)) {
      return NextResponse.json({ error: 'Forbidden: Game not owned.' }, { status: 403 });
    }

    let links = gvDb.getReferralLinksByCreator(user!.userId);
    if (gameIdFilter) {
      links = links.filter((l) => l.gameId === gameIdFilter);
    }

    // Attach game title and share URLs to each link
    const enriched = links.map((l) => {
      const game = devGames.find((g) => g.id === l.gameId);
      const shareUrls = game
        ? generateSocialShareLinks(game.title, game.slug, l.token)
        : null;

      return {
        ...l,
        gameTitle: game?.title || 'Unknown Game',
        gameSlug: game?.slug || '',
        shareUrls,
      };
    });

    return NextResponse.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to fetch referral campaigns: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { gameId, campaignName = 'Promotion Campaign', bonusPercent = 20 } = body;

    if (!gameId) {
      return NextResponse.json({ error: 'gameId is required.' }, { status: 400 });
    }

    // Check game ownership (tenant isolation)
    const game = gvDb.getGameById(gameId);
    if (!game || game.developerId !== user!.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this game.' },
        { status: 403 }
      );
    }

    const token = generateReferralToken(game.slug);

    const link = gvDb.createReferralLink({
      gameId,
      creatorId: user!.userId,
      campaignName,
      bonusPercent,
      customToken: token,
    });

    const shareUrls = generateSocialShareLinks(game.title, game.slug, link.token);

    return NextResponse.json({
      success: true,
      link: {
        ...link,
        gameTitle: game.title,
        gameSlug: game.slug,
        shareUrls,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to create referral campaign: ${err.message}` },
      { status: 500 }
    );
  }
}
