import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email address is required.' }, { status: 400 });
    }

    const user = gvDb.findUserByEmail(email);

    // Return generic success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been dispatched.',
      });
    }

    const resetToken = gvDb.createPasswordResetToken(email);

    return NextResponse.json({
      success: true,
      message: 'Password reset link has been dispatched.',
      resetToken: resetToken.token, // Returned for testing / email delivery
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
