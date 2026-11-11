import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '../../../../lib/security/middleware';
import { gvDb } from '../../../../lib/database';
import { getPlatformFinancialOverview } from '../../../../lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = requireRole(req, 'ADMIN');
    if (errorResponse) return errorResponse;

    const overview = getPlatformFinancialOverview();
    const records = gvDb.getFinancialRecords();

    return NextResponse.json({
      success: true,
      overview,
      records,
    });
  } catch (err: any) {
    console.error('Error fetching admin finance overview:', err);
    return NextResponse.json(
      { error: `Failed to fetch finance overview: ${err.message}` },
      { status: 500 }
    );
  }
}
