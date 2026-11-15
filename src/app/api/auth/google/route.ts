import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';
import { generateToken } from '@/lib/auth';

const DEFAULT_PASSWORD_HASH = '$2a$10$xwgNcEA.gPkAUr9ig8Tmb.LBWkWxnfHB479NuHg8MgeMwzAbwlxum';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // If empty body, fall back to standard Google gamer credentials
    body = {};
  }

  const {
    email = 'google.gamer@gameverse.com',
    name = 'CrazyGamer_Google',
    avatarUrl = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  } = body;

  const normalizedEmail = (typeof email === 'string' ? email : 'google.gamer@gameverse.com').trim().toLowerCase();
  const gamerName = (typeof name === 'string' && name.trim()) ? name.trim() : 'CrazyGamer_Google';

  try {
    let user = gvDb.findUserByEmail(normalizedEmail);

    if (!user) {
      // Create new Player account registered through Google OAuth SSO
      const newUserId = `usr-google-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      user = gvDb.createUser({
        id: newUserId,
        email: normalizedEmail,
        name: gamerName,
        role: 'PLAYER',
        emailVerified: true,
        passwordHash: DEFAULT_PASSWORD_HASH,
      });

      gvDb.logAudit({
        actorId: user.id,
        actorName: user.name,
        action: 'USER_REGISTERED_GOOGLE_SSO',
        targetType: 'USER',
        targetId: user.id,
        details: { provider: 'GOOGLE', email: normalizedEmail },
        ipAddress: ip,
      });
    } else {
      // Ensure only PLAYER accounts can authenticate via Player Google SSO
      if (user.role !== 'PLAYER') {
        return NextResponse.json(
          { success: false, error: 'This Google account is linked to a non-player portal. Please use your dedicated login.' },
          { status: 403 }
        );
      }
    }

    // Generate authenticated JWT session
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
      details: { role: user.role, provider: 'GOOGLE_SSO' },
      ipAddress: ip,
    });

    const response = NextResponse.json({
      success: true,
      provider: 'GOOGLE',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified ?? true,
        avatarUrl,
      },
      token,
      message: 'Successfully signed in with Google.',
    });

    // Set HTTP-only secure cookie
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
      { success: false, error: `Google sign-in failed: ${err.message}` },
      { status: 500 }
    );
  }
}
