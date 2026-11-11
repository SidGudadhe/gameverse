import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '../../../../lib/database';
import { AdFormat } from '../../../../types';
import { calculateAdRevenue, AD_CONFIG } from '../../../../lib/ads';
import { detectBot } from '../../../../lib/analytics';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      gameId,
      sessionToken,
      format,
      durationSeconds = 0,
      completed = true,
      clicked = false,
      referralToken,
    } = body;

    if (!gameId || !sessionToken || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, sessionToken, and format are required' },
        { status: 400 }
      );
    }

    if (!['PREROLL', 'INTERSTITIAL', 'REWARDED'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid ad format. Must be PREROLL, INTERSTITIAL, or REWARDED' },
        { status: 400 }
      );
    }

    // Verify game exists
    const game = gvDb.findGameById(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const creatorId = game.developerId;

    // Detect IVT / Bots
    const userAgent = req.headers.get('user-agent');
    const { isBot } = detectBot(userAgent);

    // Validate completion criteria: duration must be >= MIN_VIEW_DURATION_SECONDS (3s)
    const isDurationValid = Number(durationSeconds) >= AD_CONFIG.MIN_VIEW_DURATION_SECONDS;
    const isCompleted = Boolean(completed) && isDurationValid;

    // Check referral attribution
    let isReferral = false;
    if (referralToken) {
      const refLink = gvDb.getReferralLinkByToken(referralToken);
      if (refLink && refLink.creatorId === creatorId && refLink.gameId === gameId) {
        isReferral = true;
      }
    }

    // Calculate revenue split
    const isNonBillable = isBot || !isCompleted;
    const revenue = calculateAdRevenue(format as AdFormat, isReferral, isNonBillable);

    // Persist impression in database
    const impression = gvDb.createAdImpression({
      gameId,
      creatorId,
      sessionToken,
      format: format as AdFormat,
      durationSeconds: Number(durationSeconds) || 0,
      completed: isCompleted,
      clicked: Boolean(clicked),
      isIvt: isBot,
      grossRevenue: revenue.grossRevenue,
      networkDeduction: revenue.networkDeduction,
      netRevenue: revenue.netRevenue,
      creatorShareRate: revenue.creatorShareRate,
      creatorShareAmount: revenue.creatorShareAmount,
      referralToken: referralToken || undefined,
    });

    return NextResponse.json({
      success: true,
      impression,
      billable: !isNonBillable,
      metrics: {
        format,
        durationSeconds,
        completed: isCompleted,
        isIvt: isBot,
        creatorShareAmount: revenue.creatorShareAmount,
      },
    });
  } catch (error: any) {
    console.error('Error recording ad impression:', error);
    return NextResponse.json(
      { error: 'Internal server error recording ad impression' },
      { status: 500 }
    );
  }
}
