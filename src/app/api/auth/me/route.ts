import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse) return errorResponse;

  const portalParam = req.nextUrl.searchParams.get('portal');
  const referer = req.headers.get('referer') || '';
  const isDevPortal = portalParam === 'DEVELOPER' || referer.includes('/developer');
  const isAdminPortal = portalParam === 'ADMIN' || referer.includes('/admin');
  const isPlayerPortal = portalParam === 'PLAYER' || (!isDevPortal && !isAdminPortal);

  let dbUser = gvDb.findUserById(user!.userId);

  // If in Developer portal and current session user is PLAYER, check if a DEVELOPER account exists for that email
  if (isDevPortal && dbUser && dbUser.role === 'PLAYER') {
    const devUser = gvDb.findUserByEmail(dbUser.email, 'DEVELOPER');
    if (devUser && (devUser.role === 'DEVELOPER' || devUser.role === 'ADMIN' || devUser.role === 'SUPER_ADMIN')) {
      dbUser = devUser;
    }
  } else if (isPlayerPortal && dbUser && (dbUser.role === 'DEVELOPER' || dbUser.role === 'ADMIN')) {
    // If on Player portal and user has a dedicated PLAYER account with the same email, use the PLAYER account
    const playerUser = gvDb.findUserByEmail(dbUser.email, 'PLAYER');
    if (playerUser) {
      dbUser = playerUser;
    }
  }

  if (!dbUser) {
    const notFoundRes = NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    notFoundRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    notFoundRes.headers.set('Pragma', 'no-cache');
    return notFoundRes;
  }

  const response = NextResponse.json({
    success: true,
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      emailVerified: dbUser.emailVerified,
      twoFactorEnabled: dbUser.twoFactorEnabled,
    },
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
