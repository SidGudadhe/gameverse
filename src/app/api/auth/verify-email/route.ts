import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Verification token is required.' }, { status: 400 });
    }

    const verifiedUser = gvDb.verifyEmailToken(token);
    if (!verifiedUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired email verification token.' },
        { status: 400 }
      );
    }

    gvDb.logAudit({
      actorId: verifiedUser.id,
      actorName: verifiedUser.name,
      action: 'EMAIL_VERIFIED',
      targetType: 'USER',
      targetId: verifiedUser.id,
      details: {},
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Email address successfully verified.',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        emailVerified: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
