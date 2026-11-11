import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import {
  detectBot,
  hashIpAddress,
  validateHeartbeat,
  isEligibleForMonetization,
} from '../src/lib/analytics';
import { POST as pingTelemetry } from '../src/app/api/analytics/ping/route';
import { GET as getGameAnalytics } from '../src/app/api/analytics/game/[gameId]/route';

describe('Phase 8: Player Analytics Pipeline, Telemetry & IVT Bot Filtering', () => {
  let testGameId: string;

  beforeEach(() => {
    testGameId = `game-analytics-${Date.now()}`;
    gvDb.createGame({
      id: testGameId,
      developerId: 'usr-dev-analytics',
      developerName: 'Quantum Pixel Studios',
      categoryId: 'cat-arcade',
      categoryName: 'Arcade',
      slug: `telemetry-runner-${Date.now()}`,
      title: 'Neon Telemetry Runner',
      shortDescription: 'High speed analytics verification game.',
      totalPlays: 0,
      totalPlayMinutes: 0,
      status: 'PUBLISHED',
    });
  });

  it('1. should detect known bots and automated scripts while allowing legitimate browser User-Agents', () => {
    // Automated crawlers & scripts
    expect(detectBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)').isBot).toBe(true);
    expect(detectBot('python-requests/2.31.0').isBot).toBe(true);
    expect(detectBot('curl/7.88.1').isBot).toBe(true);
    expect(detectBot('PostmanRuntime/7.32.3').isBot).toBe(true);
    expect(detectBot('Mozilla/5.0 (HeadlessChrome/119.0.6045.105)').isBot).toBe(true);
    expect(detectBot('').isBot).toBe(true);
    expect(detectBot(undefined).isBot).toBe(true);

    // Legitimate modern desktop & mobile browsers
    expect(
      detectBot(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ).isBot
    ).toBe(false);
    expect(
      detectBot(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
      ).isBot
    ).toBe(false);
  });

  it('2. should hash IP addresses with SHA-256 for GDPR/DPDP privacy compliance', () => {
    const rawIp = '198.51.100.42';
    const hash1 = hashIpAddress(rawIp);
    const hash2 = hashIpAddress(rawIp);

    expect(hash1).toBeDefined();
    expect(hash1.length).toBe(64); // SHA-256 hex length
    expect(hash1).toBe(hash2); // Deterministic salt
    expect(hash1).not.toContain(rawIp); // Never leak raw IP
  });

  it('3. should validate heartbeat progression and flag playtime anomalies', () => {
    // Normal 15-second heartbeat intervals
    expect(validateHeartbeat(0, 15).isValid).toBe(true);
    expect(validateHeartbeat(15, 30).isValid).toBe(true);

    // Time-travel anomaly (activeSeconds decreasing)
    const backwardsCheck = validateHeartbeat(30, 20);
    expect(backwardsCheck.isValid).toBe(false);
    expect(backwardsCheck.reason).toContain('Negative playtime anomaly');

    // Unrealistic playtime leap (> 60s within heartbeat)
    const excessiveCheck = validateHeartbeat(15, 120, 60);
    expect(excessiveCheck.isValid).toBe(false);
    expect(excessiveCheck.reason).toContain('Excessive playtime delta');
  });

  it('4. should enforce the 10-second minimum threshold and IVT exclusion for monetization credit', () => {
    // Plays under 10 seconds are excluded from monetization
    expect(isEligibleForMonetization(0, false)).toBe(false);
    expect(isEligibleForMonetization(9, false)).toBe(false);

    // Legitimate plays >= 10 seconds qualify
    expect(isEligibleForMonetization(10, false)).toBe(true);
    expect(isEligibleForMonetization(120, false)).toBe(true);

    // Bot / IVT traffic is NEVER eligible for monetization regardless of duration
    expect(isEligibleForMonetization(120, true)).toBe(false);
    expect(isEligibleForMonetization(3600, true)).toBe(false);
  });

  it('5. should handle SESSION_START telemetry, incrementing totalPlays and logging session', async () => {
    const sessionToken = `test-sess-${Date.now()}-1`;
    const req = new NextRequest('http://localhost:3000/api/analytics/ping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        gameId: testGameId,
        sessionToken,
        eventType: 'SESSION_START',
        deviceType: 'DESKTOP',
        referralToken: 'cr_pixel123',
      }),
    });

    const res = await pingTelemetry(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.session.sessionToken).toBe(sessionToken);
    expect(body.session.isIvt).toBe(false);
    expect(body.isMonetizable).toBe(false); // 0s active

    // Verify database record
    const sessionInDb = gvDb.getSessionByToken(sessionToken);
    expect(sessionInDb).toBeDefined();
    expect(sessionInDb!.referralToken).toBe('cr_pixel123');

    // Verify game totalPlays incremented
    const game = gvDb.getGameById(testGameId);
    expect(game!.totalPlays).toBe(1);
  });

  it('6. should detect and flag IVT bot requests sent to the telemetry ingestion endpoint', async () => {
    const sessionToken = `bot-sess-${Date.now()}`;
    const req = new NextRequest('http://localhost:3000/api/analytics/ping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'python-requests/2.28.1',
      },
      body: JSON.stringify({
        gameId: testGameId,
        sessionToken,
        eventType: 'SESSION_START',
      }),
    });

    const res = await pingTelemetry(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.session.isIvt).toBe(true);
    expect(body.session.ivtReason).toContain('python');
    expect(body.isMonetizable).toBe(false);

    // Bot sessions must NOT increment legitimate game totalPlays
    const game = gvDb.getGameById(testGameId);
    expect(game!.totalPlays).toBe(0);
  });

  it('7. should process periodic HEARTBEAT, accumulate active play minutes and finalize on SESSION_END', async () => {
    const sessionToken = `sess-flow-${Date.now()}`;
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // 1. Start Session
    await pingTelemetry(
      new NextRequest('http://localhost:3000/api/analytics/ping', {
        method: 'POST',
        headers: { 'User-Agent': userAgent },
        body: JSON.stringify({
          gameId: testGameId,
          sessionToken,
          eventType: 'SESSION_START',
          deviceType: 'DESKTOP',
        }),
      })
    );

    // 2. Heartbeat 1 (15 seconds)
    const hb1 = await pingTelemetry(
      new NextRequest('http://localhost:3000/api/analytics/ping', {
        method: 'POST',
        headers: { 'User-Agent': userAgent },
        body: JSON.stringify({
          gameId: testGameId,
          sessionToken,
          eventType: 'HEARTBEAT',
          activeSeconds: 15,
        }),
      })
    );
    const hb1Body = await hb1.json();
    expect(hb1Body.session.activeSeconds).toBe(15);
    expect(hb1Body.isMonetizable).toBe(true); // >= 10s

    // 3. Heartbeat 2 (30 seconds)
    const hb2 = await pingTelemetry(
      new NextRequest('http://localhost:3000/api/analytics/ping', {
        method: 'POST',
        headers: { 'User-Agent': userAgent },
        body: JSON.stringify({
          gameId: testGameId,
          sessionToken,
          eventType: 'HEARTBEAT',
          activeSeconds: 30,
        }),
      })
    );
    const hb2Body = await hb2.json();
    expect(hb2Body.session.activeSeconds).toBe(30);

    // 4. End Session (60 seconds)
    const endRes = await pingTelemetry(
      new NextRequest('http://localhost:3000/api/analytics/ping', {
        method: 'POST',
        headers: { 'User-Agent': userAgent },
        body: JSON.stringify({
          gameId: testGameId,
          sessionToken,
          eventType: 'SESSION_END',
          activeSeconds: 60,
        }),
      })
    );
    const endBody = await endRes.json();
    expect(endBody.session.activeSeconds).toBe(60);

    // Verify session in database
    const session = gvDb.getSessionByToken(sessionToken);
    expect(session!.activeSeconds).toBe(60);
    expect(session!.endTime).toBeDefined();

    // Verify game totalPlayMinutes recalculated (60s = 1.0 min)
    const game = gvDb.getGameById(testGameId);
    expect(game!.totalPlayMinutes).toBe(1);
  });

  it('8. should aggregate game analytics correctly via GET /api/analytics/game/[gameId]', async () => {
    const s1Token = `agg-sess-1-${Date.now()}`;
    const botToken = `agg-bot-1-${Date.now()}`;

    // Seed 1 legitimate session
    gvDb.createSession({
      gameId: testGameId,
      sessionToken: s1Token,
      playerId: 'usr-p1',
      deviceType: 'DESKTOP',
      isIvt: false,
    });
    gvDb.updateSessionHeartbeat(s1Token, 45, false);

    // Seed 1 bot session
    gvDb.createSession({
      gameId: testGameId,
      sessionToken: botToken,
      deviceType: 'MOBILE',
      isIvt: true,
      ivtReason: 'Crawler bot detected',
    });

    // Query analytics for test game
    const req = new NextRequest(`http://localhost:3000/api/analytics/game/${testGameId}`);
    const res = await getGameAnalytics(req, { params: { gameId: testGameId } });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.game.id).toBe(testGameId);
    expect(body.analytics.totalStarts).toBe(2);
    expect(body.analytics.ivtSessionsCount).toBe(1);
    expect(body.analytics.validSessions).toBe(1);
    expect(body.analytics.deviceBreakdown.desktop).toBe(1);
    expect(body.analytics.deviceBreakdown.mobile).toBe(1);
  });
});
