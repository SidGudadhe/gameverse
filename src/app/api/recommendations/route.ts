import { NextRequest, NextResponse } from 'next/server';
import { extractAuth } from '@/lib/security/middleware';
import {
  getPersonalizedRecommendations,
  getSearchFallbackRecommendations,
  getTopMoodsByUserAffinity,
  getSortedCategoriesByAffinity,
  MOOD_DEFINITIONS,
  GameMood,
} from '@/lib/recommendations';
import { gvDb } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const moodParam = (url.searchParams.get('mood')?.toUpperCase() || 'ALL') as GameMood;
    const queryParam = url.searchParams.get('query');
    const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get('limit') || '8', 10)));
    const excludeGameId = url.searchParams.get('exclude') || undefined;

    // Check optional authenticated user session
    const auth = extractAuth(req);
    const userId = auth?.userId;

    // 1. Search Fallback Mode (When query yields zero results)
    if (queryParam) {
      const fallback = getSearchFallbackRecommendations(queryParam, limit);
      return NextResponse.json({
        success: true,
        type: 'SEARCH_FALLBACK',
        query: queryParam,
        explanation: fallback.explanation,
        recommendations: fallback.recommendations,
      });
    }

    // 2. Adaptive Personalized Recommendation Mode
    const validMoods: GameMood[] = ['ALL', 'ADRENALINE', 'EXPLORATION', 'RELAX_PUZZLE', 'RETRO_NOSTALGIA'];
    const safeMood = validMoods.includes(moodParam) ? moodParam : 'ALL';

    const result = getPersonalizedRecommendations({
      userId,
      mood: safeMood,
      excludeGameId,
      limit,
    });

    const activeMoodDef = MOOD_DEFINITIONS[result.dominantMood] || MOOD_DEFINITIONS.ALL;

    // 3. Compute affinity-sorted mood order for this user
    const topMoods = getTopMoodsByUserAffinity(userId);

    // 4. Compute affinity-sorted categories for this user
    const rawCategories = gvDb.getCategories();
    const sortedCategories = getSortedCategoriesByAffinity(rawCategories, userId);

    return NextResponse.json({
      success: true,
      type: 'PERSONALIZED',
      userId: userId || null,
      mood: result.dominantMood,
      moodMetadata: activeMoodDef,
      recommendations: result.games,
      total: result.games.length,
      // Affinity-sorted mood buttons (most-loved mood first after ALL)
      topMoods,
      // Affinity-sorted categories (most-played category first)
      sortedCategories,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Recommendations query failed: ${err.message}` },
      { status: 500 }
    );
  }
}
