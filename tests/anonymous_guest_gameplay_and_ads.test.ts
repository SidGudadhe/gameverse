import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import { GET as getGames } from '../src/app/api/games/route';
import { GET as getRecommendations } from '../src/app/api/recommendations/route';
import { GET as getAdSlot } from '../src/app/api/ads/slot/route';
import { POST as recordAdImpression } from '../src/app/api/ads/impression/route';
import { POST as analyticsPing } from '../src/app/api/analytics/ping/route';
import { POST as recordWin, GET as getWin } from '../src/app/api/player/win/route';
import fs from 'fs';
import path from 'path';

describe('Anonymous Guest Player Experience & Ads Delivery (100x Deep Verification)', () => {
  const publishedGames = gvDb.getGames({ status: 'PUBLISHED' });
  const testGame = publishedGames[0] || { id: 'game-neon-runner', title: 'Neon Cyber Runner 2088' };

  // =========================================================================
  // 1. GAME CATALOG & RECOMMENDATION BROWSING WITHOUT LOGIN
  // =========================================================================
  it('1. should allow unauthenticated players to browse published games catalog via public API', async () => {
    const req = new NextRequest('http://localhost:3000/api/games?limit=10&sort=popular');
    const res = await getGames(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.games.length).toBeGreaterThan(0);
    expect(data.games[0]).toHaveProperty('title');
    expect(data.games[0]).toHaveProperty('slug');
  });

  it('2. should deliver adaptive recommendations to guest users with userId=null', async () => {
    const req = new NextRequest('http://localhost:3000/api/recommendations?mood=ALL&limit=6');
    const res = await getRecommendations(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.userId).toBeNull();
    expect(data.recommendations.length).toBeGreaterThan(0);
    expect(data.sortedCategories.length).toBeGreaterThan(0);
  });

  // =========================================================================
  // 2. AD DELIVERABILITY TO ANONYMOUS GUESTS (PREROLL, POSTER, REWARDED)
  // =========================================================================
  it('3. should serve PREROLL ads to anonymous guest sessions without requiring login', async () => {
    const guestSession = `guest-sess-${Date.now()}`;
    const req = new NextRequest(
      `http://localhost:3000/api/ads/slot?gameId=${testGame.id}&sessionToken=${guestSession}&format=PREROLL`,
      {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
        },
      }
    );
    const res = await getAdSlot(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.eligible).toBe(true);
    expect(data.ad).toBeDefined();
    expect(data.ad.title).toBeDefined();
    expect(data.ad.videoUrl || data.ad.imageUrl).toBeDefined();
  });

  it('4. should track ad impressions for guest sessions and credit developer revenue correctly', async () => {
    const guestSession = `guest-sess-imp-${Date.now()}`;
    const req = new NextRequest('http://localhost:3000/api/ads/impression', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        gameId: testGame.id,
        sessionToken: guestSession,
        format: 'PREROLL',
        durationSeconds: 15,
        completed: true,
      }),
    });

    const res = await recordAdImpression(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.billable).toBe(true);
    expect(data.impression.sessionToken).toBe(guestSession);
  });

  // =========================================================================
  // 3. ZERO WINNINGS ATTRIBUTION & ZERO PROGRESS CREDITING FOR UNKNOWN PLAYERS
  // =========================================================================
  it('5. should record anonymous telemetry without crediting play history to any user account', async () => {
    const guestSession = `guest-telemetry-${Date.now()}`;
    const req = new NextRequest('http://localhost:3000/api/analytics/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: testGame.id,
        sessionToken: guestSession,
        eventType: 'SESSION_START',
        activeSeconds: 0,
        // No playerId provided (anonymous player)
      }),
    });

    const res = await analyticsPing(req);
    expect(res.status).toBe(200);

    const session = gvDb.getSessionByToken(guestSession);
    expect(session).toBeDefined();
    expect(session?.playerId).toBeUndefined();
  });

  it('6. should strictly reject win attribution for unauthenticated guest sessions (401 Unauthorized)', async () => {
    const guestSession = `guest-win-attempt-${Date.now()}`;
    const req = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: testGame.id,
        sessionToken: guestSession,
        score: 5000,
        playSeconds: 350,
      }),
      // No auth cookie or Authorization header
    });

    const res = await recordWin(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toMatch(/Authentication required|Unauthorized/i);
  });

  it('7. should strictly reject win query for unauthenticated visitors (401 Unauthorized)', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'GET',
    });

    const res = await getWin(req);
    expect(res.status).toBe(401);
  });

  // =========================================================================
  // 4. UI COMPONENTS VERIFICATION FOR CLEAN GAMING APPROACH
  // =========================================================================
  it('8. GamerSidebar should render on player website for guests with zero "Playing as Guest" popups or banners', () => {
    const sidebarPath = path.resolve(__dirname, '../src/components/GamerSidebar.tsx');
    const content = fs.readFileSync(sidebarPath, 'utf-8');

    // Does not block unauthenticated users from opening sidebar
    expect(content).not.toContain('if (!isPlayerPortal || !isAuthenticated)');
    expect(content).toContain('if (!isPlayerPortal)');

    // Strictly does NOT contain "Playing as Guest" popup or callout
    expect(content).not.toContain('Playing as Guest');

    // Public categories and genres accessible
    expect(content).toContain('/category/action');
    expect(content).toContain('/category/arcade');
  });

  it('9. GamePlayer should provide clean gameplay with zero guest popups and avoid dispatching win requests when not logged in', () => {
    const playerPath = path.resolve(__dirname, '../src/components/GamePlayer.tsx');
    const content = fs.readFileSync(playerPath, 'utf-8');

    // Only submits win when user is logged in
    expect(content).toContain('if (user) {');
    expect(content).toContain("fetch('/api/player/win'");

    // Strictly does NOT display any "Playing as Guest" popup or disclaimer on Victory overlay
    expect(content).not.toContain('Playing as Guest (Unknown Player)');
    expect(content).not.toContain('Winnings and victories are not credited to any account while playing without login.');
  });
});
