import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '../../../../lib/security/middleware';
import { gvDb } from '../../../../lib/database';
import { getCreatorPayoutSummary } from '../../../../lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;

    const summary = getCreatorPayoutSummary(user!.userId);
    const records = gvDb.getFinancialRecords({ creatorId: user!.userId });

    return NextResponse.json({
      success: true,
      summary,
      records,
    });
  } catch (err: any) {
    console.error('Error fetching creator payouts:', err);
    return NextResponse.json(
      { error: `Failed to fetch payouts: ${err.message}` },
      { status: 500 }
    );
  }
}
