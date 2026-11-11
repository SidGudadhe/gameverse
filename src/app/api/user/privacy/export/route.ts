import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/middleware';
import { exportUserData } from '@/lib/privacy';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const dataPackage = exportUserData(user!.userId);

    const filename = `gameverse-privacy-export-${user!.userId}.json`;
    const jsonString = JSON.stringify(dataPackage, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to export personal data: ${err.message}` },
      { status: 500 }
    );
  }
}
