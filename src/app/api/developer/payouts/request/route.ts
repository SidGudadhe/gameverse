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
    const { action = 'REQUEST_PAYOUT', payoutMethod, payoutDetails, amount, note } = body;

    // 1. Save or Update Developer Payout Method
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

    // 2. Delete / Reset Developer Payout Method
    if (action === 'DELETE_METHOD') {
      const updated = gvDb.updateDeveloperSettings(user!.userId, {
        payoutMethod: undefined,
        payoutDetails: {},
      });

      return NextResponse.json({
        success: true,
        message: 'Developer payout method deleted successfully!',
        settings: updated,
      });
    }

    // 3. Request Payout with Amount
    const settings = gvDb.getDeveloperSettings(user!.userId);
    const method = payoutMethod || settings?.payoutMethod;
    const details = payoutDetails || settings?.payoutDetails;

    if (!method || !details) {
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
      status: 'PROCESSING',
      payoutMethod: method,
      payoutReference,
    });

    return NextResponse.json({
      success: true,
      message: `Payout request for $${numAmount.toFixed(2)} submitted successfully!`,
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
