import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token and newPassword are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);
    const success = gvDb.usePasswordResetToken(token, newHash);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Invalid, used, or expired password reset token.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated. You may now log in with your new credentials.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
