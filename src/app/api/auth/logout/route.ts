import { NextRequest, NextResponse } from 'next/server';
import { extractAuth } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function POST(req: NextRequest) {
  const user = extractAuth(req);
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  if (user) {
    gvDb.logAudit({
      actorId: user.userId,
      actorName: user.name,
      action: 'USER_LOGOUT',
      targetType: 'USER',
      targetId: user.userId,
      details: {},
      ipAddress: ip,
    });
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.cookies.delete('gameverse_session');
  return response;
}
