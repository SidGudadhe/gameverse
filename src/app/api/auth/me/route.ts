import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse) return errorResponse;

  const dbUser = gvDb.findUserById(user!.userId);
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
