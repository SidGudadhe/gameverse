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
    const savedMethods = gvDb.getPlayerPayoutMethods(authUser.userId);
    const savedMethod = gvDb.getPlayerPayoutMethod(authUser.userId) || null;
    const wallet = gvDb.getPlayerWallet(authUser.userId);

    const minWithdrawal = 500;
    const thresholdMet = wallet.availableBalance >= minWithdrawal;
    const neededToUnlock = Math.max(0, minWithdrawal - wallet.availableBalance);

    return NextResponse.json({
      success: true,
      wallet,
      minWithdrawal,
      thresholdMet,
      neededToUnlock,
      stats: {
        gamesPlayed: history.length,
        totalPlayMinutes: totalMinutes,
        eligible: true,
        calculationStatus: 'CONFIGURING_SOON',
        notice:
          'Game play reward rates and conversion will be activated in the next platform update. Every minute you play is currently being logged and tracked for your future payout eligibility!',
      },
      savedMethod,
      savedMethods,
      maxAllowed: 4,
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
    const {
      action = 'REQUEST_PAYOUT',
      id,
      methodId,
      method,
      accountDetails,
      beneficiaryName,
      label,
      isDefault,
      amount,
      note,
    } = body;

    // 1. Action: Save / Update Payout Method (Up to 4 accounts/UPI IDs)
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

      try {
        const saved = gvDb.savePlayerPayoutMethod(user!.userId, {
          id: id || methodId,
          addNew: Boolean(body.addNew),
          method,
          accountDetails: accountDetails.trim(),
          beneficiaryName: typeof beneficiaryName === 'string' ? beneficiaryName.trim() : undefined,
          label: typeof label === 'string' && label.trim() ? label.trim() : undefined,
          isDefault: typeof isDefault === 'boolean' ? isDefault : undefined,
        });

        const updatedMethods = gvDb.getPlayerPayoutMethods(user!.userId);

        return NextResponse.json({
          success: true,
          message: 'Payout method saved successfully!',
          savedMethod: saved,
          savedMethods: updatedMethods,
        });
      } catch (saveErr: any) {
        return NextResponse.json(
          { error: saveErr.message || 'Failed to save payout method.' },
          { status: 400 }
        );
      }
    }

    // 2. Action: Set Primary / Default Payout Method
    if (action === 'SET_DEFAULT') {
      const targetId = methodId || id;
      if (!targetId) {
        return NextResponse.json({ error: 'Method ID is required to set default.' }, { status: 400 });
      }

      const success = gvDb.setDefaultPlayerPayoutMethod(user!.userId, targetId);
      if (!success) {
        return NextResponse.json({ error: 'Payout method not found.' }, { status: 404 });
      }

      const updatedMethods = gvDb.getPlayerPayoutMethods(user!.userId);
      return NextResponse.json({
        success: true,
        message: 'Default payout method updated.',
        savedMethods: updatedMethods,
        savedMethod: gvDb.getPlayerPayoutMethod(user!.userId),
      });
    }

    // 3. Action: Delete Payout Method
    if (action === 'DELETE_METHOD') {
      const targetId = methodId || id;
      gvDb.deletePlayerPayoutMethod(user!.userId, targetId);
      const updatedMethods = gvDb.getPlayerPayoutMethods(user!.userId);
      return NextResponse.json({
        success: true,
        message: 'Payout method deleted successfully!',
        savedMethods: updatedMethods,
        savedMethod: gvDb.getPlayerPayoutMethod(user!.userId) || null,
      });
    }

    // 4. Action: Request Payout
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

    // Retrieve saved method (either chosen by methodId or default) or fallback to passed method
    const targetMethodId = methodId || id;
    const selectedSavedMethod = targetMethodId
      ? gvDb.getPlayerPayoutMethod(user!.userId, targetMethodId)
      : gvDb.getPlayerPayoutMethod(user!.userId);

    const effectiveMethod = (method && validMethods.includes(method))
      ? method
      : (selectedSavedMethod ? selectedSavedMethod.method : undefined);
    const effectiveDetails = (accountDetails && accountDetails.trim().length > 0)
      ? accountDetails.trim()
      : (selectedSavedMethod ? selectedSavedMethod.accountDetails : undefined);
    const effectiveName = beneficiaryName || (selectedSavedMethod ? selectedSavedMethod.beneficiaryName : undefined);

    if (!effectiveMethod || !effectiveDetails) {
      return NextResponse.json(
        { error: 'Please configure and save your payout method first.' },
        { status: 400 }
      );
    }

    const MINIMUM_PAYOUT = 500;
    const wallet = gvDb.getPlayerWallet(user!.userId);

    // Rule: Agar account me kam paise hai to 500 complete karne honge, uske baad hi withdrawal hoga
    if (wallet.availableBalance < MINIMUM_PAYOUT) {
      const needed = Math.max(0, MINIMUM_PAYOUT - wallet.availableBalance);
      return NextResponse.json(
        {
          error: `Aapke account me sirf ₹${wallet.availableBalance.toFixed(2)} hain. Withdraw karne ke liye aapko kam se kam ₹${MINIMUM_PAYOUT} balance complete karna hoga (Remaining needed: ₹${needed.toFixed(2)}). Games khel kar ₹${MINIMUM_PAYOUT} pura karein!`,
          threshold: MINIMUM_PAYOUT,
          currentBalance: wallet.availableBalance,
          needed,
        },
        { status: 400 }
      );
    }

    const numAmount = amount !== undefined && amount !== null && amount !== '' ? Number(amount) : MINIMUM_PAYOUT;
    if (isNaN(numAmount) || numAmount < MINIMUM_PAYOUT) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal amount is ₹${MINIMUM_PAYOUT}. Aap ₹${MINIMUM_PAYOUT} ke niche withdrawal nahi kar sakte.`,
          threshold: MINIMUM_PAYOUT,
        },
        { status: 400 }
      );
    }

    if (numAmount > wallet.availableBalance) {
      return NextResponse.json(
        {
          error: `Withdrawal amount cannot exceed your available balance of ₹${wallet.availableBalance.toFixed(2)}.`,
        },
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
