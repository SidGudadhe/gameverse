import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';
import { GET as getDeveloperGamesRoute } from '../src/app/api/developer/games/route';
import { GET as getDeveloperPayoutsRoute } from '../src/app/api/developer/payouts/route';
import { GET as getAccountDeleteRoute, POST as postAccountDeleteRoute } from '../src/app/api/developer/account/delete/route';
import { POST as googleAuthRoute } from '../src/app/api/auth/google/route';

describe('Developer Portal 100x Rebuild Suite', () => {
  const testDevId = 'usr-dev-rebuild-test';
  let devAuthHeader = '';

  beforeAll(async () => {
    // Seed or get developer
    let user = gvDb.findUserById(testDevId);
    if (!user) {
      user = gvDb.createUser({
        id: testDevId,
        email: 'developer.test@gameverse.studio',
        name: 'Hyperion Game Studio',
        role: 'DEVELOPER',
        emailVerified: true,
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    devAuthHeader = `Bearer ${token}`;
  });

  // 1. Google OAuth with Developer Portal Context
  it('1. should register/authenticate developer role via Google SSO when portal=DEVELOPER', async () => {
    const devGoogleEmail = `dev.google.${Date.now()}@gamestudio.io`;
    const req = new NextRequest('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: devGoogleEmail,
        name: 'Apex Studio Dev',
        portal: 'DEVELOPER',
      }),
    });

    const res = await googleAuthRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('DEVELOPER');
    expect(data.token).toBeDefined();
  });

  // 2. Developer Games API Returns Separate Metrics & Direct Links
  it('2. should return per-game playtime, earnings, performance, and direct playable links', async () => {
    const req = new NextRequest('http://localhost:3000/api/developer/games', {
      headers: { Authorization: devAuthHeader },
    });

    const res = await getDeveloperGamesRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.games)).toBe(true);

    if (data.games.length > 0) {
      const g = data.games[0];
      expect(g.playtimeHours).toBeDefined();
      expect(g.earnings).toBeDefined();
      expect(g.performanceTier).toBeDefined();
      expect(g.directPath).toContain('/game/');
      expect(g.directFullUrl).toContain('/game/');
    }
  });

  // 3. Developer Payouts API Returns Timeframe-Filtered Revenue (Day, Month, Year, Total)
  it('3. should return timeframe-filtered revenue for day, month, and year', async () => {
    const req = new NextRequest('http://localhost:3000/api/developer/payouts', {
      headers: { Authorization: devAuthHeader },
    });

    const res = await getDeveloperPayoutsRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.timeframeRevenue).toBeDefined();
    expect(typeof data.timeframeRevenue.day).toBe('number');
    expect(typeof data.timeframeRevenue.month).toBe('number');
    expect(typeof data.timeframeRevenue.year).toBe('number');
    expect(typeof data.timeframeRevenue.total).toBe('number');
    expect(data.summary).toBeDefined();
    expect(data.summary.availableBalance).toBeDefined();
  });

  // 4. Developer Account Deletion 30-Day Grace Period Flow
  it('4. should schedule account deletion for 30 days and allow cancellation', async () => {
    // A. Request account deletion
    const reqDelete = new NextRequest('http://localhost:3000/api/developer/account/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: devAuthHeader,
      },
      body: JSON.stringify({ action: 'REQUEST_DELETION' }),
    });

    const resDelete = await postAccountDeleteRoute(reqDelete);
    const dataDelete = await resDelete.json();

    expect(resDelete.status).toBe(200);
    expect(dataDelete.success).toBe(true);
    expect(dataDelete.isDeletionScheduled).toBe(true);
    expect(dataDelete.daysRemaining).toBe(30);
    expect(dataDelete.scheduledDeletionAt).toBeDefined();

    // Verify GET status
    const reqGet = new NextRequest('http://localhost:3000/api/developer/account/delete', {
      headers: { Authorization: devAuthHeader },
    });
    const resGet = await getAccountDeleteRoute(reqGet);
    const dataGet = await resGet.json();

    expect(dataGet.isDeletionScheduled).toBe(true);
    expect(dataGet.daysRemaining).toBeGreaterThanOrEqual(29);

    // B. Cancel account deletion
    const reqCancel = new NextRequest('http://localhost:3000/api/developer/account/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: devAuthHeader,
      },
      body: JSON.stringify({ action: 'CANCEL_DELETION' }),
    });

    const resCancel = await postAccountDeleteRoute(reqCancel);
    const dataCancel = await resCancel.json();

    expect(resCancel.status).toBe(200);
    expect(dataCancel.isDeletionScheduled).toBe(false);
    expect(dataCancel.daysRemaining).toBe(0);
  });

  // 5. Strict Role Isolation: Block Unauthenticated & Non-Developer access to protected endpoints
  it('5. should strictly reject unauthenticated requests to protected developer endpoints', async () => {
    const unauthReq = new NextRequest('http://localhost:3000/api/developer/games');
    const res = await getDeveloperGamesRoute(unauthReq);

    expect(res.status).toBe(401);
  });
});
