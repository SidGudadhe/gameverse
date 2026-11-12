import { gvDb } from '@/lib/database';
import { Game } from '@/types';
import {
  GameMood,
  MoodDefinition,
  MOOD_DEFINITIONS,
  PlayerAffinityProfile,
} from '@/types/recommendations';

export type { GameMood, MoodDefinition, PlayerAffinityProfile };
export { MOOD_DEFINITIONS };

/**
 * Computes a real-time behavioral affinity profile for a player
 * by analyzing their actual play history, session active seconds, ratings, and favorites.
 */
export function computePlayerAffinity(userId: string): PlayerAffinityProfile {
  const history = gvDb.getPlayHistory ? gvDb.getPlayHistory(userId, 50) : [];
  const favorites = gvDb.getFavoritesByUser ? gvDb.getFavoritesByUser(userId) : [];
  const userReviews = gvDb.getReviewsByUser ? gvDb.getReviewsByUser(userId) : [];

  const categoryWeights: Record<string, number> = {};
  const playedGameIds = new Set<string>();
  let totalPlayMinutes = 0;
  let interactionCount = 0;

  // 1. Ingest Playtime Signals (Heavier play = higher category affinity)
  for (const h of history) {
    playedGameIds.add(h.gameId);
    const playMins = h.totalPlayMinutes || 0;
    totalPlayMinutes += playMins;
    interactionCount++;

    const game = h.game || gvDb.getGameById(h.gameId);
    if (game && game.categoryId) {
      // 1 minute = +1 affinity, capped at +20 per game
      const points = Math.min(20, Math.max(1, playMins * 1.5));
      categoryWeights[game.categoryId] = (categoryWeights[game.categoryId] || 0) + points;
    }
  }

  // 2. Ingest Explicit Favorites (+8 points)
  for (const fav of favorites) {
    interactionCount++;
    const game = gvDb.getGameById(fav.gameId);
    if (game && game.categoryId) {
      categoryWeights[game.categoryId] = (categoryWeights[game.categoryId] || 0) + 8;
    }
  }

  // 3. Ingest Positive Ratings (4 or 5 stars = +10 points)
  for (const rev of userReviews) {
    interactionCount++;
    if (rev.rating >= 4) {
      const game = gvDb.getGameById(rev.gameId);
      if (game && game.categoryId) {
        categoryWeights[game.categoryId] = (categoryWeights[game.categoryId] || 0) + (rev.rating === 5 ? 10 : 6);
      }
    }
  }

  // Determine dominant mood from top category and history keywords
  let dominantMood: GameMood = 'ALL';
  const sortedCategories = Object.entries(categoryWeights).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0) {
    const topCat = sortedCategories[0][0];
    if (topCat === 'cat-arcade' || topCat === 'cat-action') {
      dominantMood = 'ADRENALINE';
    } else if (topCat === 'cat-rpg') {
      dominantMood = 'EXPLORATION';
    } else if (topCat === 'cat-puzzle' || topCat === 'cat-casual') {
      dominantMood = 'RELAX_PUZZLE';
    }
  }

  return {
    userId,
    categoryWeights,
    playedGameIds,
    totalPlayMinutes,
    dominantMood,
    interactionCount,
  };
}

/**
 * Computes how closely a game matches a specified mood
 */
export function getGameMoodAffinity(game: Game, mood: GameMood): number {
  if (mood === 'ALL') return 1.0;

  const def = MOOD_DEFINITIONS[mood];
  if (!def) return 0.5;

  let score = 0;

  // Category match
  if (def.relevantCategories.includes(game.categoryId)) {
    score += 0.6;
  }

  // Text / Keyword matching
  const searchCorpus = `${game.title} ${game.shortDescription} ${game.engine} ${game.categoryName}`.toLowerCase();
  for (const kw of def.keywords) {
    if (searchCorpus.includes(kw)) {
      score += 0.2;
    }
  }

  return Math.min(1.0, score);
}

/**
 * Core Adaptive Recommendation Engine (Instagram/TikTok style feedback loop)
 * Computes multi-signal affinity scores across all published games.
 */
