import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getFavorites, POST as addFavorite } from '../src/app/api/player/favorites/route';
import { DELETE as removeFavorite } from '../src/app/api/player/favorites/[gameId]/route';
import { GET as getHistory } from '../src/app/api/player/history/route';
import { GET as getProfile, PUT as updateProfile } from '../src/app/api/player/profile/route';
import { GET as getPayouts, POST as requestPayout } from '../src/app/api/player/payouts/route';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';
import { UserRole } from '../src/types';

describe('Player Portal Routes & Integration Tests', () => {
  const TEST_USER = {
    userId: 'usr_player_portal_test',
    email: 'playerportal@gameverse.test',
    name: 'PortalPlayer',
    role: 'PLAYER' as UserRole,
  };

  let token: string;

  beforeEach(() => {
    // Ensure clean state for test user
    const existing = gvDb.findUserById(TEST_USER.userId);
    if (!existing) {
      gvDb.createUser({
        id: TEST_USER.userId,
        email: TEST_USER.email,
        name: TEST_USER.name,
        passwordHash: 'hashed_pw',
        role: 'PLAYER' as UserRole,
        createdAt: new Date().toISOString(),
      });
    }

    token = generateToken({
      userId: TEST_USER.userId,
      email: TEST_USER.email,
      name: TEST_USER.name,
      role: TEST_USER.role,
    });
  });

  it('1. GET /api/player/favorites should require authentication or return 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/favorites');
    const res = await getFavorites(req);
    expect(res.status).toBe(401);
  });

  it('2. POST & GET /api/player/favorites should add and list favorite games', async () => {
    const game = gvDb.getGames()[0];
    expect(game).toBeDefined();

    // Add to favorites
    const postReq = new NextRequest('http://localhost:3000/api/player/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ gameId: game.id }),
    });

    const postRes = await addFavorite(postReq);
    expect(postRes.status).toBe(200);

    // List favorites
    const getReq = new NextRequest('http://localhost:3000/api/player/favorites', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getRes = await getFavorites(getReq);
    expect(getRes.status).toBe(200);
    const data = await getRes.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.games)).toBe(true);
    expect(data.games.some((g: any) => g.id === game.id)).toBe(true);
  });

  it('3. DELETE /api/player/favorites/[gameId] should remove the game from favorites', async () => {
    const game = gvDb.getGames()[0];

    const delReq = new NextRequest(`http://localhost:3000/api/player/favorites/${game.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const delRes = await removeFavorite(delReq, { params: { gameId: game.id } });
    expect(delRes.status).toBe(200);

    // Verify it is removed
    const isFav = gvDb.isGameFavorited(TEST_USER.userId, game.id);
    expect(isFav).toBe(false);
  });

  it('4. GET /api/player/history should return play history for authenticated user', async () => {
    const game = gvDb.getGames()[0];
    gvDb.recordPlayHistory(TEST_USER.userId, game.id, 120);

    const req = new NextRequest('http://localhost:3000/api/player/history', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await getHistory(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.history)).toBe(true);
    expect(data.history.length).toBeGreaterThan(0);
  });

  it('5. GET /api/player/profile should return user profile and statistics', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await getProfile(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.profile).toBeDefined();
    expect(data.stats).toBeDefined();
    expect(typeof data.stats.favoritesCount).toBe('number');
    expect(typeof data.stats.gamesPlayedCount).toBe('number');
  });

  it('6. PUT /api/player/profile should update display name, bio, and favorite genre', async () => {
    const putReq = new NextRequest('http://localhost:3000/api/player/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayName: 'Elite Champion',
        bio: 'Competitive speedrunner and arcade fan',
        favoriteGenre: 'Racing',
      }),
    });

    const putRes = await updateProfile(putReq);
    expect(putRes.status).toBe(200);
    const data = await putRes.json();
    expect(data.success).toBe(true);
    expect(data.profile.displayName).toBe('Elite Champion');
    expect(data.profile.bio).toBe('Competitive speedrunner and arcade fan');
    expect(data.profile.favoriteGenre).toBe('Racing');
  });

  it('7. GET /api/player/payouts should require authentication or return 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/payouts');
    const res = await getPayouts(req);
    expect(res.status).toBe(401);
  });

  it('8. GET /api/player/payouts should return player stats and requests for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/payouts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await getPayouts(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.stats).toBeDefined();
    expect(data.stats.eligible).toBe(true);
    expect(Array.isArray(data.requests)).toBe(true);
  });

  it('9. POST /api/player/payouts should validate method and account details', async () => {
    // Missing method
    const badReq1 = new NextRequest('http://localhost:3000/api/player/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ method: 'BITCOIN', accountDetails: 'wallet123' }),
    });
    const res1 = await requestPayout(badReq1);
    expect(res1.status).toBe(400);

    // Missing details
    const badReq2 = new NextRequest('http://localhost:3000/api/player/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ method: 'UPI', accountDetails: ' ' }),
    });
    const res2 = await requestPayout(badReq2);
    expect(res2.status).toBe(400);
  });

  it('10. POST /api/player/payouts should create a pending payout request for valid submission', async () => {
    const postReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        method: 'UPI',
        accountDetails: 'player@upi',
        note: 'Fast IMPS please',
      }),
    });

    const res = await requestPayout(postReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.request).toBeDefined();
    expect(data.request.method).toBe('UPI');
    expect(data.request.accountDetails).toBe('player@upi');
    expect(data.request.status).toBe('PENDING');

    // Verify it appears in user's payout requests
    const userReqs = gvDb.getPlayerPayoutRequests(TEST_USER.userId);
    expect(userReqs.some((r) => r.id === data.request.id)).toBe(true);
  });

  it('11. PUT /api/player/profile should accept and persist custom gallery avatar (data URI)', async () => {
    const sampleBase64Avatar = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
    const putReq = new NextRequest('http://localhost:3000/api/player/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        avatarUrl: sampleBase64Avatar,
      }),
    });

    const putRes = await updateProfile(putReq);
    expect(putRes.status).toBe(200);
    const data = await putRes.json();
    expect(data.success).toBe(true);
    expect(data.profile.avatarUrl).toBe(sampleBase64Avatar);

    // Verify retrieval
    const getReq = new NextRequest('http://localhost:3000/api/player/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getRes = await getProfile(getReq);
    const getData = await getRes.json();
    expect(getData.profile.avatarUrl).toBe(sampleBase64Avatar);
  });
});
