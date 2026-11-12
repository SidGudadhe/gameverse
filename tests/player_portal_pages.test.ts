import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getFavorites, POST as addFavorite } from '../src/app/api/player/favorites/route';
import { DELETE as removeFavorite } from '../src/app/api/player/favorites/[gameId]/route';
import { GET as getHistory } from '../src/app/api/player/history/route';
import { GET as getProfile, PUT as updateProfile } from '../src/app/api/player/profile/route';
import { GET as getPayouts, POST as requestPayout } from '../src/app/api/player/payouts/route';
import { GET as getDeveloperPayouts } from '../src/app/api/developer/payouts/route';
import { POST as requestDeveloperPayout } from '../src/app/api/developer/payouts/request/route';
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

    gvDb.deletePlayerPayoutMethod(TEST_USER.userId);
    if (gvDb.state.playerPayoutRequests) {
      gvDb.state.playerPayoutRequests = gvDb.state.playerPayoutRequests.filter(
        (r) => r.userId !== TEST_USER.userId
      );
    }
    if (gvDb.state.playerWallets) {
      gvDb.state.playerWallets = gvDb.state.playerWallets.filter(
        (w) => w.userId !== TEST_USER.userId
      );
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

    // Below minimum threshold of ₹500
    const badReq3 = new NextRequest('http://localhost:3000/api/player/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ method: 'UPI', accountDetails: 'user@okhdfcbank', amount: 250 }),
    });
    const res3 = await requestPayout(badReq3);
    expect(res3.status).toBe(400);
    const data3 = await res3.json();
    expect(data3.error).toContain('500');
  });

  it('9b. POST /api/player/payouts should reject requests if user balance is below ₹500', async () => {
    const lowUser = {
      userId: 'usr_low_balance_test',
      email: 'lowbal@gameverse.test',
      name: 'LowBal',
      role: 'PLAYER' as UserRole,
    };
    gvDb.createUser({
      id: lowUser.userId,
      email: lowUser.email,
      name: lowUser.name,
      passwordHash: 'hash',
      role: 'PLAYER',
      createdAt: new Date().toISOString(),
    });
    const lowToken = generateToken(lowUser);

    // Record past payout so remaining balance is only ₹200 (less than 500)
    if (!gvDb.state.playerPayoutRequests) gvDb.state.playerPayoutRequests = [];
    gvDb.state.playerPayoutRequests = gvDb.state.playerPayoutRequests.filter(
      (r) => r.userId !== lowUser.userId
    );
    gvDb.state.playerPayoutRequests.push({
      id: 'past-paid-1',
      userId: lowUser.userId,
      amount: 1300,
      currency: 'INR',
      method: 'UPI',
      accountDetails: 'lowbal@upi',
      status: 'PAID',
      requestedAt: new Date().toISOString(),
      transactionRef: 'TXN-PAID-1',
    });

    const lowReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lowToken}`,
      },
      body: JSON.stringify({
        method: 'UPI',
        accountDetails: 'lowbal@upi',
        amount: 500,
      }),
    });
    const lowRes = await requestPayout(lowReq);
    expect(lowRes.status).toBe(400);
    const lowData = await lowRes.json();
    expect(lowData.error).toContain('500');
    expect(lowData.needed).toBe(300);
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

  it('12. Player Payout Method Management: Save, Update, Delete and Amount-Only Payout Request', async () => {
    // 12a. Save Method (UPI)
    const saveReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'SAVE_METHOD',
        method: 'UPI',
        accountDetails: 'player_gaming@okhdfcbank',
        beneficiaryName: 'Pro Gamer',
      }),
    });
    const saveRes = await requestPayout(saveReq);
    expect(saveRes.status).toBe(200);
    const saveData = await saveRes.json();
    expect(saveData.success).toBe(true);
    expect(saveData.savedMethod.method).toBe('UPI');
    expect(saveData.savedMethod.accountDetails).toBe('player_gaming@okhdfcbank');

    // 12b. Update Method (to Bank Account)
    const updateReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'SAVE_METHOD',
        method: 'BANK_TRANSFER',
        accountDetails: 'ACC987654321 IFSC:HDFC0001234',
        beneficiaryName: 'Pro Gamer Studio',
      }),
    });
    const updateRes = await requestPayout(updateReq);
    expect(updateRes.status).toBe(200);
    const updateData = await updateRes.json();
    expect(updateData.savedMethod.method).toBe('BANK_TRANSFER');

    // 12c. Request Payout with Amount only (uses saved method automatically)
    const amountOnlyReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'REQUEST_PAYOUT',
        amount: 750,
        note: 'Tournament play reward withdrawal',
      }),
    });
    const amountRes = await requestPayout(amountOnlyReq);
    expect(amountRes.status).toBe(200);
    const amountData = await amountRes.json();
    expect(amountData.success).toBe(true);
    expect(amountData.request.amount).toBe(750);
    expect(amountData.request.method).toBe('BANK_TRANSFER');
    expect(amountData.request.status).toBe('PENDING');

    // 12d. Verify GET /api/player/payouts returns savedMethod, stats, and request history
    const getPayoutsReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listRes = await getPayouts(getPayoutsReq);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.savedMethod).toBeDefined();
    expect(listData.savedMethod.method).toBe('BANK_TRANSFER');
    expect(listData.requests.length).toBeGreaterThan(0);
    expect(listData.requests[0].amount).toBe(750);
    expect(listData.requests[0].status).toBe('PENDING');

    // 12e. Delete Method
    const deleteReq = new NextRequest('http://localhost:3000/api/player/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'DELETE_METHOD' }),
    });
    const deleteRes = await requestPayout(deleteReq);
    expect(deleteRes.status).toBe(200);
    const deleteData = await deleteRes.json();
    expect(deleteData.success).toBe(true);
  });

  it('13. Developer Payout Method Management: Save, Update, Delete and Amount Payout Request', async () => {
    const devUser = {
      userId: 'usr_dev_payout_test',
      email: 'devpayout@gameverse.test',
      name: 'Studio Developer',
      role: 'DEVELOPER' as UserRole,
    };
    const devToken = generateToken(devUser);

    // 13a. Save Developer Payout Method (UPI)
    const saveReq = new NextRequest('http://localhost:3000/api/developer/payouts/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        action: 'SAVE_METHOD',
        payoutMethod: 'UPI',
        accountDetails: 'gamestudio@okaxis',
        beneficiaryName: 'Game Studio Labs',
      }),
    });
    const saveRes = await requestDeveloperPayout(saveReq);
    expect(saveRes.status).toBe(200);
    const saveData = await saveRes.json();
    expect(saveData.success).toBe(true);
    expect(saveData.settings.payoutMethod).toBe('UPI');

    // 13b. Update Developer Payout Method (Bank Wire)
    const updateReq = new NextRequest('http://localhost:3000/api/developer/payouts/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        action: 'SAVE_METHOD',
        payoutMethod: 'BANK_WIRE',
        accountDetails: 'IBAN GB29NWBK60161331926819',
        beneficiaryName: 'Game Studio Global Inc',
      }),
    });
    const updateRes = await requestDeveloperPayout(updateReq);
    expect(updateRes.status).toBe(200);
    const updateData = await updateRes.json();
    expect(updateData.settings.payoutMethod).toBe('BANK_WIRE');

    // 13c. Submit Payout Request with Amount only
    const requestReq = new NextRequest('http://localhost:3000/api/developer/payouts/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        action: 'REQUEST_PAYOUT',
        amount: 250.0,
      }),
    });
    const reqRes = await requestDeveloperPayout(requestReq);
    expect(reqRes.status).toBe(200);
    const reqData = await reqRes.json();
    expect(reqData.success).toBe(true);
    expect(reqData.amount).toBe(250.0);
    expect(reqData.payoutReference).toBeDefined();

    // 13d. Verify GET /api/developer/payouts returns settings and records with status
    const getDevPayoutsReq = new NextRequest('http://localhost:3000/api/developer/payouts', {
      headers: { Authorization: `Bearer ${devToken}` },
    });
    const devListRes = await getDeveloperPayouts(getDevPayoutsReq);
    expect(devListRes.status).toBe(200);
    const devListData = await devListRes.json();
    expect(devListData.settings.payoutMethod).toBe('BANK_WIRE');
    expect(devListData.records.some((r: any) => r.creatorShare === 250.0)).toBe(true);

    // 13e. Delete Developer Payout Method
    const deleteReq = new NextRequest('http://localhost:3000/api/developer/payouts/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({ action: 'DELETE_METHOD' }),
    });
    const deleteRes = await requestDeveloperPayout(deleteReq);
    expect(deleteRes.status).toBe(200);
    const deleteData = await deleteRes.json();
    expect(deleteData.success).toBe(true);
  });

  it('14. Player Multi-UPI Support (Allows up to 4 UPI IDs, rejects 5th, supports switching active)', async () => {
    // Clear existing methods for test user
    gvDb.deletePlayerPayoutMethod(TEST_USER.userId);
    if (gvDb.state.playerPayoutRequests) {
      gvDb.state.playerPayoutRequests = gvDb.state.playerPayoutRequests.filter(
        (r) => r.userId !== TEST_USER.userId
      );
    }
    if (gvDb.state.playerWallets) {
      gvDb.state.playerWallets = gvDb.state.playerWallets.filter(
        (w) => w.userId !== TEST_USER.userId
      );
    }

    // 14a. Add UPI #1 (Google Pay)
    const upi1Res = await requestPayout(
      new NextRequest('http://localhost:3000/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'SAVE_METHOD',
          addNew: true,
          method: 'UPI',
          accountDetails: 'player1@okaxis',
          label: 'Personal GPay',
          beneficiaryName: 'Player One',
        }),
      })
    );
    expect(upi1Res.status).toBe(200);
    const upi1Data = await upi1Res.json();
    expect(upi1Data.savedMethods.length).toBe(1);
    expect(upi1Data.savedMethod.isDefault).toBe(true);

    // 14b. Add UPI #2 (PhonePe)
    const upi2Res = await requestPayout(
      new NextRequest('http://localhost:3000/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'SAVE_METHOD',
          addNew: true,
          method: 'UPI',
          accountDetails: 'player2@ybl',
          label: 'PhonePe Secondary',
          beneficiaryName: 'Player Two',
        }),
      })
    );
    expect(upi2Res.status).toBe(200);
    const upi2Data = await upi2Res.json();
    expect(upi2Data.savedMethods.length).toBe(2);

    // 14c. Add UPI #3 (Paytm)
    const upi3Res = await requestPayout(
      new NextRequest('http://localhost:3000/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'SAVE_METHOD',
          addNew: true,
          method: 'UPI',
          accountDetails: '9876543210@paytm',
          label: 'Paytm Wallet',
          beneficiaryName: 'Player Three',
        }),
      })
    );
    expect(upi3Res.status).toBe(200);
    const upi3Data = await upi3Res.json();
    expect(upi3Data.savedMethods.length).toBe(3);

    // 14d. Add UPI #4 (BHIM)
    const upi4Res = await requestPayout(
      new NextRequest('http://localhost:3000/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'SAVE_METHOD',
          addNew: true,
          method: 'UPI',
          accountDetails: 'player4@upi',
          label: 'BHIM UPI',
          beneficiaryName: 'Player Four',
        }),
      })
    );
    expect(upi4Res.status).toBe(200);
    const upi4Data = await upi4Res.json();
    expect(upi4Data.savedMethods.length).toBe(4);

    // 14e. Attempting to add a 5th UPI ID must fail with 400
    const upi5Res = await requestPayout(
      new NextRequest('http://localhost:3000/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'SAVE_METHOD',
          addNew: true,
          method: 'UPI',
          accountDetails: 'player5@okhdfcbank',
          label: 'Excess 5th UPI',
        }),
      })
    );
    expect(upi5Res.status).toBe(400);
    const upi5Data = await upi5Res.json();
    expect(upi5Data.error).toContain('maximum of 4');

    // 14f. Switch active/default UPI ID to UPI #3
    const method3Id = upi3Data.savedMethods.find((m: any) => m.accountDetails === '9876543210@paytm').id;
    const setDefaultRes = await requestPayout(
      new NextRequest('http://localhost:3000/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'SET_DEFAULT',
          methodId: method3Id,
        }),
      })
    );
    expect(setDefaultRes.status).toBe(200);
    const setDefaultData = await setDefaultRes.json();
    expect(setDefaultData.savedMethod.id).toBe(method3Id);
    expect(setDefaultData.savedMethod.accountDetails).toBe('9876543210@paytm');

    // 14g. Request payout choosing a specific UPI ID (UPI #2)
    const method2Id = upi2Data.savedMethods.find((m: any) => m.accountDetails === 'player2@ybl').id;
    const specificPayoutRes = await requestPayout(
      new NextRequest('http://localhost:3000/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'REQUEST_PAYOUT',
          methodId: method2Id,
          amount: 600,
        }),
      })
    );
    expect(specificPayoutRes.status).toBe(200);
    const specificPayoutData = await specificPayoutRes.json();
    expect(specificPayoutData.request.accountDetails).toBe('player2@ybl');
    expect(specificPayoutData.request.amount).toBe(600);

    // 14h. Delete 1 UPI ID (frees up slot)
    const deleteRes = await requestPayout(
      new NextRequest('http://localhost:3000/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'DELETE_METHOD',
          methodId: method2Id,
        }),
      })
    );
    expect(deleteRes.status).toBe(200);
    const deleteData = await deleteRes.json();
    expect(deleteData.savedMethods.length).toBe(3);
  });
});
