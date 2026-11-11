import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse) return errorResponse;

  const dbUser = gvDb.findUserById(user!.userId);
  if (!dbUser) {
    return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
  }

  return NextResponse.json({
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
}
