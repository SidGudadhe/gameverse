import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginRoute } from '../src/app/api/auth/login/route';
import { GET as meRoute } from '../src/app/api/auth/me/route';
import { GET as favoritesRoute } from '../src/app/api/player/favorites/route';
import { GET as historyRoute } from '../src/app/api/player/history/route';
import { GET as payoutsRoute } from '../src/app/api/player/payouts/route';
import { gvDb } from '../src/lib/database';
import { hashPassword } from '../src/lib/auth';

describe('Instant Player Authentication & Session Verification', () => {
  const testPassword = 'Password123!';
  const playerEmail = 'player_instant_test@gamer.com';

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);
    gvDb.createUser({
      email: playerEmail,
      name: 'InstantGamer',
      passwordHash,
      role: 'PLAYER',
      emailVerified: true,
    });
  });

  it('1. should authenticate player and return instant session with HTTP-only cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: playerEmail,
        password: testPassword,
        portal: 'PLAYER',
      }),
    });

    const res = await loginRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(playerEmail);
    expect(data.user.role).toBe('PLAYER');
    expect(data.token).toBeDefined();

    // Check Set-Cookie header contains session
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('gameverse_session');
  });

  it('2. should handle email with mixed case and leading/trailing whitespace without error', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `   ${playerEmail.toUpperCase()}   `,
        password: testPassword,
        portal: 'PLAYER',
      }),
    });

    const res = await loginRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.email).toBe(playerEmail);
  });

  it('3. should reset rate limit on successful authentication so repeated valid logins are never blocked', async () => {
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: playerEmail,
          password: testPassword,
          portal: 'PLAYER',
        }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(200);
    }
  });

  it('4. should return no-store Cache-Control on /api/auth/me to prevent browser caching of auth states', async () => {
    // A. Unauthenticated check
    const unauthReq = new NextRequest('http://localhost:3000/api/auth/me');
    const unauthRes = await meRoute(unauthReq);
    expect(unauthRes.status).toBe(401);
    expect(unauthRes.headers.get('cache-control')).toContain('no-store');

    // B. Authenticated check with session cookie
    const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: playerEmail,
        password: testPassword,
        portal: 'PLAYER',
      }),
    });
    const loginRes = await loginRoute(loginReq);
    const loginData = await loginRes.json();
    const token = loginData.token;

    const authReq = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: {
        cookie: `gameverse_session=${token}`,
      },
    });
    const authRes = await meRoute(authReq);
    const authData = await authRes.json();

    expect(authRes.status).toBe(200);
    expect(authData.success).toBe(true);
    expect(authData.user.email).toBe(playerEmail);
    expect(authRes.headers.get('cache-control')).toContain('no-store');
  });

  it('5. should authenticate player on protected gamer APIs immediately with session token', async () => {
    const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: playerEmail,
        password: testPassword,
        portal: 'PLAYER',
      }),
    });
    const loginRes = await loginRoute(loginReq);
    const { token } = await loginRes.json();

    const cookieHeader = { cookie: `gameverse_session=${token}` };

    // Favorites
    const favReq = new NextRequest('http://localhost:3000/api/player/favorites', { headers: cookieHeader });
    const favRes = await favoritesRoute(favReq);
    expect(favRes.status).toBe(200);

    // History
    const histReq = new NextRequest('http://localhost:3000/api/player/history', { headers: cookieHeader });
    const histRes = await historyRoute(histReq);
    expect(histRes.status).toBe(200);

    // Payouts
    const payReq = new NextRequest('http://localhost:3000/api/player/payouts', { headers: cookieHeader });
    const payRes = await payoutsRoute(payReq);
    expect(payRes.status).toBe(200);
  });

  it('6. should reject unauthenticated requests to /api/player/payouts with 401', async () => {
    const unauthPayReq = new NextRequest('http://localhost:3000/api/player/payouts');
    const res = await payoutsRoute(unauthPayReq);
    expect(res.status).toBe(401);
  });
});
