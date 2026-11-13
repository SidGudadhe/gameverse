import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';
import { verifyPassword, generateToken } from '@/lib/auth';
import { checkRateLimit, resetRateLimit, ROLE_LOGIN_RATE_LIMITS } from '@/lib/security/middleware';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  const { email, password, portal: rawPortal } = body || {};
  const portal: 'PLAYER' | 'DEVELOPER' | 'ADMIN' =
    rawPortal === 'DEVELOPER' || rawPortal === 'ADMIN' ? rawPortal : 'PLAYER';

  const rateConfig = ROLE_LOGIN_RATE_LIMITS[portal] || ROLE_LOGIN_RATE_LIMITS.PLAYER;

  // ================= TIERED RATE LIMITING PER ROLE / PORTAL =================
  // 1. Per-IP & Portal tracking
  const ipLimitKey = `login_portal_${portal.toLowerCase()}_ip_${ip}`;
  const ipRateLimit = checkRateLimit(ipLimitKey, rateConfig.maxAttempts, rateConfig.windowMs);

  // 2. Per-Email & Portal tracking (prevents distributed brute force against a specific account)
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  let emailRateLimit = { allowed: true, remaining: rateConfig.maxAttempts, resetAt: ipRateLimit.resetAt };
  if (normalizedEmail) {
    const emailLimitKey = `login_portal_${portal.toLowerCase()}_email_${normalizedEmail}`;
    emailRateLimit = checkRateLimit(emailLimitKey, rateConfig.maxAttempts, rateConfig.windowMs);
  }

  const isRateLimited = !ipRateLimit.allowed || !emailRateLimit.allowed;
  const resetAt = Math.max(ipRateLimit.resetAt, emailRateLimit.resetAt);
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

  if (isRateLimited) {
    gvDb.logAudit({
      actorId: normalizedEmail || 'anonymous',
      actorName: 'Unauthenticated Attacker',
      action: 'RATE_LIMIT_EXCEEDED',
      targetType: 'SYSTEM',
      targetId: `portal-${portal.toLowerCase()}`,
      details: {
        portal,
        portalLabel: rateConfig.label,
        ip,
        email: normalizedEmail,
        maxAttempts: rateConfig.maxAttempts,
        windowMs: rateConfig.windowMs,
        retryAfterSeconds,
      },
      ipAddress: ip,
    });

    const res = NextResponse.json(
      {
        success: false,
        error: `Too many login attempts on the ${rateConfig.label}. Please wait ${retryAfterSeconds} seconds before trying again.`,
        portal,
        retryAfter: retryAfterSeconds,
      },
      { status: 429 }
    );

    res.headers.set('Retry-After', retryAfterSeconds.toString());
    res.headers.set('X-RateLimit-Limit', rateConfig.maxAttempts.toString());
    res.headers.set('X-RateLimit-Remaining', '0');
    res.headers.set('X-RateLimit-Reset', resetAt.toString());

    return res;
  }

  try {
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = normalizedEmail || (typeof email === 'string' ? email.trim().toLowerCase() : '');
    const user = gvDb.findUserByEmail(cleanEmail);
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

    // Reset rate limiter on successful authentication so valid users are never throttled
    resetRateLimit(ipLimitKey);
    if (cleanEmail) {
      resetRateLimit(`login_portal_${portal.toLowerCase()}_email_${cleanEmail}`);
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
