import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '../../../../lib/database';
import { AdFormat } from '../../../../types';
import { checkAdEligibility, getRandomAdCreative } from '../../../../lib/ads';
import { detectBot } from '../../../../lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');
    const sessionToken = searchParams.get('sessionToken');
    const format = (searchParams.get('format') as AdFormat) || 'PREROLL';
    const activeSeconds = parseInt(searchParams.get('activeSeconds') || '0', 10);
    const isRestart = searchParams.get('isRestart') === 'true' || searchParams.get('trigger') === 'restart' || searchParams.get('trigger') === 'game_over';
    const isNextLevel = searchParams.get('isNextLevel') === 'true' || searchParams.get('trigger') === 'next_level';
    const trigger = searchParams.get('trigger') || undefined;

    if (!gameId || !sessionToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: gameId and sessionToken are required' },
        { status: 400 }
      );
    }

    if (!['PREROLL', 'INTERSTITIAL', 'REWARDED', 'BONUS_REWARD', 'BANNER'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid ad format. Must be PREROLL, INTERSTITIAL, REWARDED, BONUS_REWARD, or BANNER' },
        { status: 400 }
      );
    }

    // Verify game exists
    const game = gvDb.findGameById(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Bot detection
    const userAgent = req.headers.get('user-agent');
    const { isBot } = detectBot(userAgent);

    const safeActiveSeconds = isNaN(activeSeconds) ? 0 : activeSeconds;

    const eligibility = checkAdEligibility({
      gameId,
      sessionToken,
      format,
      activeSeconds: safeActiveSeconds,
      isIvt: isBot,
      isRestart,
      isNextLevel,
      trigger,
    });

    if (!eligibility.eligible) {
      return NextResponse.json({
        eligible: false,
        format,
        cooldownRemainingSeconds: eligibility.cooldownRemainingSeconds,
        reason: eligibility.reason,
      });
    }

    const ad = getRandomAdCreative(format, safeActiveSeconds);

    return NextResponse.json({
      eligible: true,
      format,
      ad,
      skipOffsetSeconds: ad.skipOffsetSeconds,
      isUnskippable: Boolean(ad.isUnskippable || eligibility.isUnskippable),
      placementText: ad.placementText,
    });
  } catch (error: any) {
    console.error('Error checking ad slot eligibility:', error);
    return NextResponse.json(
      { error: 'Internal server error checking ad slot' },
      { status: 500 }
    );
  }
}
