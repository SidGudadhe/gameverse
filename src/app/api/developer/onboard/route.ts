import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/middleware';
import { generateToken } from '@/lib/auth';
import { gvDb } from '@/lib/database';

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireAuth(req);
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

    // 2. Ensure user has DEVELOPER role in database
    let activeUser = gvDb.findUserById(user!.userId);
    if (activeUser && activeUser.role === 'PLAYER') {
      gvDb.updateUser(activeUser.id, { role: 'DEVELOPER' });
      activeUser.role = 'DEVELOPER';
    }

    // 3. Update Studio Profile
    const profile = gvDb.updateProfile(user!.userId, {
      studioName: studioName || user!.name,
      displayName: studioName || user!.name,
      website: website || undefined,
      bio: bio || undefined,
    });

    // 4. Write Audit Log
    gvDb.logAudit({
      actorId: user!.userId,
      actorName: user!.name,
      action: 'CREATOR_AGREEMENT_ACCEPTED',
      targetType: 'CREATOR_AGREEMENT',
      targetId: agreement.id,
      details: { agreementVersion, ipAddress: ip },
      ipAddress: ip,
    });

    // 5. Generate fresh JWT token with DEVELOPER role
    const token = generateToken({
      userId: activeUser ? activeUser.id : user!.userId,
      email: activeUser ? activeUser.email : user!.email,
      role: 'DEVELOPER',
      name: activeUser ? activeUser.name : user!.name,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Onboarding completed and Creator Agreement successfully recorded.',
      agreement,
      profile,
      token,
      user: {
        id: activeUser ? activeUser.id : user!.userId,
        email: activeUser ? activeUser.email : user!.email,
        name: activeUser ? activeUser.name : user!.name,
        role: 'DEVELOPER',
      },
    });

    // Set developer session cookies
    response.cookies.set('gameverse_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.set('gameverse_developer_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
