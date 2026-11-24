import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getPayouts } from '../src/app/api/player/payouts/route';
import { POST as recordWin, GET as getWins } from '../src/app/api/player/win/route';
import { POST as recordHistory } from '../src/app/api/player/history/route';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';
import { UserRole } from '../src/types';

describe('Player Total Winnings & Payouts (>5 Mins Win Requirement)', () => {
  const TEST_USER = {
    userId: 'usr_test_winnings_player',
    email: 'winningplayer@gameverse.test',
    name: 'WinningPlayer',
    role: 'PLAYER' as UserRole,
  };

  const GAME_ID_1 = 'game-neon-runner';
  const GAME_ID_2 = 'game-shadow-strike';

  let token: string;

  beforeEach(() => {
    // Reset test user state
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

    // Clean user's playHistory and gameWins
    if (gvDb.state.playHistory) {
      gvDb.state.playHistory = gvDb.state.playHistory.filter((h) => h.userId !== TEST_USER.userId);
    }
    if (gvDb.state.gameWins) {
      gvDb.state.gameWins = gvDb.state.gameWins.filter((w) => w.userId !== TEST_USER.userId);
    }

    token = generateToken({
      userId: TEST_USER.userId,
      email: TEST_USER.email,
      name: TEST_USER.name,
      role: TEST_USER.role,
    });
  });

  it('1. should start with 0 total winnings when player has no gameplay history', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/payouts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await getPayouts(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.stats.totalWins).toBe(0);
    expect(data.stats.totalWinnings).toBe(0);
  });

  it('2. should NOT count a game win if playtime was under 5 minutes (<300s)', async () => {
    // Player wins a game after only 180 seconds (3 minutes)
    const winReq = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId: GAME_ID_1,
        playSeconds: 180, // 3 minutes < 5 minutes
        score: 1200,
      }),
    });

    const winRes = await recordWin(winReq);
    expect(winRes.status).toBe(200);
    const winData = await winRes.json();

    expect(winData.success).toBe(true);
    expect(winData.isQualified).toBe(false);
    expect(winData.totalWins).toBe(0);
    expect(winData.totalWinnings).toBe(0);

    // Verify payouts API still reports 0 total winnings
    const payoutReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payoutRes = await getPayouts(payoutReq);
    const payoutData = await payoutRes.json();

    expect(payoutData.stats.totalWins).toBe(0);
    expect(payoutData.stats.totalWinnings).toBe(0);
  });

  it('3. should count a game win when playtime is 5+ minutes (>=300s)', async () => {
    // Player wins a game after 320 seconds (5.33 minutes)
    const winReq = new NextRequest('http://localhost:3000/api/player/win', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId: GAME_ID_1,
        playSeconds: 320, // > 5 minutes
        score: 5400,
      }),
    });

    const winRes = await recordWin(winReq);
    expect(winRes.status).toBe(200);
    const winData = await winRes.json();

    expect(winData.success).toBe(true);
    expect(winData.isQualified).toBe(true);
    expect(winData.totalWins).toBe(1);
    expect(winData.totalWinnings).toBe(1);

    // Verify in payouts API
    const payoutReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payoutRes = await getPayouts(payoutReq);
    const payoutData = await payoutRes.json();

    expect(payoutData.stats.totalWins).toBe(1);
    expect(payoutData.stats.totalWinnings).toBe(1);
  });

  it('4. should correctly accumulate multiple 5+ min wins across different games', async () => {
    // Win 1: 300 seconds on Game 1 (Qualified)
    await recordWin(
      new NextRequest('http://localhost:3000/api/player/win', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: GAME_ID_1, playSeconds: 300, score: 2000 }),
      })
    );

    // Win 2: 150 seconds on Game 2 (Under 5 mins -> NOT qualified)
    await recordWin(
      new NextRequest('http://localhost:3000/api/player/win', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: GAME_ID_2, playSeconds: 150, score: 900 }),
      })
    );

    // Win 3: 450 seconds on Game 2 (7.5 mins -> Qualified)
    await recordWin(
      new NextRequest('http://localhost:3000/api/player/win', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: GAME_ID_2, playSeconds: 450, score: 7500 }),
      })
    );

    // Total should be exactly 2 qualified wins
    const winsReq = new NextRequest('http://localhost:3000/api/player/win', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const winsRes = await getWins(winsReq);
    const winsData = await winsRes.json();

    expect(winsData.totalWins).toBe(2);
    expect(winsData.totalWinnings).toBe(2);
    expect(winsData.wins.length).toBe(3);

    // Verify payouts API
    const payoutReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payoutRes = await getPayouts(payoutReq);
    const payoutData = await payoutRes.json();

    expect(payoutData.stats.totalWins).toBe(2);
    expect(payoutData.stats.totalWinnings).toBe(2);
  });

  it('5. should support recording wins through /api/player/history with hasWon: true', async () => {
    const historyReq = new NextRequest('http://localhost:3000/api/player/history', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: GAME_ID_1,
        playSeconds: 360, // 6 minutes > 5 minutes
        hasWon: true,
        score: 3000,
      }),
    });

    const historyRes = await recordHistory(historyReq);
    expect(historyRes.status).toBe(200);

    const payoutReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payoutRes = await getPayouts(payoutReq);
    const payoutData = await payoutRes.json();

    expect(payoutData.stats.totalWins).toBe(1);
    expect(payoutData.stats.totalWinnings).toBe(1);
  });

  it('6. should NEVER count playtime alone as a win: playing for 15 minutes without winning gives 0 wins', async () => {
    // Player plays for 900 seconds (15 minutes) but does NOT win (e.g. game session telemetry or normal play history)
    const historyReq = new NextRequest('http://localhost:3000/api/player/history', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: GAME_ID_1,
        playSeconds: 900, // 15 minutes of play
        hasWon: false, // NOT WON
      }),
    });

    const historyRes = await recordHistory(historyReq);
    expect(historyRes.status).toBe(200);

    // Verify payouts API still has 0 total wins despite 15 minutes playtime
    const payoutReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payoutRes = await getPayouts(payoutReq);
    const payoutData = await payoutRes.json();

    expect(payoutData.stats.totalPlayMinutes).toBe(15);
    expect(payoutData.stats.totalWins).toBe(0);
    expect(payoutData.stats.totalWinnings).toBe(0);
  });
});
