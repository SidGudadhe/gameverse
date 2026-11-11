import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '../../../../../lib/security/middleware';
import { generateMonthlySettlement, disbursePayoutBatch } from '../../../../../lib/ledger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = requireRole(req, 'ADMIN');
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { action, period, recordIds, payoutReference } = body;

    if (action === 'FINALIZE_PERIOD') {
      if (!period) {
        return NextResponse.json(
          { error: 'Period is required for monthly settlement.' },
          { status: 400 }
        );
      }
      const result = generateMonthlySettlement(period);
      return NextResponse.json({
        success: true,
        action: 'FINALIZE_PERIOD',
        period,
        settledCount: result.settledCount,
        totalSettledAmount: result.totalSettledAmount,
      });
    }

    if (action === 'DISBURSE_BATCH') {
      if (!Array.isArray(recordIds) || recordIds.length === 0) {
        return NextResponse.json(
          { error: 'recordIds array is required to disburse batch.' },
          { status: 400 }
        );
      }
      const ref = payoutReference || `batch_${Date.now()}`;
      const result = disbursePayoutBatch(recordIds, ref);
      return NextResponse.json({
        success: true,
        action: 'DISBURSE_BATCH',
        recordsUpdated: result.recordsUpdated,
        disbursedAmount: result.disbursedAmount,
        payoutReference: ref,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be FINALIZE_PERIOD or DISBURSE_BATCH.' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error in admin finance settle action:', err);
    return NextResponse.json(
      { error: `Settlement action failed: ${err.message}` },
      { status: 500 }
    );
  }
}
