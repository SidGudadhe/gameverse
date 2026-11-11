import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireRole(req, 'DEVELOPER');
  if (errorResponse) return errorResponse;

  const profile = gvDb.getProfileByUserId(user!.userId);
  const agreement = gvDb.getAgreementByUserId(user!.userId);

  return NextResponse.json({
    success: true,
    data: {
      profile,
      agreement,
    },
  });
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = requireRole(req, 'DEVELOPER');
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { studioName, website, bio, portfolioUrl, displayName } = body;

    const updated = gvDb.updateProfile(user!.userId, {
      studioName,
      website,
      bio,
      portfolioUrl,
      displayName,
    });

    gvDb.logAudit({
      actorId: user!.userId,
      actorName: user!.name,
      action: 'UPDATE_STUDIO_PROFILE',
      targetType: 'PROFILE',
      targetId: updated.id,
      details: { studioName },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Studio profile updated successfully.',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
