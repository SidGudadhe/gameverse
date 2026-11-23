import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import {
  computePlayerAffinity,
  getGameMoodAffinity,
  getPersonalizedRecommendations,
  getSearchFallbackRecommendations,
  getTopMoodsByUserAffinity,
  getSortedCategoriesByAffinity,
  MOOD_DEFINITIONS,
  GameMood,
} from '../src/lib/recommendations';
import { GET as getRecommendationsRoute } from '../src/app/api/recommendations/route';
import { GET as getCategoriesRoute } from '../src/app/api/categories/route';
import { POST as pingRoute } from '../src/app/api/analytics/ping/route';
import { generateToken } from '../src/lib/auth';

describe('Adaptive Recommendation Engine & Smart Search Fallback', () => {
  const testUserId = 'usr-recom-test-01';
  let sampleGames: any[] = [];

  beforeAll(() => {
    sampleGames = gvDb.getGames({ status: 'PUBLISHED' });
    expect(sampleGames.length).toBeGreaterThan(0);
  });

  // 1. Mood Definitions Verification
  it('1. should define all 5 core mood dimensions with colors and categories', () => {
    const moods: GameMood[] = ['ALL', 'ADRENALINE', 'EXPLORATION', 'RELAX_PUZZLE', 'RETRO_NOSTALGIA'];
    for (const mood of moods) {
      expect(MOOD_DEFINITIONS[mood]).toBeDefined();
      expect(MOOD_DEFINITIONS[mood].id).toBe(mood);
      expect(MOOD_DEFINITIONS[mood].name).toBeTruthy();
      expect(MOOD_DEFINITIONS[mood].tagline).toBeTruthy();
      expect(MOOD_DEFINITIONS[mood].icon).toBeTruthy();
    }
    expect(MOOD_DEFINITIONS.ADRENALINE.relevantCategories).toContain('cat-arcade');
    expect(MOOD_DEFINITIONS.EXPLORATION.relevantCategories).toContain('cat-rpg');
    expect(MOOD_DEFINITIONS.RELAX_PUZZLE.relevantCategories).toContain('cat-puzzle');
  });

  // 2. Behavioral Affinity Profiling (Cold Start vs Active)
  it('2. should handle cold-start profile for brand new players gracefully', () => {
    const coldUserId = 'usr-cold-start-999';
    const profile = computePlayerAffinity(coldUserId);

    expect(profile.userId).toBe(coldUserId);
    expect(profile.totalPlayMinutes).toBe(0);
    expect(profile.interactionCount).toBe(0);
    expect(profile.dominantMood).toBe('ALL');
    expect(Object.keys(profile.categoryWeights).length).toBe(0);
  });

  // 3. Playtime, Favorites & Rating Affinity Weighting
  it('3. should dynamically calculate category affinity based on play history, favorites and reviews', () => {
    const arcadeGame = sampleGames.find((g) => g.categoryId === 'cat-arcade') || sampleGames[0];
    const puzzleGame = sampleGames.find((g) => g.categoryId === 'cat-puzzle') || sampleGames[1];

    // Simulate 15 minutes of gameplay on the arcade game
    gvDb.recordPlayHistory(testUserId, arcadeGame.id, 900); // 900 sec = 15 min

    // Add puzzle game to favorites
    gvDb.addFavorite(testUserId, puzzleGame.id);

    const profile = computePlayerAffinity(testUserId);
    expect(profile.totalPlayMinutes).toBeGreaterThanOrEqual(15);
    expect(profile.playedGameIds.has(arcadeGame.id)).toBe(true);

    // Arcade category should have affinity from playtime
    expect(profile.categoryWeights[arcadeGame.categoryId]).toBeGreaterThan(0);

    // Puzzle category should have affinity from favorite (+8)
    expect(profile.categoryWeights[puzzleGame.categoryId]).toBeGreaterThanOrEqual(8);
  });

  // 4. Game-Mood Affinity Scoring
  it('4. should compute mood affinity matching relevant categories and keywords', () => {
    const arcadeGame = sampleGames.find((g) => g.categoryId === 'cat-arcade') || sampleGames[0];

    // ALL should always return 1.0
    expect(getGameMoodAffinity(arcadeGame, 'ALL')).toBe(1.0);

    // Arcade game should score high on ADRENALINE mood
    const adrenalineScore = getGameMoodAffinity(arcadeGame, 'ADRENALINE');
    expect(adrenalineScore).toBeGreaterThanOrEqual(0.6);
  });

  // 5. Multi-Signal Personalized Feed Ranking
  it('5. should rank published games and provide human-readable match reasons', () => {
    const result = getPersonalizedRecommendations({
      userId: testUserId,
      mood: 'ALL',
      limit: 6,
    });

    expect(result.games.length).toBeLessThanOrEqual(6);
    expect(result.games.length).toBeGreaterThan(0);

    for (const game of result.games) {
      expect(game.matchScore).toBeGreaterThanOrEqual(0);
      expect(game.matchScore).toBeLessThanOrEqual(100);
      expect(game.matchReason).toBeTruthy();
    }

    // Must be sorted in descending order of matchScore
    for (let i = 0; i < result.games.length - 1; i++) {
      expect(result.games[i].matchScore).toBeGreaterThanOrEqual(result.games[i + 1].matchScore);
    }
  });

  // 6. Exclusion parameter for "Similar Games" component
  it('6. should exclude the currently active game when excludeGameId is provided', () => {
    const activeGame = sampleGames[0];
    const result = getPersonalizedRecommendations({
      excludeGameId: activeGame.id,
      limit: 10,
    });

    const found = result.games.some((g) => g.id === activeGame.id);
    expect(found).toBe(false);
  });

  // 7. Search Fallback Recommender for Zero-Match queries (e.g. "GTA", "Minecraft")
  it('7. should provide warm fallback recommendations for non-existent game queries', () => {
    const fallback = getSearchFallbackRecommendations('Grand Theft Auto Vice City', 4);

    expect(fallback.recommendations.length).toBeGreaterThan(0);
    expect(fallback.recommendations.length).toBeLessThanOrEqual(4);
    expect(fallback.explanation).toBeTruthy();
  });

  // 8. API Endpoint GET /api/recommendations (Personalized & Mood-filtered)
  it('8. should return HTTP 200 with personalized feed and mood metadata from API', async () => {
    const req = new NextRequest('http://localhost:3000/api/recommendations?mood=ADRENALINE&limit=4');
    const res = await getRecommendationsRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.type).toBe('PERSONALIZED');
    expect(data.mood).toBe('ADRENALINE');
    expect(data.moodMetadata.name).toBe('Adrenaline Rush');
    expect(data.recommendations.length).toBeLessThanOrEqual(4);
  });

  it('8b. should strictly isolate recommendations by mainCategory=VEG via API', async () => {
    const req = new NextRequest('http://localhost:3000/api/recommendations?mainCategory=VEG&limit=8');
    const res = await getRecommendationsRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.mainCategory).toBe('VEG');
    expect(data.recommendations.length).toBeGreaterThan(0);
    for (const game of data.recommendations) {
      expect(game.mainCategory || 'VEG').toBe('VEG');
    }
  });

  it('8c. should strictly isolate recommendations by mainCategory=NON_VEG via API', async () => {
    const req = new NextRequest('http://localhost:3000/api/recommendations?mainCategory=NON_VEG&limit=8');
    const res = await getRecommendationsRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.mainCategory).toBe('NON_VEG');
    expect(data.recommendations.length).toBeGreaterThan(0);
    for (const game of data.recommendations) {
      expect(game.mainCategory).toBe('NON_VEG');
    }
  });

  // 9. API Endpoint GET /api/recommendations with query parameter (Search Fallback)
  it('9. should return HTTP 200 with fallback recommendations when query is passed', async () => {
    const req = new NextRequest('http://localhost:3000/api/recommendations?query=Need+For+Speed');
    const res = await getRecommendationsRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.type).toBe('SEARCH_FALLBACK');
    expect(data.query).toBe('Need For Speed');
    expect(data.recommendations.length).toBeGreaterThan(0);
  });

  // 10. Analytics Ping Updates Real-time Play History
  it('10. should automatically record play history when player sends active heartbeat ping', async () => {
    const targetGame = sampleGames[0];
    const pingPlayerId = 'usr-ping-recom-test';
    const sessionToken = `test-ping-sess-${Date.now()}`;

    // 1. Initial Session Start
    const startReq = new NextRequest('http://localhost:3000/api/analytics/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({
        gameId: targetGame.id,
        sessionToken,
        eventType: 'SESSION_START',
        playerId: pingPlayerId,
        activeSeconds: 0,
      }),
    });
    const startRes = await pingRoute(startReq);
    expect(startRes.status).toBe(200);

    // 2. Heartbeat with 45 active seconds
    const hbReq = new NextRequest('http://localhost:3000/api/analytics/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({
        gameId: targetGame.id,
        sessionToken,
        eventType: 'HEARTBEAT',
        playerId: pingPlayerId,
        activeSeconds: 45,
      }),
    });
    const hbRes = await pingRoute(hbReq);
    expect(hbRes.status).toBe(200);

    // 3. Verify user's play history was updated
    const history = gvDb.getPlayHistory(pingPlayerId);
    const entry = history.find((h) => h.gameId === targetGame.id);
    expect(entry).toBeDefined();
    expect(entry?.totalPlayMinutes).toBeGreaterThanOrEqual(0.5); // 45s rounds to ~0.75m
  });

  // 11. In-Game Similar Games Suggestions Ordering & Category Mapping
  it('11. should generate relevant mood and recommendations for in-game half-screen suggestions', () => {
    const arcadeGame = sampleGames.find((g) => g.categoryId === 'cat-arcade') || sampleGames[0];
    
    // Recommendations for playing game: must exclude active game, limit to 4
    const inGameRecs = getPersonalizedRecommendations({
      mood: 'ADRENALINE',
      excludeGameId: arcadeGame.id,
      limit: 4,
    });

    expect(inGameRecs.games.length).toBeGreaterThan(0);
    expect(inGameRecs.games.length).toBeLessThanOrEqual(4);
    // Ensure the game itself is never recommended to itself
    expect(inGameRecs.games.some((g) => g.id === arcadeGame.id)).toBe(false);
  });

  // 12. User Attraction / Category Affinity Ordering for Recommended Moods
  it('12. should place the user highest attraction mood first right after ALL in mood buttons', () => {
    const affinityUser = 'usr-affinity-order-test';
    const rpgGame = sampleGames.find((g) => g.categoryId === 'cat-rpg');
    if (rpgGame) {
      // Simulate heavy playtime in RPG (Exploration)
      gvDb.recordPlayHistory(affinityUser, rpgGame.id, 1800); // 30 min
      gvDb.addFavorite(affinityUser, rpgGame.id);

      const topMoods = getTopMoodsByUserAffinity(affinityUser);
      expect(topMoods[0].mood).toBe('ALL'); // ALL is always pinned first
      // Second mood must be EXPLORATION because RPG has highest affinity points
      expect(topMoods[1].mood).toBe('EXPLORATION');
      expect(topMoods[1].affinityScore).toBeGreaterThan(0);
    }
  });

  // 13. Category Nav Sorting by Attraction / User Affinity
  it('13. should rank user most played / preferred category first in category lists', () => {
    const affinityUser = 'usr-cat-order-test';
    const puzzleGame = sampleGames.find((g) => g.categoryId === 'cat-puzzle');
    if (puzzleGame) {
      gvDb.recordPlayHistory(affinityUser, puzzleGame.id, 2400); // 40 min
      gvDb.addFavorite(affinityUser, puzzleGame.id);

      const rawCategories = gvDb.getCategories();
      const sorted = getSortedCategoriesByAffinity(rawCategories, affinityUser);

      // The puzzle category should be at the very top of categories
      expect(sorted[0].id).toBe('cat-puzzle');
      expect(sorted[0].affinityScore).toBeGreaterThan(0);
    }
  });

  // 14. API returns affinity-sorted moods and categories
  it('14. should return affinity-sorted topMoods and sortedCategories in /api/recommendations', async () => {
    const token = generateToken({ userId: testUserId, role: 'PLAYER', email: 'test@gameverse.io', name: 'Test Gamer' });
    const req = new NextRequest('http://localhost:3000/api/recommendations', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await getRecommendationsRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.topMoods).toBeDefined();
    expect(data.topMoods[0].mood).toBe('ALL');
    expect(data.sortedCategories).toBeDefined();
    expect(Array.isArray(data.sortedCategories)).toBe(true);
  });

  // 15. /api/categories returns affinity-sorted list for logged-in user
  it('15. should return affinity-sorted categories in /api/categories for authenticated user', async () => {
    const affinityUser = 'usr-cat-api-test';
    const arcadeGame = sampleGames.find((g) => g.categoryId === 'cat-arcade');
    if (arcadeGame) {
      gvDb.recordPlayHistory(affinityUser, arcadeGame.id, 3000);
    }

    const token = generateToken({ userId: affinityUser, role: 'PLAYER', email: 'cat@gameverse.io', name: 'Cat Gamer' });
    const req = new NextRequest('http://localhost:3000/api/categories', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await getCategoriesRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.categories[0].id).toBe('cat-arcade');
    expect(data.categories[0].affinityScore).toBeGreaterThan(0);
  });
});
