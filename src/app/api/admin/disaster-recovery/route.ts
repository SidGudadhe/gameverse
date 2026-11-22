import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import {
  listPlatformSnapshots,
  createPlatformSnapshot,
  executeDisasterRecoveryDrill,
  restorePlatformSnapshot,
} from '@/lib/backup';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = requireRole(req, 'ADMIN');
    if (errorResponse) return errorResponse;

    const snapshots = await listPlatformSnapshots();

    return NextResponse.json({
      success: true,
      snapshots,
      totalSnapshots: snapshots.length,
      latestSnapshot: snapshots[0] || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to retrieve disaster recovery metadata: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = requireRole(req, 'ADMIN');
    if (errorResponse) return errorResponse;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty for default drill action
    }

    const action = body.action || 'drill';

    if (action === 'snapshot') {
      const snapshot = await createPlatformSnapshot(body.label);
      return NextResponse.json({
        success: true,
        message: 'Platform backup snapshot created with SHA-256 seal.',
        snapshot,
      });
    }

    if (action === 'restore') {
      if (!body.snapshotId) {
        return NextResponse.json(
          { success: false, error: 'snapshotId is required for restore operation.' },
          { status: 400 }
        );
      }
      const restoreResult = await restorePlatformSnapshot(body.snapshotId);
      return NextResponse.json({
        success: true,
        message: `Platform successfully restored from snapshot ${body.snapshotId}`,
        result: restoreResult,
      });
    }

    // Default action: execute full Disaster Recovery drill
    const drillResult = await executeDisasterRecoveryDrill();
    return NextResponse.json({
      success: drillResult.success,
      message: 'Disaster recovery catastrophe simulation and restore drill completed.',
      result: drillResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Disaster recovery operation failed: ${err.message}` },
      { status: 500 }
    );
  }
}
