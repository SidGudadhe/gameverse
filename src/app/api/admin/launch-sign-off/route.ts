import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';
import {
  evaluateLaunchReadiness,
  executeProductionSignOff,
  getLastLaunchCertificate,
} from '@/lib/launch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = requireRole(req, 'ADMIN');
    if (errorResponse) return errorResponse;

    const evaluation = evaluateLaunchReadiness();
    const certificate = getLastLaunchCertificate();

    return NextResponse.json({
      success: true,
      evaluation,
      certificate,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to evaluate launch readiness: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'ADMIN');
    if (errorResponse) return errorResponse;

    const dbUser = gvDb.findUserById(user!.userId);
    const adminDetails = {
      id: user!.userId,
      name: dbUser?.name || 'Platform Administrator',
      email: user!.email,
    };

    const result = executeProductionSignOff(adminDetails);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'GameVerse Production Launch authorized and cryptographically signed off!',
      certificate: result.certificate,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Production sign-off failed: ${err.message}` },
      { status: 500 }
    );
  }
}
