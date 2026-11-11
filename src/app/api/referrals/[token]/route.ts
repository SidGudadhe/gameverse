import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '../../../../lib/database';
import { validateReferralAttribution } from '../../../../lib/referrals';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const link = gvDb.getReferralLinkByToken(token);
    if (!link) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Referral link not found or expired.' },
        { status: 404 }
      );
    }

    const game = gvDb.getGameById(link.gameId);
    if (!game) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Linked game not found.' },
        { status: 404 }
      );
    }

    // Anti-fraud validation
    const rawIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const validation = validateReferralAttribution({
      referralToken: token,
      creatorId: link.creatorId,
    });

    // Record click
    gvDb.recordReferralClick(token);

    return NextResponse.json({
      success: true,
      valid: validation.isValid,
      token: link.token,
      campaignName: link.campaignName,
      bonusPercent: link.bonusPercent,
      game: {
        id: game.id,
        title: game.title,
        slug: game.slug,
        thumbnailUrl: game.thumbnailUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Referral resolution failed: ${err.message}` },
      { status: 500 }
    );
  }
}
