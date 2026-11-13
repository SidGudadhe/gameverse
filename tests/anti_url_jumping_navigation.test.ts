import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';
import { generateToken } from '../src/lib/auth';

describe('Anti-URL Jumping & Navigation Integrity Gates', () => {
  const playerToken = generateToken({
    userId: 'usr_nav_player_1',
    email: 'player@gamer.com',
    role: 'PLAYER',
    name: 'Gamer One',
  });

  const devToken = generateToken({
    userId: 'usr_nav_dev_1',
    email: 'creator@studio.com',
    role: 'DEVELOPER',
    name: 'Studio Creator',
  });

  // =========================================================================
  // 1. UNAUTHENTICATED USERS: DIRECT URL JUMPING BLOCKED
  // =========================================================================
  it('1. should block unauthenticated users jumping directly to /player/payouts via address bar URL', () => {
    const req = new NextRequest('http://localhost:3000/player/payouts');
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/auth/login?redirect=%2Fplayer%2Fpayouts');
  });

  it('2. should block unauthenticated users jumping directly to /player/profile via address bar URL', () => {
    const req = new NextRequest('http://localhost:3000/player/profile');
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/auth/login?redirect=%2Fplayer%2Fprofile');
  });

  it('3. should block unauthenticated users jumping directly to /player/favorites via address bar URL', () => {
    const req = new NextRequest('http://localhost:3000/player/favorites');
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/auth/login?redirect=%2Fplayer%2Ffavorites');
  });

  it('4. should block unauthenticated users jumping directly to /player/history via address bar URL', () => {
    const req = new NextRequest('http://localhost:3000/player/history');
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/auth/login?redirect=%2Fplayer%2Fhistory');
  });

  it('5. should block unauthenticated users jumping directly to /player via address bar URL', () => {
    const req = new NextRequest('http://localhost:3000/player');
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/auth/login?redirect=%2Fplayer');
  });

  it('6. should block unauthenticated API calls to player sub-resources with 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/payouts');
    const res = middleware(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized: Gamer authentication required');
  });

  // =========================================================================
  // 2. AUTHENTICATED GAMERS: LEGITIMATE NAVIGATION ALLOWED
  // =========================================================================
  it('7. should allow authenticated player to access /player/payouts and player sub-pages', () => {
    const req = new NextRequest('http://localhost:3000/player/payouts', {
      headers: {
        cookie: `gameverse_session=${playerToken}`,
      },
    });
    const res = middleware(req);

    // Request is allowed through to the page
    expect(res.status).toBe(200);
  });

  // =========================================================================
  // 3. SUSPICIOUS URL MANIPULATION & INJECTION PROTECTION
  // =========================================================================
  it('8. should block suspicious URL script injection with 403 Forbidden', () => {
    const req = new NextRequest('http://localhost:3000/?query=%3Cscript%3Ealert(1)%3C/script%3E');
    const res = middleware(req);

    expect(res.status).toBe(403);
  });

  it('9. should block path traversal manipulation with 403 Forbidden', () => {
    const req = new NextRequest('http://localhost:3000/?file=../../etc/passwd');
    const res = middleware(req);

    expect(res.status).toBe(403);
  });

  // =========================================================================
  // 4. CROSS-PORTAL URL TAMPERING PREVENTION
  // =========================================================================
  it('10. should block players from jumping directly to developer studio sub-pages via URL', () => {
    const req = new NextRequest('http://localhost:3000/developer/games', {
      headers: {
        cookie: `gameverse_session=${playerToken}`,
      },
    });
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    // Redirects player to creator agreement onboarding
    expect(location).toContain('/developer/onboard?notice=agreement_required');
  });

  it('11. should block unauthenticated users from jumping to admin ops sub-pages via URL', () => {
    const req = new NextRequest('http://localhost:3000/admin/queue');
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/admin/auth/login');
  });
});
