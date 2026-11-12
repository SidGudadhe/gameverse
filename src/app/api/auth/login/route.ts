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
    const { email, password, portal } = body;

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

    // ================= STRICT INDEPENDENT PORTAL ISOLATION & ENUMERATION PREVENTION =================
    // If an account belonging to a different role attempts to log in on this portal,
    // return generic 401 "Invalid email or password." so unknown parties cannot deduce
    // whether an account exists or which role it belongs to.
    const isPlayerAllowed = portal === 'PLAYER' && user.role === 'PLAYER';
    const isDeveloperAllowed = portal === 'DEVELOPER' && (user.role === 'DEVELOPER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    const isAdminAllowed = portal === 'ADMIN' && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR');

    if (portal && !(isPlayerAllowed || isDeveloperAllowed || isAdminAllowed)) {
      // Record security audit trail internally for forensic tracking
      gvDb.logAudit({
        actorId: user.id,
        actorName: user.name,
        action: 'CROSS_PORTAL_LOGIN_BLOCKED',
        targetType: 'USER',
        targetId: user.id,
        details: { attemptedPortal: portal, userRole: user.role, email },
        ipAddress: ip,
      });

      // Generic authentication error - zero account / role disclosure
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
