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

    // ================= STRICT PORTAL ISOLATION CHECKS =================
    // 1. Player Portal Isolation: Only Gamers allowed to log in at /auth/login
    if (portal === 'PLAYER') {
      if (user.role === 'DEVELOPER') {
        return NextResponse.json(
          {
            success: false,
            error: 'This is a Developer Studio account. Please sign in via the dedicated Developer Portal.',
            portalMismatch: 'DEVELOPER',
            redirectUrl: '/developer/auth/login',
          },
          { status: 403 }
        );
      }
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR') {
        return NextResponse.json(
          {
            success: false,
            error: 'This is an Admin Staff account. Please sign in via the dedicated Admin Operations Portal.',
            portalMismatch: 'ADMIN',
            redirectUrl: '/admin/auth/login',
          },
          { status: 403 }
        );
      }
    }

    // 2. Developer Studio Portal Isolation: Only Developers / Admins allowed at /developer/auth/login
    if (portal === 'DEVELOPER') {
      if (user.role === 'PLAYER') {
        return NextResponse.json(
          {
            success: false,
            error: 'Access Denied: Player accounts cannot access Developer Studio. Sign in at the Gamer Portal or register as a Game Studio.',
            portalMismatch: 'PLAYER',
            redirectUrl: '/auth/login',
          },
          { status: 403 }
        );
      }
    }

    // 3. Admin Operations Portal Isolation: Only Admin / Staff allowed at /admin/auth/login
    if (portal === 'ADMIN') {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'MODERATOR') {
        return NextResponse.json(
          {
            success: false,
            error: 'Access Denied (403 Forbidden): Unauthorized. This portal is strictly restricted to GameVerse Administrative Staff.',
            portalMismatch: 'UNAUTHORIZED',
            redirectUrl: '/auth/login',
          },
          { status: 403 }
        );
      }
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
