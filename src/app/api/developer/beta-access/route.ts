import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { claimBetaInvitation, verifyBetaInvitation } from '@/lib/beta';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const token = body.token?.toString().trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Beta invitation code is required.' },
        { status: 400 }
      );
    }

    const result = claimBetaInvitation(token, user!.userId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Private Beta Access verified and claimed successfully!',
      studioName: result.studioName,
      status: 'VERIFIED_BETA_CREATOR',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to claim beta code: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "token" is required.' },
        { status: 400 }
      );
    }

    const check = verifyBetaInvitation(token);
    return NextResponse.json(check);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to verify code: ${err.message}` },
      { status: 500 }
    );
  }
}
