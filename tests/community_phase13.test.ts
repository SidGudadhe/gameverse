import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';
import { validateUsername, moderateReviewContent, checkPlayerVerification } from '../src/lib/community';
import { GET as getPlayerProfile, PUT as updatePlayerProfile } from '../src/app/api/player/profile/route';
import { GET as getFavorites, POST as addFavorite } from '../src/app/api/player/favorites/route';
import { DELETE as removeFavorite, GET as checkFavorite } from '../src/app/api/player/favorites/[gameId]/route';
import { GET as getHistory, POST as recordHistory } from '../src/app/api/player/history/route';
import { GET as getReviews, POST as createReview } from '../src/app/api/games/[slug]/reviews/route';
import { POST as voteHelpful } from '../src/app/api/games/[slug]/reviews/[reviewId]/helpful/route';

describe('Phase 13: Player Community, Profiles & Social', () => {
  let playerId: string;
  let otherPlayerId: string;
  let playerAuthHeader: string;
  let otherAuthHeader: string;
  let gameId: string;
  let gameSlug: string;

  beforeEach(() => {
    playerId = `usr-player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    otherPlayerId = `usr-other-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    gameId = `game-p13-${Date.now()}`;
    gameSlug = `neon-drift-${Date.now()}`;

    const token = generateToken({
      userId: playerId,
      email: 'player@community.com',
      role: 'PLAYER',
    });
    playerAuthHeader = `Bearer ${token}`;

    const otherToken = generateToken({
      userId: otherPlayerId,
      email: 'other@community.com',
      role: 'PLAYER',
    });
    otherAuthHeader = `Bearer ${otherToken}`;

    // Seed published game
    gvDb.createGame({
      id: gameId,
      developerId: 'usr-dev-1',
      developerName: 'Neon Games',
      categoryId: 'cat-arcade',
      categoryName: 'Arcade',
      slug: gameSlug,
      title: 'Neon Drift 2088',
      shortDescription: 'Community racing test title.',
      status: 'PUBLISHED',
      totalPlays: 100,
      rating: 4.5,
    });
  });

  it('1. Validates custom player handles and enforces format and uniqueness rules', () => {
    // Valid usernames
    expect(validateUsername('cyber_ninja').valid).toBe(true);
    expect(validateUsername('player123').valid).toBe(true);
    expect(validateUsername('@gamer_pro').valid).toBe(true);

    // Invalid length (<3 or >20)
    expect(validateUsername('ab').valid).toBe(false);
    expect(validateUsername('a'.repeat(21)).valid).toBe(false);

    // Invalid characters (spaces, special chars)
    expect(validateUsername('cool gamer').valid).toBe(false);
    expect(validateUsername('user!name').valid).toBe(false);
    expect(validateUsername('hacker$').valid).toBe(false);

    // Reserved usernames
    expect(validateUsername('admin').valid).toBe(false);
    expect(validateUsername('gameverse').valid).toBe(false);
    expect(validateUsername('system').valid).toBe(false);

    // Uniqueness checks
    const uniqueHandle = `pilot_${Date.now().toString(36)}`;
    expect(gvDb.isUsernameAvailable(uniqueHandle)).toBe(true);

    // Save profile with this username
    gvDb.updateProfile(playerId, { username: uniqueHandle, displayName: 'Test Pilot' });
    expect(gvDb.isUsernameAvailable(uniqueHandle)).toBe(false);
    // Should be available if excluding the same user
    expect(gvDb.isUsernameAvailable(uniqueHandle, playerId)).toBe(true);
  });

  it('2. Synchronizes Cloud Favorites (Add, Query, Check, and Remove)', async () => {
    // 1. Add favorite via POST
    const addReq = new NextRequest('http://localhost:3000/api/player/favorites', {
      method: 'POST',
      headers: {
        authorization: playerAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId }),
    });
    const addRes = await addFavorite(addReq);
    expect(addRes.status).toBe(200);
    const addData = await addRes.json();
    expect(addData.success).toBe(true);
    expect(addData.favorited).toBe(true);

    // 2. Check isFavorited via GET /api/player/favorites/[gameId]
    const checkReq = new NextRequest(`http://localhost:3000/api/player/favorites/${gameId}`, {
      headers: { authorization: playerAuthHeader },
    });
    const checkRes = await checkFavorite(checkReq, { params: { gameId } });
    expect(checkRes.status).toBe(200);
    const checkData = await checkRes.json();
    expect(checkData.isFavorited).toBe(true);

    // 3. Query all favorites via GET /api/player/favorites
    const listReq = new NextRequest('http://localhost:3000/api/player/favorites', {
      headers: { authorization: playerAuthHeader },
    });
    const listRes = await getFavorites(listReq);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.count).toBe(1);
    expect(listData.games[0].id).toBe(gameId);

    // 4. Remove favorite via DELETE /api/player/favorites/[gameId]
    const delReq = new NextRequest(`http://localhost:3000/api/player/favorites/${gameId}`, {
      method: 'DELETE',
      headers: { authorization: playerAuthHeader },
    });
    const delRes = await removeFavorite(delReq, { params: { gameId } });
    expect(delRes.status).toBe(200);
    const delData = await delRes.json();
    expect(delData.favorited).toBe(false);

    expect(gvDb.isGameFavorited(playerId, gameId)).toBe(false);
  });

  it('3. Tracks player history and aggregates recent gameplay correctly', async () => {
    // Record history via POST /api/player/history
    const histReq = new NextRequest('http://localhost:3000/api/player/history', {
      method: 'POST',
      headers: {
        authorization: playerAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId, playSeconds: 120 }),
    });
    const histRes = await recordHistory(histReq);
    expect(histRes.status).toBe(200);
    const histData = await histRes.json();
    expect(histData.success).toBe(true);
    expect(histData.historyItem.gameId).toBe(gameId);
    expect(histData.historyItem.totalPlayMinutes).toBe(2.0);

    // Fetch history via GET /api/player/history
    const getHistReq = new NextRequest('http://localhost:3000/api/player/history', {
      headers: { authorization: playerAuthHeader },
    });
    const getHistRes = await getHistory(getHistReq);
    expect(getHistRes.status).toBe(200);
    const getHistData = await getHistRes.json();
    expect(getHistData.count).toBe(1);
    expect(getHistData.history[0].game.title).toBe('Neon Drift 2088');
  });

  it('4. Gating Verified Player status (Requires >= 60 seconds active gameplay)', () => {
    const unverifiedGameId = `game-unverified-${Date.now()}`;
    // Zero playtime
    expect(checkPlayerVerification(playerId, unverifiedGameId)).toBe(false);

    // Playtime 45s (below 60s threshold)
    gvDb.recordPlayHistory(playerId, unverifiedGameId, 45);
    expect(checkPlayerVerification(playerId, unverifiedGameId)).toBe(false);

    // Add additional playtime reaching 75s (qualifies as verified)
    gvDb.recordPlayHistory(playerId, unverifiedGameId, 30);
    expect(checkPlayerVerification(playerId, unverifiedGameId)).toBe(true);
  });

  it('5. Submits game reviews, validates content, and syncs aggregate ratings', async () => {
    // Give player 90 seconds playtime on gameId to qualify for Verified Player badge
    gvDb.recordPlayHistory(playerId, gameId, 90);

    const reviewReq = new NextRequest(`http://localhost:3000/api/games/${gameSlug}/reviews`, {
      method: 'POST',
      headers: {
        authorization: playerAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Incredible cyberpunk arcade mechanics! Smooth 60fps controls and great soundtrack.',
      }),
    });

    const res = await createReview(reviewReq, { params: { slug: gameSlug } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.review.rating).toBe(5);
    expect(data.review.isVerifiedPlayer).toBe(true);
    expect(data.aggregateRating).toBe(5);

    // Submit second review from another player with 3 stars
    const review2Req = new NextRequest(`http://localhost:3000/api/games/${gameSlug}/reviews`, {
      method: 'POST',
      headers: {
        authorization: otherAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rating: 3,
        comment: 'Decent controls, but difficulty ramps up too quickly on stage 3.',
      }),
    });
    const res2 = await createReview(review2Req, { params: { slug: gameSlug } });
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.aggregateRating).toBe(4.0); // (5 + 3) / 2 = 4.0
    expect(data2.totalReviews).toBe(2);

    // Verify GET /api/games/[slug]/reviews returns both reviews and breakdown
    const getReviewsReq = new NextRequest(`http://localhost:3000/api/games/${gameSlug}/reviews`);
    const getRes = await getReviews(getReviewsReq, { params: { slug: gameSlug } });
    expect(getRes.status).toBe(200);
    const reviewsData = await getRes.json();
    expect(reviewsData.totalReviews).toBe(2);
    expect(reviewsData.breakdown[5]).toBe(1);
    expect(reviewsData.breakdown[3]).toBe(1);
  });

  it('6. Moderates review commentary and rejects offensive or spam content', async () => {
    // Too short (< 5 chars)
    expect(moderateReviewContent('good').approved).toBe(false);

    // Prohibited language
    expect(moderateReviewContent('This game is fucking trash scam').approved).toBe(false);

    // Repetitive text spam
    expect(moderateReviewContent('loooooooooooool').approved).toBe(false);

    // Constructive feedback passes
    expect(moderateReviewContent('Fantastic level design and responsive keyboard input.').approved).toBe(true);
  });

  it('7. Handles helpful review upvotes and prevents duplicate voting', async () => {
    // Create initial review
    const review = gvDb.createReview({
      gameId,
      userId: playerId,
      username: 'speedster',
      displayName: 'Speed Demon',
      rating: 5,
      comment: 'Top tier browser racer! Worth every second.',
      isVerifiedPlayer: true,
    });

    expect(review.helpfulCount).toBe(0);

    // Other player upvotes review
    const voteReq = new NextRequest(
      `http://localhost:3000/api/games/${gameSlug}/reviews/${review.id}/helpful`,
      {
        method: 'POST',
        headers: { authorization: otherAuthHeader },
      }
    );
    const voteRes = await voteHelpful(voteReq, { params: { slug: gameSlug, reviewId: review.id } });
    expect(voteRes.status).toBe(200);
    const voteData = await voteRes.json();
    expect(voteData.helpfulCount).toBe(1);

    // Duplicate vote from same player should be rejected
    const dupRes = await voteHelpful(voteReq, { params: { slug: gameSlug, reviewId: review.id } });
    expect(dupRes.status).toBe(400);
    const dupData = await dupRes.json();
    expect(dupData.error).toContain('already voted');
  });

  it('8. Retrieves public player profiles and updates profile settings via API', async () => {
    const handle = `gamer_${Date.now().toString(36)}`;

    // Update profile via PUT /api/player/profile
    const updateReq = new NextRequest('http://localhost:3000/api/player/profile', {
      method: 'PUT',
      headers: {
        authorization: playerAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: handle,
        displayName: 'Neon Knight',
        bio: 'Retro gaming enthusiast and high-score chaser.',
        favoriteGenre: 'Arcade',
      }),
    });
    const updateRes = await updatePlayerProfile(updateReq);
    expect(updateRes.status).toBe(200);
    const updateData = await updateRes.json();
    expect(updateData.profile.username).toBe(handle);
    expect(updateData.profile.displayName).toBe('Neon Knight');

    // Public lookup via GET /api/player/profile?username=...
    const publicReq = new NextRequest(`http://localhost:3000/api/player/profile?username=${handle}`);
    const publicRes = await getPlayerProfile(publicReq);
    expect(publicRes.status).toBe(200);
    const publicData = await publicRes.json();
    expect(publicData.profile.username).toBe(handle);
    expect(publicData.profile.displayName).toBe('Neon Knight');
    expect(publicData.profile.favoriteGenre).toBe('Arcade');
    expect(publicData.stats).toBeDefined();

    // Non-existent username returns 404
    const notFoundReq = new NextRequest('http://localhost:3000/api/player/profile?username=non_existent_player_xyz');
    const notFoundRes = await getPlayerProfile(notFoundReq);
    expect(notFoundRes.status).toBe(404);
  });
});
