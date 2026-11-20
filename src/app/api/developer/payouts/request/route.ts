import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '../../../../../lib/security/middleware';
import { gvDb } from '../../../../../lib/database';
import { getCreatorPayoutSummary } from '../../../../../lib/ledger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const { action = 'REQUEST_PAYOUT', payoutMethod, payoutDetails, amount, note, bankAccount, upi } = body;

    // 1. Save or Update Bank Account & UPI Details
    if (action === 'SAVE_BANK_AND_UPI') {
      const current = gvDb.getDeveloperSettings(user!.userId);
      const newBank = bankAccount || current.bankAccount;
      const newUpi = upi || current.upi;

      if (!newBank?.accountNumber && !newUpi?.upiId) {
        return NextResponse.json(
          { error: 'Please provide at least a valid Indian Bank Account or UPI ID.' },
          { status: 400 }
        );
      }

      const payoutDetailsMap: Record<string, string> = {
        ...(newBank?.accountNumber ? { accountNumber: newBank.accountNumber } : {}),
        ...(newBank?.ifscCode ? { ifscCode: newBank.ifscCode } : {}),
        ...(newBank?.bankName ? { bankName: newBank.bankName } : {}),
        ...(newBank?.beneficiaryName ? { beneficiaryName: newBank.beneficiaryName } : {}),
        ...(newUpi?.upiId ? { upiId: newUpi.upiId } : {}),
      };

      const updated = gvDb.updateDeveloperSettings(user!.userId, {
        payoutMethod: 'BANK_AND_UPI',
        bankAccount: newBank,
        upi: newUpi,
        payoutDetails: payoutDetailsMap,
        currency: 'INR',
      });

      return NextResponse.json({
        success: true,
        message: 'Bank account and UPI details saved successfully!',
        settings: updated,
      });
    }

    // 2. Toggle Studio Verification (Demo/Test verification flow)
    if (action === 'TOGGLE_VERIFICATION') {
      const current = gvDb.getDeveloperSettings(user!.userId);
      const newVerified = body.studioVerified !== undefined ? Boolean(body.studioVerified) : !Boolean(current.studioVerified ?? true);

      const updated = gvDb.updateDeveloperSettings(user!.userId, {
        studioVerified: newVerified,
      });

      return NextResponse.json({
        success: true,
        studioVerified: newVerified,
        message: newVerified
          ? 'Studio verification approved! Earnings and payouts are now active.'
          : 'Studio verification paused. Monetization earnings and withdrawals are locked.',
        settings: updated,
      });
    }

    // 3. Save or Update Developer Payout Method (Legacy & Generic)
    if (action === 'SAVE_METHOD') {
      const rawDetails = payoutDetails || body.accountDetails;
      if (!payoutMethod || !rawDetails) {
        return NextResponse.json(
          { error: 'Please select a payout method and provide valid account details.' },
          { status: 400 }
        );
      }

      let detailsObj: Record<string, string> = {};
      if (typeof rawDetails === 'string') {
        detailsObj = {
          accountDetails: rawDetails.trim(),
          ...(body.beneficiaryName ? { beneficiaryName: body.beneficiaryName.trim() } : {}),
        };
      } else if (typeof rawDetails === 'object' && rawDetails !== null) {
        detailsObj = { ...rawDetails };
        if (body.beneficiaryName && !detailsObj.beneficiaryName) {
          detailsObj.beneficiaryName = body.beneficiaryName.trim();
        }
      }

      const updated = gvDb.updateDeveloperSettings(user!.userId, {
        payoutMethod,
        payoutDetails: detailsObj,
      });

      return NextResponse.json({
        success: true,
        message: 'Developer payout method saved successfully!',
        settings: updated,
      });
    }

    // 4. Delete / Reset Developer Payout Method
    if (action === 'DELETE_METHOD') {
      const updated = gvDb.updateDeveloperSettings(user!.userId, {
        payoutMethod: undefined,
        payoutDetails: {},
        bankAccount: undefined,
        upi: undefined,
      });

      return NextResponse.json({
        success: true,
        message: 'Developer payout method deleted successfully!',
        settings: updated,
      });
    }

    // 5. Request Payout with Amount
    const settings = gvDb.getDeveloperSettings(user!.userId);

    // Business Rule: Unverified studio cannot withdraw or earn
    if (settings.studioVerified === false) {
      return NextResponse.json(
        {
          error:
            'Studio Verification Required: Your studio is not verified. Earnings and withdrawal requests are blocked until studio verification is complete.',
        },
        { status: 400 }
      );
    }

    const method =
      payoutMethod ||
      (settings?.bankAccount?.accountNumber ? 'BANK_WIRE' : settings?.upi?.upiId ? 'UPI' : settings?.payoutMethod);
    const hasConfig =
      !!settings?.bankAccount?.accountNumber ||
      !!settings?.upi?.upiId ||
      (settings?.payoutDetails && Object.keys(settings.payoutDetails).length > 0);

    if (!method || !hasConfig) {
      return NextResponse.json(
        { error: 'Please configure and save your payout method first.' },
        { status: 400 }
      );
    }

    const summary = getCreatorPayoutSummary(user!.userId);
    const defaultAmount = summary.availableBalance > 0 ? summary.availableBalance : 100;
    const numAmount = amount !== undefined && amount !== null && amount !== '' ? Number(amount) : defaultAmount;
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Please enter a valid payout withdrawal amount greater than 0.' },
        { status: 400 }
      );
    }

    const destinationLabel =
      method === 'UPI'
        ? `UPI (${settings.upi?.upiId || settings.payoutDetails?.upiId || 'VPA'})`
        : `Bank Wire (${settings.bankAccount?.bankName || 'Direct Account'} - ${settings.bankAccount?.accountNumber?.slice(-4) || 'Saved'})`;

    const payoutReference = `PO-DEV-${Date.now().toString(36).toUpperCase()}`;

    // Record in ledger so it shows in developer payout history table
    const record = gvDb.createFinancialRecord({
      creatorId: user!.userId,
      gameId: 'all-titles',
      gameTitle: 'Studio Creator Revenue Distribution',
      period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      grossRevenue: numAmount,
      deductions: 0,
      netRevenue: numAmount,
      creatorShare: numAmount,
      currency: 'INR',
      status: 'PENDING',
      payoutMethod: method,
      payoutReference,
    });

    return NextResponse.json({
      success: true,
      message: `Payout request for ₹${numAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} submitted successfully!`,
      amount: numAmount,
      payoutReference,
      record,
    });
  } catch (err: any) {
    console.error('Error processing developer payout request:', err);
    return NextResponse.json(
      { error: `Failed to process payout request: ${err.message}` },
      { status: 500 }
    );
  }
}
