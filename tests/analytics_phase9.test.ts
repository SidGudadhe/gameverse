import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';
import { GET as getDeveloperAnalytics } from '../src/app/api/developer/analytics/route';
import { GET as exportDeveloperAnalytics } from '../src/app/api/developer/analytics/export/route';

describe('Phase 9: Developer Analytics & Dashboards', () => {
  let DEV_ID: string;
  let OTHER_DEV_ID: string;
  let devAuthHeader: string;
  let otherDevAuthHeader: string;
  let playerAuthHeader: string;

  let game1Id: string;
  let game2Id: string;
  let otherGameId: string;

  beforeEach(() => {
    DEV_ID = `usr-dev-p9-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    OTHER_DEV_ID = `usr-dev-other-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Generate Auth Tokens
    const devToken = generateToken({
      userId: DEV_ID,
      email: 'dev@phase9studio.com',
      role: 'DEVELOPER',
    });
    devAuthHeader = `Bearer ${devToken}`;

    const otherDevToken = generateToken({
      userId: OTHER_DEV_ID,
      email: 'other@studio.com',
      role: 'DEVELOPER',
    });
    otherDevAuthHeader = `Bearer ${otherDevToken}`;

    const playerToken = generateToken({
      userId: 'usr-player-1',
      email: 'player@gamer.com',
      role: 'PLAYER',
    });
    playerAuthHeader = `Bearer ${playerToken}`;

    // 2. Seed Games
    game1Id = `game-p9-1-${Date.now()}`;
    gvDb.createGame({
      id: game1Id,
      developerId: DEV_ID,
      developerName: 'Phase 9 Studios',
      categoryId: 'cat-arcade',
      categoryName: 'Arcade',
      slug: `game-one-${Date.now()}`,
      title: 'Neon Odyssey',
      shortDescription: 'First game description.',
      status: 'PUBLISHED',
      totalPlays: 0,
      totalPlayMinutes: 0,
    });

    game2Id = `game-p9-2-${Date.now()}`;
    gvDb.createGame({
      id: game2Id,
      developerId: DEV_ID,
      developerName: 'Phase 9 Studios',
      categoryId: 'cat-puzzle',
      categoryName: 'Puzzle',
      slug: `game-two-${Date.now()}`,
      title: 'Quantum Maze',
      shortDescription: 'Second game description.',
      status: 'PUBLISHED',
      totalPlays: 0,
      totalPlayMinutes: 0,
    });

    otherGameId = `game-other-${Date.now()}`;
    gvDb.createGame({
      id: otherGameId,
      developerId: OTHER_DEV_ID,
      developerName: 'Other Studio',
      categoryId: 'cat-action',
      categoryName: 'Action',
      slug: `other-game-${Date.now()}`,
      title: 'Rogue Infiltrator',
      shortDescription: 'Other studio game.',
      status: 'PUBLISHED',
      totalPlays: 0,
      totalPlayMinutes: 0,
    });

    // 3. Seed Sessions for Game 1
    // Valid Desktop session (60s)
    const s1 = `sess-p9-1-${Date.now()}`;
    gvDb.createSession({
      gameId: game1Id,
      sessionToken: s1,
      playerId: 'usr-p1',
      deviceType: 'DESKTOP',
      referralToken: 'cr_studio9',
      isIvt: false,
    });
    gvDb.updateSessionHeartbeat(s1, 60, false);

    // Valid Mobile session (120s)
    const s2 = `sess-p9-2-${Date.now()}`;
    gvDb.createSession({
      gameId: game1Id,
      sessionToken: s2,
      playerId: 'usr-p2',
      deviceType: 'MOBILE',
      isIvt: false,
    });
    gvDb.updateSessionHeartbeat(s2, 120, false);

    // Bot session (0s, IVT)
    const s3 = `sess-p9-3-${Date.now()}`;
    gvDb.createSession({
      gameId: game1Id,
      sessionToken: s3,
      deviceType: 'DESKTOP',
      isIvt: true,
      ivtReason: 'Crawler detected',
    });

    // 4. Seed Sessions for Game 2
    // Valid Tablet session (180s)
    const s4 = `sess-p9-4-${Date.now()}`;
    gvDb.createSession({
      gameId: game2Id,
      sessionToken: s4,
      playerId: 'usr-p3',
      deviceType: 'TABLET',
      isIvt: false,
    });
    gvDb.updateSessionHeartbeat(s4, 180, false);
  });

  it('1. should calculate aggregated studio analytics across all developer games', async () => {
    const req = new NextRequest('http://localhost:3000/api/developer/analytics?timeframe=all', {
      headers: { Authorization: devAuthHeader },
    });

    const res = await getDeveloperAnalytics(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    // Total starts across game 1 and game 2 = 4 (3 for game 1, 1 for game 2)
    expect(body.summary.totalStarts).toBe(4);
    // Valid sessions >= 10s and !isIvt = 3 (s1: 60s, s2: 120s, s4: 180s)
    expect(body.summary.validSessions).toBe(3);
    // IVT count = 1 (s3)
    expect(body.summary.ivtSessionsCount).toBe(1);
    expect(body.summary.ivtRate).toBe(25); // 1 out of 4 = 25%

    // Total play minutes: (60 + 120 + 180) / 60 = 6.0 mins
    expect(body.summary.totalPlayMinutes).toBe(6);
    // Avg session seconds: 360 / 3 = 120s
    expect(body.summary.avgSessionSeconds).toBe(120);

    // Per-game breakdown array contains 2 games
    expect(body.games.length).toBe(2);
  });

  it('2. should filter analytics specifically to a single requested game', async () => {
    const req = new NextRequest(`http://localhost:3000/api/developer/analytics?gameId=${game1Id}&timeframe=all`, {
      headers: { Authorization: devAuthHeader },
    });

    const res = await getDeveloperAnalytics(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.summary.totalStarts).toBe(3); // Only game 1's 3 sessions
    expect(body.games.length).toBe(1);
    expect(body.games[0].id).toBe(game1Id);
  });

  it('3. should enforce tenant isolation and reject unauthorized access to other studios games', async () => {
    // Attempting to query another developer's game
    const req = new NextRequest(`http://localhost:3000/api/developer/analytics?gameId=${otherGameId}`, {
      headers: { Authorization: devAuthHeader },
    });

    const res = await getDeveloperAnalytics(req);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toContain('Forbidden');
  });

  it('4. should reject non-developer users with 403 Forbidden', async () => {
    const req = new NextRequest('http://localhost:3000/api/developer/analytics', {
      headers: { Authorization: playerAuthHeader },
    });

    const res = await getDeveloperAnalytics(req);
    expect(res.status).toBe(403);
  });

  it('5. should compute device platform breakdown and percentages correctly', async () => {
    const req = new NextRequest('http://localhost:3000/api/developer/analytics?timeframe=all', {
      headers: { Authorization: devAuthHeader },
    });

    const res = await getDeveloperAnalytics(req);
    const body = await res.json();

    // 2 desktop (s1, s3), 1 mobile (s2), 1 tablet (s4) = 4 total
    expect(body.devices.desktop).toBe(2);
    expect(body.devices.mobile).toBe(1);
    expect(body.devices.tablet).toBe(1);
    expect(body.devices.desktopPct).toBe(50);
    expect(body.devices.mobilePct).toBe(25);
    expect(body.devices.tabletPct).toBe(25);
  });

  it('6. should track acquisition channels and creator referral tokens (?ref=cr_...) accurately', async () => {
    const req = new NextRequest('http://localhost:3000/api/developer/analytics?timeframe=all', {
      headers: { Authorization: devAuthHeader },
    });

    const res = await getDeveloperAnalytics(req);
    const body = await res.json();

    // 1 referral session (s1 with 'cr_studio9'), 3 organic sessions
    expect(body.acquisition.referralStarts).toBe(1);
    expect(body.acquisition.organicStarts).toBe(3);
    expect(body.acquisition.referralTokens.length).toBe(1);
    expect(body.acquisition.referralTokens[0].token).toBe('cr_studio9');
    expect(body.acquisition.referralTokens[0].clicks).toBe(1);
  });

  it('7. should export developer analytics in CSV format', async () => {
    const req = new NextRequest('http://localhost:3000/api/developer/analytics/export?format=csv', {
      headers: { Authorization: devAuthHeader },
    });

    const res = await exportDeveloperAnalytics(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="gameverse-analytics.csv"');

    const csvText = await res.text();
    expect(csvText).toContain('Game ID,Game Title,Status');
    expect(csvText).toContain('Neon Odyssey');
    expect(csvText).toContain('Quantum Maze');
  });

  it('8. should export developer analytics in JSON format', async () => {
    const req = new NextRequest('http://localhost:3000/api/developer/analytics/export?format=json', {
      headers: { Authorization: devAuthHeader },
    });

    const res = await exportDeveloperAnalytics(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.developerId).toBe(DEV_ID);
    expect(body.count).toBe(2);
    expect(body.data.length).toBe(2);
    expect(body.data[0].gameTitle).toBeDefined();
    expect(body.data[0].totalStarts).toBeDefined();
  });
});
