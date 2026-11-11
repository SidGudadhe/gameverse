import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/middleware';
import { eraseUserData } from '@/lib/privacy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const confirmation = body.confirmation?.toString().trim();

    if (confirmation !== 'DELETE' && confirmation !== 'DELETE MY DATA') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Confirmation required: You must submit { "confirmation": "DELETE" } to proceed with irreversible erasure under GDPR/DPDP.',
        },
        { status: 400 }
      );
    }

    const result = eraseUserData(user!.userId, {
      id: user!.userId,
      name: user!.name,
      role: user!.role,
    });

    const response = NextResponse.json({
      success: true,
      message: result.message,
      erasedUserId: result.erasedUserId,
    });

    // Invalidate and clear the session cookie
    response.cookies.delete('gameverse_session');

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Account erasure failed: ${err.message}` },
      { status: 500 }
    );
  }
}
