import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '../../../../../lib/security/middleware';
import { requestPayout } from '../../../../../lib/ledger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;

    const result = requestPayout(user!.userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Payout request of $${result.amount?.toFixed(2)} submitted successfully.`,
      amount: result.amount,
      recordIds: result.recordIds,
      payoutReference: result.payoutReference,
    });
  } catch (err: any) {
    console.error('Error processing payout request:', err);
    return NextResponse.json(
      { error: `Failed to process payout request: ${err.message}` },
      { status: 500 }
    );
  }
}
