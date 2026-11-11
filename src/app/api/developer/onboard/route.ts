import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireRole(req, 'DEVELOPER');
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { agreementVersion, studioName, website, bio } = body;

    if (!agreementVersion) {
      return NextResponse.json(
        { success: false, error: 'Agreement version confirmation is required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Record Creator Agreement
    const agreement = gvDb.saveAgreement({
      userId: user!.userId,
      agreementVersion,
      ipAddress: ip,
      accountStatus: 'ACTIVE',
    });

    // 2. Update Studio Profile
    const profile = gvDb.updateProfile(user!.userId, {
      studioName: studioName || user!.name,
      displayName: studioName || user!.name,
      website: website || undefined,
      bio: bio || undefined,
    });

    // 3. Write Audit Log
    gvDb.logAudit({
      actorId: user!.userId,
      actorName: user!.name,
      action: 'CREATOR_AGREEMENT_ACCEPTED',
      targetType: 'CREATOR_AGREEMENT',
      targetId: agreement.id,
      details: { agreementVersion, ipAddress: ip },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed and Creator Agreement successfully recorded.',
      agreement,
      profile,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