export function getPersonalizedRecommendations(options: {
  userId?: string;
  mood?: GameMood;
  excludeGameId?: string;
  limit?: number;
}): { games: (Game & { matchReason: string; matchScore: number })[]; dominantMood: GameMood } {
  const { userId, mood = 'ALL', excludeGameId, limit = 8 } = options;
  const allPublished = gvDb.getGames({ status: 'PUBLISHED' });

  // Get player affinity profile if logged in
  const profile = userId ? computePlayerAffinity(userId) : null;
  const effectiveMood = mood !== 'ALL' ? mood : (profile?.dominantMood || 'ALL');

  const scoredGames = allPublished
    .filter((g) => g.id !== excludeGameId)
    .map((game) => {
      let score = 0;
      let reason = 'Trending on GameVerse';

      // Factor 1: Player Category Affinity (35% weight)
      if (profile && profile.categoryWeights[game.categoryId]) {
        const catWeight = profile.categoryWeights[game.categoryId];
        const normalizedCat = Math.min(1.0, catWeight / 25);
        score += normalizedCat * 0.35;
        reason = `Based on your interest in ${game.categoryName}`;
      } else {
        score += 0.15; // Baseline prior
      }

      // Factor 2: Mood Alignment (30% weight)
      if (effectiveMood !== 'ALL') {
        const moodMatch = getGameMoodAffinity(game, effectiveMood);
        score += moodMatch * 0.30;
        if (moodMatch > 0.5) {
          reason = `Matches your ${MOOD_DEFINITIONS[effectiveMood].name} mood`;
        }
      } else {
        score += 0.20;
      }

      // Factor 3: Game Quality / Rating (20% weight)
      const ratingNorm = (game.rating || 4.0) / 5.0;
      score += ratingNorm * 0.20;

      // Factor 4: Popularity & Social Proof (10% weight)
      const popularityNorm = Math.min(1.0, (game.totalPlays || 0) / 10000);
      score += popularityNorm * 0.10;

      // Factor 5: Discovery / Diversity Bonus (5% controlled exploration)
      // Gives unplayed, high-potential games a chance to be surfaced
      if (profile && !profile.playedGameIds.has(game.id)) {
        score += 0.08;
      }

      // If user has played this exact game recently, slight penalty to prevent repetitive feed
      if (profile && profile.playedGameIds.has(game.id)) {
        score -= 0.05;
      }

      const matchScore = Math.round(score * 100);

      return {
        ...game,
        matchScore,
        matchReason: reason,
      };
    });

  // Sort by final algorithmic score descending
  scoredGames.sort((a, b) => b.matchScore - a.matchScore);

  return {
    games: scoredGames.slice(0, limit),
    dominantMood: effectiveMood,
  };
}

/**
 * Smart Fallback Recommender for Search (Zero Results Handlers)
 * When a user searches for an uncatalogued game, finds the closest thematic match.
 */
export function getSearchFallbackRecommendations(
  query: string,
  limit = 4
): { recommendations: Game[]; explanation: string } {
  const allPublished = gvDb.getGames({ status: 'PUBLISHED' });
  const cleanTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  // Score candidate games by partial token overlap
  const candidates = allPublished.map((g) => {
    let matchCount = 0;
    const corpus = `${g.title} ${g.shortDescription} ${g.categoryName} ${g.engine}`.toLowerCase();
    for (const token of cleanTokens) {
      if (corpus.includes(token)) matchCount += 2;
    }
    // Popularity tie-breaker
    const totalScore = matchCount * 10 + (g.rating || 4) + Math.min(5, g.totalPlays / 2000);
    return { game: g, score: totalScore };
  });

  candidates.sort((a, b) => b.score - a.score);

  const topGames = candidates.slice(0, limit).map((c) => c.game);

  return {
    recommendations: topGames.length > 0 ? topGames : allPublished.slice(0, limit),
    explanation:
      topGames.length > 0
        ? `We curated these top alternative titles matching your gaming search intent.`
        : `Check out these trending platform favorites played by thousands of gamers today.`,
  };
}
