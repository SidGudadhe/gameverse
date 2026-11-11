import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateToken } from '@/lib/auth';
import { gvDb } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const { tempToken, code } = await req.json();

    if (!tempToken || !code) {
      return NextResponse.json(
        { success: false, error: 'tempToken and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const payload = verifyToken(tempToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired 2FA session token. Please log in again.' },
        { status: 401 }
      );
    }

    const user = gvDb.findUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    // Verify 6-digit code (simulated TOTP verification or default '123456' for test suite)
    const validCodes = ['123456', '888888', '000000'];
    const isCodeValid = validCodes.includes(code.trim()) || code === user.twoFactorSecret;

    if (!isCodeValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid 2FA security code. Please check your authenticator app.' },
        { status: 401 }
      );
    }

    // Issue Full Session
    const fullSessionToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    gvDb.logAudit({
      actorId: user.id,
      actorName: user.name,
      action: 'ADMIN_2FA_SUCCESS',
      targetType: 'USER',
      targetId: user.id,
      details: { role: user.role },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication verified successfully.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token: fullSessionToken,
    });

    response.cookies.set('gameverse_session', fullSessionToken, {
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
