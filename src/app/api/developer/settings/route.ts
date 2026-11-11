import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireRole(req, 'DEVELOPER');
  if (errorResponse) return errorResponse;

  const settings = gvDb.getDeveloperSettings(user!.userId);
  return NextResponse.json({ success: true, data: settings });
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = requireRole(req, 'DEVELOPER');
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { payoutMethod, payoutDetails, notifyOnQaUpdate, notifyOnPayout, notifyOnPlayerReport } = body;

    const updated = gvDb.updateDeveloperSettings(user!.userId, {
      payoutMethod,
      payoutDetails,
      notifyOnQaUpdate,
      notifyOnPayout,
      notifyOnPlayerReport,
    });

    gvDb.logAudit({
      actorId: user!.userId,
      actorName: user!.name,
      action: 'UPDATE_DEVELOPER_SETTINGS',
      targetType: 'DEVELOPER_SETTINGS',
      targetId: updated.id,
      details: { payoutMethod },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Developer settings successfully updated.',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
