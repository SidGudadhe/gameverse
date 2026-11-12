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
    const savedMethod = gvDb.getPlayerPayoutMethod(authUser.userId) || null;

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
      savedMethod,
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

    const body = await req.json().catch(() => ({}));
    const { action = 'REQUEST_PAYOUT', method, accountDetails, beneficiaryName, amount, note } = body;

    // 1. Action: Save / Update Payout Method
    if (action === 'SAVE_METHOD') {
      const validMethods = ['UPI', 'BANK_TRANSFER', 'PAYPAL', 'GIFT_CARD'];
      if (!method || !validMethods.includes(method)) {
        return NextResponse.json(
          { error: 'Invalid payout method. Supported: UPI, BANK_TRANSFER, PAYPAL, GIFT_CARD.' },
          { status: 400 }
        );
      }

      if (!accountDetails || typeof accountDetails !== 'string' || accountDetails.trim().length < 3) {
        return NextResponse.json(
          { error: 'Please enter valid payout account details (e.g. UPI ID, Bank IBAN/Account, or PayPal Email).' },
          { status: 400 }
        );
      }

      const saved = gvDb.savePlayerPayoutMethod(user!.userId, {
        method,
        accountDetails: accountDetails.trim(),
        beneficiaryName: typeof beneficiaryName === 'string' ? beneficiaryName.trim() : undefined,
      });

      return NextResponse.json({
        success: true,
        message: 'Payout method saved successfully!',
        savedMethod: saved,
      });
    }

    // 2. Action: Delete Payout Method
    if (action === 'DELETE_METHOD') {
      gvDb.deletePlayerPayoutMethod(user!.userId);
      return NextResponse.json({
        success: true,
        message: 'Payout method deleted successfully!',
      });
    }

    // 3. Action: Request Payout
    const validMethods = ['UPI', 'BANK_TRANSFER', 'PAYPAL', 'GIFT_CARD'];
    if (method && !validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payout method. Supported: UPI, BANK_TRANSFER, PAYPAL, GIFT_CARD.' },
        { status: 400 }
      );
    }
    if (accountDetails !== undefined && (!accountDetails || typeof accountDetails !== 'string' || accountDetails.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Please enter valid payout account details.' },
        { status: 400 }
      );
    }

    // Retrieve saved method or fallback to passed method
    const savedMethod = gvDb.getPlayerPayoutMethod(user!.userId);
    const effectiveMethod = (method && validMethods.includes(method)) ? method : (savedMethod ? savedMethod.method : undefined);
    const effectiveDetails = (accountDetails && accountDetails.trim().length > 0) ? accountDetails.trim() : (savedMethod ? savedMethod.accountDetails : undefined);
    const effectiveName = beneficiaryName || (savedMethod ? savedMethod.beneficiaryName : undefined);

    if (!effectiveMethod || !effectiveDetails) {
      return NextResponse.json(
        { error: 'Please configure and save your payout method first.' },
        { status: 400 }
      );
    }

    const numAmount = amount ? Number(amount) : 100;
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Please enter a valid payout amount greater than 0.' },
        { status: 400 }
      );
    }

    const newRequest = gvDb.createPlayerPayoutRequest(user!.userId, {
      amount: numAmount,
      method: effectiveMethod,
      accountDetails: effectiveDetails,
      beneficiaryName: effectiveName,
      note: typeof note === 'string' ? note.slice(0, 200) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Payout request for ₹${numAmount} registered successfully!`,
      request: newRequest,
    });
  } catch (err: any) {
    console.error('Error processing player payout request:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
