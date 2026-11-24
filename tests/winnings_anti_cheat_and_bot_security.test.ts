import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as recordWin, GET as getWins } from '../src/app/api/player/win/route';
import { GET as getPayouts } from '../src/app/api/player/payouts/route';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';
import { UserRole } from '../src/types';

describe('Senior Security Audit: Anti-Cheat, Anti-Bot & Anti-Tampering for Total Winnings', () => {
  const LEGIT_PLAYER = {
    userId: 'usr_sec_player_audit',
    email: 'secplayer@gameverse.test',
    name: 'SecPlayer',
    role: 'PLAYER' as UserRole,
  };

  const ATTACKER_PLAYER = {
    userId: 'usr_sec_attacker_audit',
    email: 'secattacker@gameverse.test',
    name: 'SecAttacker',
    role: 'PLAYER' as UserRole,
  };

  const GAME_ID = 'game-neon-runner';

  let legitToken: string;
  let attackerToken: string;

  beforeEach(() => {
    // Setup users
    if (!gvDb.findUserById(LEGIT_PLAYER.userId)) {
      gvDb.createUser({
        id: LEGIT_PLAYER.userId,
        email: LEGIT_PLAYER.email,
        name: LEGIT_PLAYER.name,
        passwordHash: 'hashed_pw',
        role: 'PLAYER' as UserRole,
        createdAt: new Date().toISOString(),
      });
    }

    if (!gvDb.findUserById(ATTACKER_PLAYER.userId)) {
      gvDb.createUser({
        id: ATTACKER_PLAYER.userId,
        email: ATTACKER_PLAYER.email,
        name: ATTACKER_PLAYER.name,
        passwordHash: 'hashed_pw',
        role: 'PLAYER' as UserRole,
        createdAt: new Date().toISOString(),
      });
    }

    // Clean historical data for test isolation
    if (gvDb.state.playHistory) {
      gvDb.state.playHistory = gvDb.state.playHistory.filter(
        (h) => h.userId !== LEGIT_PLAYER.userId && h.userId !== ATTACKER_PLAYER.userId
      );
    }
    if (gvDb.state.gameWins) {
      gvDb.state.gameWins = gvDb.state.gameWins.filter(
        (w) => w.userId !== LEGIT_PLAYER.userId && w.userId !== ATTACKER_PLAYER.userId
      );
    }
    if (gvDb.state.sessions) {
      gvDb.state.sessions = gvDb.state.sessions.filter(
        (s) => s.playerId !== LEGIT_PLAYER.userId && s.playerId !== ATTACKER_PLAYER.userId
      );
    }

    legitToken = generateToken({
      userId: LEGIT_PLAYER.userId,
      email: LEGIT_PLAYER.email,
      name: LEGIT_PLAYER.name,
      role: LEGIT_PLAYER.role,
    });

    attackerToken = generateToken({
      userId: ATTACKER_PLAYER.userId,
      email: ATTACKER_PLAYER.email,
      name: ATTACKER_PLAYER.name,
      role: ATTACKER_PLAYER.role,
    });
  });

  // ================= 1. FAKE API CALL & REPLAY ATTACK DEFENSE =================
  it('1. should REJECT fake API calls with non-existent session tokens (HTTP 400)', async () => {
    const fakeReq = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${attackerToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({
        gameId: GAME_ID,
        sessionToken: 'sess-fake-fabricated-token-999',
        score: 999999,
      }),
    });

    const res = await recordWin(fakeReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('SESSION_NOT_FOUND');
    expect(data.error).toContain('No active server session found');
    expect(data.totalWins).toBe(0);
  });

  it('2. should STRICTLY BLOCK bot and automated user agents (HTTP 403 BOT_DETECTED)', async () => {
    const botUserAgents = [
      'python-requests/2.31.0',
      'curl/7.88.1',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/118.0 Safari/537.36',
      'PuppeteerExtra/1.0',
      'Selenium-Webdriver',
      'PostmanRuntime/7.32.3',
    ];

    for (const botAgent of botUserAgents) {
      const sessionToken = `sess-bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      gvDb.createSession({
        gameId: GAME_ID,
        sessionToken,
        playerId: ATTACKER_PLAYER.userId,
      });

      const botReq = new NextRequest('http://localhost:3000/api/player/win', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${attackerToken}`,
          'Content-Type': 'application/json',
          'User-Agent': botAgent,
        },
        body: JSON.stringify({
          gameId: GAME_ID,
          sessionToken,
          score: 5000,
        }),
      });

      const res = await recordWin(botReq);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('BOT_DETECTED');
      expect(data.error).toContain('Bot or automated client detected');
      expect(data.totalWins).toBe(0);
    }
  });

  it('3. should DETECT and REJECT time-warp duration manipulation (HTTP 403 TIME_WARP)', async () => {
    // Attacker starts a session right now (wall-clock: 0 seconds elapsed)
    const sessionToken = `sess-timewarp-${Date.now()}`;
    const session = gvDb.createSession({
      gameId: GAME_ID,
      sessionToken,
      playerId: ATTACKER_PLAYER.userId,
    });

    // Attacker tries to artificially forge 600 activeSeconds into the session
    session.activeSeconds = 600;

    const cheatReq = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${attackerToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({
        gameId: GAME_ID,
        sessionToken,
        score: 10000,
      }),
    });

    const res = await recordWin(cheatReq);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe('TIME_WARP');
    expect(data.error).toContain('Time-warp manipulation detected');
    expect(data.totalWins).toBe(0);

    // Verify session was flagged as IVT in database
    const updatedSession = gvDb.getSessionByToken(sessionToken);
    expect(updatedSession?.isIvt).toBe(true);
    expect(updatedSession?.ivtReason).toContain('Wall-clock time violation');
  });

  it('4. should PREVENT replay attacks: cannot claim the same session win twice (HTTP 409 REPLAY_CLAIM)', async () => {
    // Create legitimate session that started 6 minutes ago
    const sessionToken = `sess-legit-${Date.now()}`;
    const sixMinutesAgo = new Date(Date.now() - 360 * 1000).toISOString();

    const session = gvDb.createSession({
      gameId: GAME_ID,
      sessionToken,
      playerId: LEGIT_PLAYER.userId,
    });
    session.startTime = sixMinutesAgo;
    session.activeSeconds = 320; // 5.33 minutes verified

    // First Win Claim (Legitimate)
    const firstReq = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${legitToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({
        gameId: GAME_ID,
        sessionToken,
        score: 4500,
      }),
    });

    const firstRes = await recordWin(firstReq);
    expect(firstRes.status).toBe(200);
    const firstData = await firstRes.json();
    expect(firstData.success).toBe(true);
    expect(firstData.isQualified).toBe(true);
    expect(firstData.totalWins).toBe(1);

    // Second Win Claim with SAME sessionToken (Replay Attack)
    const replayReq = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${legitToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({
        gameId: GAME_ID,
        sessionToken,
        score: 4500,
      }),
    });

    const replayRes = await recordWin(replayReq);
    expect(replayRes.status).toBe(409);
    const replayData = await replayRes.json();
    expect(replayData.code).toBe('REPLAY_CLAIM');
    expect(replayData.error).toContain('A win has already been claimed for this game session');
    expect(replayData.totalWins).toBe(1); // Still exactly 1 win, cannot be inflated!
  });

  it('5. should REJECT cross-account session hijacking (HTTP 403 PLAYER_MISMATCH)', async () => {
    // Session created by Legit Player
    const sessionToken = `sess-legit-hijack-${Date.now()}`;
    const sixMinutesAgo = new Date(Date.now() - 360 * 1000).toISOString();

    const session = gvDb.createSession({
      gameId: GAME_ID,
      sessionToken,
      playerId: LEGIT_PLAYER.userId,
    });
    session.startTime = sixMinutesAgo;
    session.activeSeconds = 350;

    // Attacker tries to submit this sessionToken with their own auth token
    const hijackReq = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${attackerToken}`, // Attacker's token
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({
        gameId: GAME_ID,
        sessionToken, // Legit player's sessionToken
      }),
    });

    const hijackRes = await recordWin(hijackReq);
    expect(hijackRes.status).toBe(403);
    const hijackData = await hijackRes.json();
    expect(hijackData.code).toBe('PLAYER_MISMATCH');
    expect(hijackData.error).toContain('Session belongs to another player');
    expect(hijackData.totalWins).toBe(0);
  });

  it('6. should REJECT sessions flagged for Invalid Traffic (IVT) (HTTP 403 IVT_DETECTED)', async () => {
    const sessionToken = `sess-ivt-${Date.now()}`;
    const sixMinutesAgo = new Date(Date.now() - 360 * 1000).toISOString();

    const session = gvDb.createSession({
      gameId: GAME_ID,
      sessionToken,
      playerId: ATTACKER_PLAYER.userId,
      isIvt: true,
      ivtReason: 'Heartbeat velocity anomaly: +120s jump',
    });
    session.startTime = sixMinutesAgo;
    session.activeSeconds = 350;

    const ivtReq = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${attackerToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({
        gameId: GAME_ID,
        sessionToken,
      }),
    });

    const res = await recordWin(ivtReq);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe('IVT_DETECTED');
    expect(data.error).toContain('Session flagged for invalid traffic');
    expect(data.totalWins).toBe(0);
  });

  it('7. should PREVENT concurrent multi-tab win velocity anomaly (HTTP 429 WIN_COOLDOWN)', async () => {
    // Session 1: Finished and won just 30 seconds ago
    const sessionToken1 = `sess-tab1-${Date.now()}`;
    const tenMinutesAgo = new Date(Date.now() - 600 * 1000).toISOString();
    const session1 = gvDb.createSession({
      gameId: GAME_ID,
      sessionToken: sessionToken1,
      playerId: LEGIT_PLAYER.userId,
    });
    session1.startTime = tenMinutesAgo;
    session1.activeSeconds = 320;

    // First Win
    await recordWin(
      new NextRequest('http://localhost:3000/api/player/win', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${legitToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        body: JSON.stringify({ gameId: GAME_ID, sessionToken: sessionToken1 }),
      })
    );

    // Session 2 from a second parallel tab tries to claim a second 5-minute win immediately (within 10 seconds)
    const sessionToken2 = `sess-tab2-${Date.now()}`;
    const session2 = gvDb.createSession({
      gameId: 'game-shadow-strike',
      sessionToken: sessionToken2,
      playerId: LEGIT_PLAYER.userId,
    });
    session2.startTime = tenMinutesAgo;
    session2.activeSeconds = 310;

    const fastWinReq = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${legitToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({ gameId: 'game-shadow-strike', sessionToken: sessionToken2 }),
    });

    const fastRes = await recordWin(fastWinReq);
    expect(fastRes.status).toBe(429);
    const fastData = await fastRes.json();
    expect(fastData.code).toBe('WIN_COOLDOWN');
    expect(fastData.error).toContain('Win velocity anomaly');
    expect(fastData.totalWins).toBe(1); // Kept strictly at 1
  });

  it('8. should correctly record legitimate human gameplay session with audit log', async () => {
    const sessionToken = `sess-human-pass-${Date.now()}`;
    const sevenMinutesAgo = new Date(Date.now() - 420 * 1000).toISOString();

    const session = gvDb.createSession({
      gameId: GAME_ID,
      sessionToken,
      playerId: LEGIT_PLAYER.userId,
    });
    session.startTime = sevenMinutesAgo;
    session.activeSeconds = 340; // 5m 40s verified

    const winReq = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${legitToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        gameId: GAME_ID,
        sessionToken,
        score: 7850,
      }),
    });

    const res = await recordWin(winReq);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.isQualified).toBe(true);
    expect(data.totalWins).toBe(1);
    expect(data.verifiedActiveSeconds).toBe(340);

    // Verify Payouts API also returns 1 total winning
    const payoutReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      headers: { Authorization: `Bearer ${legitToken}` },
    });
    const payoutRes = await getPayouts(payoutReq);
    const payoutData = await payoutRes.json();
    expect(payoutData.stats.totalWins).toBe(1);
    expect(payoutData.stats.totalWinnings).toBe(1);

    // Verify tamper-proof audit trail was logged
    const logs = gvDb.getAuditLogs(10, { action: 'GAME_WIN_QUALIFIED' });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].actorId).toBe(LEGIT_PLAYER.userId);
  });
});
