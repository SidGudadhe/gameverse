import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';
import { verifyPassword, generateToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/security/middleware';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = checkRateLimit(`login_${ip}`, 10, 60000); // 10 login attempts / min

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many login attempts. Please wait 60 seconds before trying again.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = gvDb.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check if user requires 2FA (e.g. Admin role with twoFactorEnabled)
    if (user.twoFactorEnabled && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      const tempToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      return NextResponse.json({
        success: true,
        requires2FA: true,
        tempToken,
        message: 'Two-Factor Authentication (2FA) verification code required.',
      });
    }

    // Issue Full Session
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    gvDb.logAudit({
      actorId: user.id,
      actorName: user.name,
      action: 'USER_LOGIN',
      targetType: 'USER',
      targetId: user.id,
      details: { role: user.role },
      ipAddress: ip,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token,
    });

    response.cookies.set('gameverse_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Login failed: ${err.message}` },
      { status: 500 }
    );
  }
}
