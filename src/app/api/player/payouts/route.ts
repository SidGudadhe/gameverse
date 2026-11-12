import { NextRequest, NextResponse } from 'next/server';
import { extractAuth, requireAuth } from '../../../../lib/security/middleware';
import { gvDb } from '../../../../lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = extractAuth(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to access player payouts.' },
        { status: 401 }
      );
    }

    const history = gvDb.getPlayHistory(authUser.userId, 100);
    const totalMinutes = history.reduce((acc, h) => acc + (h.totalPlayMinutes || 0), 0);
    const requests = gvDb.getPlayerPayoutRequests(authUser.userId);

    return NextResponse.json({
      success: true,
      stats: {
        gamesPlayed: history.length,
        totalPlayMinutes: totalMinutes,
        eligible: true,
        calculationStatus: 'CONFIGURING_SOON',
        notice:
          'Game play reward rates and conversion will be activated in the next platform update. Every minute you play is currently being logged and tracked for your future payout eligibility!',
      },
      requests,
    });
  } catch (err: any) {
    console.error('Error fetching player payouts:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { method, accountDetails, note } = body;

    const validMethods = ['UPI', 'BANK_TRANSFER', 'PAYPAL', 'GIFT_CARD'];
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payout method. Supported methods: UPI, BANK_TRANSFER, PAYPAL, GIFT_CARD.' },
        { status: 400 }
      );
    }

    if (!accountDetails || typeof accountDetails !== 'string' || accountDetails.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please enter valid payout account details (e.g. UPI ID, Bank IBAN/Account, or PayPal Email).' },
        { status: 400 }
      );
    }

    const newRequest = gvDb.createPlayerPayoutRequest(user!.userId, {
      method,
      accountDetails: accountDetails.trim(),
      note: typeof note === 'string' ? note.slice(0, 200) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Payout request registered successfully!',
      request: newRequest,
    });
  } catch (err: any) {
    console.error('Error submitting player payout request:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
