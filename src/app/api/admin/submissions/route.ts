import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    // 1. Role Authorization (Moderator or Admin)
    const { user, errorResponse } = requireRole(req, 'MODERATOR');
    if (errorResponse) return errorResponse;
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const searchQuery = searchParams.get('search')?.toLowerCase();

    // 2. Fetch all submissions from global database
    let submissions = gvDb.getSubmissions();

    if (statusFilter && statusFilter !== 'ALL') {
      submissions = submissions.filter((s) => s.status === statusFilter);
    }

    if (searchQuery) {
      submissions = submissions.filter(
        (s) =>
          s.gameTitle.toLowerCase().includes(searchQuery) ||
          s.developerName.toLowerCase().includes(searchQuery)
      );
    }

    // 3. Attach linked Game, Version, and RightsDeclaration details
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

    // 4. Compute Operations Metrics
    const allGames = gvDb.getGames();
    const metrics = {
      totalSubmissions: submissions.length,
      pendingQa: submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'QA_TESTING').length,
      publishedLive: allGames.filter((g) => g.status === 'PUBLISHED').length,
      changesRequested: submissions.filter((s) => s.status === 'CHANGES_REQUESTED').length,
      rejected: submissions.filter((s) => s.status === 'REJECTED').length,
    };

    return NextResponse.json({
      success: true,
      metrics,
      count: detailed.length,
      submissions: detailed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to fetch admin submissions: ${err.message}` },
      { status: 500 }
    );
  }
}
