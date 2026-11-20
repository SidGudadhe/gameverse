import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;

    const dbUser = gvDb.findUserById(authUser!.userId);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const isDeletionScheduled = Boolean(dbUser.scheduledDeletionAt);
    let daysRemaining = 0;
    if (dbUser.scheduledDeletionAt) {
      const scheduledTime = new Date(dbUser.scheduledDeletionAt).getTime();
      const diffMs = scheduledTime - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    }

    return NextResponse.json({
      success: true,
      isDeletionScheduled,
      deletionRequestedAt: dbUser.deletionRequestedAt || null,
      scheduledDeletionAt: dbUser.scheduledDeletionAt || null,
      daysRemaining,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to fetch account deletion status: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'REQUEST_DELETION';

    const dbUser = gvDb.findUserById(authUser!.userId);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    if (action === 'REQUEST_DELETION') {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const updated = gvDb.updateUser(dbUser.id, {
        deletionRequestedAt: now.toISOString(),
        scheduledDeletionAt: thirtyDaysLater.toISOString(),
      });

      gvDb.logAudit({
        actorId: dbUser.id,
        actorName: dbUser.name,
        action: 'ACCOUNT_DELETION_SCHEDULED',
        targetType: 'USER',
        targetId: dbUser.id,
        details: {
          requestedAt: now.toISOString(),
          scheduledPurgeDate: thirtyDaysLater.toISOString(),
          gracePeriodDays: 30,
        },
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });

      return NextResponse.json({
        success: true,
        message: 'Account deletion requested. Your account and catalog will be permanently purged in 30 days unless cancelled.',
        isDeletionScheduled: true,
        deletionRequestedAt: now.toISOString(),
        scheduledDeletionAt: thirtyDaysLater.toISOString(),
        daysRemaining: 30,
      });
    } else if (action === 'CANCEL_DELETION') {
      const updated = gvDb.updateUser(dbUser.id, {
        deletionRequestedAt: undefined,
        scheduledDeletionAt: undefined,
      });

      gvDb.logAudit({
        actorId: dbUser.id,
        actorName: dbUser.name,
        action: 'ACCOUNT_DELETION_CANCELLED',
        targetType: 'USER',
        targetId: dbUser.id,
        details: { cancelledAt: new Date().toISOString() },
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });

      return NextResponse.json({
        success: true,
        message: 'Account deletion successfully cancelled. Your developer studio remains active.',
        isDeletionScheduled: false,
        deletionRequestedAt: null,
        scheduledDeletionAt: null,
        daysRemaining: 0,
      });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Account deletion action failed: ${err.message}` },
      { status: 500 }
    );
  }
}
