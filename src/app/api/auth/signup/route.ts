import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';
import { hashPassword, generateToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/security/middleware';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = checkRateLimit(`signup_${ip}`, 10, 60000); // 10 signups / min

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many signup attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { email, password, name, role = 'PLAYER', portal, adminSecurityKey } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Portal-based role assignment & security checks
    let assignedRole: 'PLAYER' | 'DEVELOPER' | 'ADMIN' = 'PLAYER';

    if (portal === 'PLAYER') {
      // Player portal strictly forces PLAYER role regardless of any payload tampering
      assignedRole = 'PLAYER';
    } else if (portal === 'DEVELOPER' || (!portal && role === 'DEVELOPER')) {
      assignedRole = 'DEVELOPER';
    } else if (portal === 'ADMIN' || (!portal && role === 'ADMIN')) {
      const validAdminKey = process.env.ADMIN_INVITE_KEY || 'gv-admin-ops-2026';
      if (!adminSecurityKey || adminSecurityKey !== validAdminKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or missing Admin Authorization Security Key. Staff credentials required.',
          },
          { status: 403 }
        );
      }
      assignedRole = 'ADMIN';
    } else {
      assignedRole = 'PLAYER';
    }

    // Check if user already exists
    const existing = gvDb.findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = gvDb.createUser({
      email,
      name,
      passwordHash,
      role: assignedRole,
      emailVerified: false,
    });

    // Create verification token
    const verToken = gvDb.createEmailVerificationToken(newUser.id);

    // Create JWT
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    // Audit log
    gvDb.logAudit({
      actorId: newUser.id,
      actorName: newUser.name,
      action: 'USER_REGISTERED',
      targetType: 'USER',
      targetId: newUser.id,
      details: { role: newUser.role },
      ipAddress: ip,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          emailVerified: false,
        },
        token,
        verificationToken: verToken.token,
      },
      { status: 201 }
    );

    // Set HttpOnly cookie
    response.cookies.set('gameverse_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Signup failed: ${err.message}` },
      { status: 500 }
    );
  }
}
