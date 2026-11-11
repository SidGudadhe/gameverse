import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'DEVELOPER');
    if (errorResponse) return errorResponse;
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('id');

    if (submissionId) {
      const submission = gvDb.getSubmissionById(submissionId);
      if (!submission) {
        return NextResponse.json({ success: false, error: 'Submission not found.' }, { status: 404 });
      }

      // Check tenant ownership
      const game = gvDb.getGameById(submission.gameId);
      if (game && game.developerId !== user.userId && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to view this submission.' },
          { status: 403 }
        );
      }

      const version = gvDb.getVersionById(submission.versionId);
      const rights = gvDb.getRightsDeclarationByVersionId(submission.versionId);

      return NextResponse.json({
        success: true,
        submission,
        game,
        version,
        rights,
      });
    }

    // List all submissions for this developer (tenant isolation enforced)
    const submissions = gvDb.getSubmissionsByCreator(user.userId);
    const detailed = submissions.map((sub) => {
      const game = gvDb.getGameById(sub.gameId);
      const version = gvDb.getVersionById(sub.versionId);
      const rights = gvDb.getRightsDeclarationByVersionId(sub.versionId);
      return {
        ...sub,
        game,
        version,
        rights,
      };
    });

    return NextResponse.json({
      success: true,
      count: detailed.length,
      submissions: detailed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to fetch submissions: ${err.message}` },
      { status: 500 }
    );
  }
}
