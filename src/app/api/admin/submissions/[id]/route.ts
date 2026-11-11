import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, errorResponse } = requireRole(req, 'MODERATOR');
    if (errorResponse) return errorResponse;
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const submission = gvDb.getSubmissionById(params.id);
    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found.' }, { status: 404 });
    }

    const game = gvDb.getGameById(submission.gameId);
    const version = gvDb.getVersionById(submission.versionId);
    const rights = gvDb.getRightsDeclarationByVersionId(submission.versionId);

    return NextResponse.json({
      success: true,
      submission,
      game,
      version,
      rights,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to fetch submission: ${err.message}` },
      { status: 500 }
    );
  }
}
