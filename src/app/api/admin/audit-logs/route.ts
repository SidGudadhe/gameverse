import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';
import { verifyAuditTrailIntegrity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'ADMIN');
    if (errorResponse) return errorResponse;

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500);

    const logs = gvDb.getAuditLogs(limit, { action, search });
    const integrity = verifyAuditTrailIntegrity();

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
      integrity,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to retrieve audit logs: ${err.message}` },
      { status: 500 }
    );
  }
}
