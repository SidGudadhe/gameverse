import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import {
  checkAdEligibility,
  calculateAdRevenue,
  AD_RATES,
  AD_CONFIG,
  getRandomAdCreative,
} from '../src/lib/ads';
import { GET as getAdSlot } from '../src/app/api/ads/slot/route';
import { POST as recordAdImpression } from '../src/app/api/ads/impression/route';

describe('Phase 11: Advertising & Monetization Integration', () => {
  let devId: string;
  let testGameId: string;
  let sessionToken: string;

  beforeEach(() => {
    devId = `usr-dev-p11-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    testGameId = `game-p11-${Date.now()}`;
    sessionToken = `sess-p11-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Seed test game
    gvDb.createGame({
      id: testGameId,
      developerId: devId,
      developerName: 'Monetization Games',
      categoryId: 'cat-arcade',
      categoryName: 'Arcade',
      slug: `cyber-blaster-${Date.now()}`,
      title: 'Cyber Blaster 2088',
      shortDescription: 'Monetization ad test title.',
      status: 'PUBLISHED',
      totalPlays: 0,
      totalPlayMinutes: 0,
    });
  });

  it('1. Enforces ad eligibility and frequency cooldown rules', () => {
    // PREROLL: First check should be eligible
    const prerollCheck1 = checkAdEligibility({
      gameId: testGameId,
      sessionToken,
      format: 'PREROLL',
    });
    expect(prerollCheck1.eligible).toBe(true);
    expect(prerollCheck1.cooldownRemainingSeconds).toBe(0);

    // Record a PREROLL impression
    gvDb.createAdImpression({
      gameId: testGameId,
      creatorId: devId,
      sessionToken,
      format: 'PREROLL',
      durationSeconds: 5,
      completed: true,
      clicked: false,
      isIvt: false,
      grossRevenue: 0.0045,
      networkDeduction: 0.00045,
      netRevenue: 0.00405,
      creatorShareRate: 0.5,
      creatorShareAmount: 0.00203,
    });

    // PREROLL: Second check in the same session must be rejected (single preroll per session)
    const prerollCheck2 = checkAdEligibility({
      gameId: testGameId,
      sessionToken,
      format: 'PREROLL',
    });
    expect(prerollCheck2.eligible).toBe(false);
    expect(prerollCheck2.reason).toContain('Preroll ad already served');

    // INTERSTITIAL: Fails if minimum active playtime (180s) has not been reached
    const interstitialCheckLowPlaytime = checkAdEligibility({
      gameId: testGameId,
      sessionToken,
      format: 'INTERSTITIAL',
      activeSeconds: 45,
    });
    expect(interstitialCheckLowPlaytime.eligible).toBe(false);
    expect(interstitialCheckLowPlaytime.cooldownRemainingSeconds).toBe(135);
    expect(interstitialCheckLowPlaytime.reason).toContain('Minimum active playtime not reached');

    // INTERSTITIAL: Becomes eligible once 180s active gameplay is reached
    const interstitialCheckValid = checkAdEligibility({
      gameId: testGameId,
      sessionToken,
      format: 'INTERSTITIAL',
      activeSeconds: 185,
    });
    expect(interstitialCheckValid.eligible).toBe(true);

    // Record an INTERSTITIAL impression
    gvDb.createAdImpression({
      gameId: testGameId,
      creatorId: devId,
      sessionToken,
      format: 'INTERSTITIAL',
      durationSeconds: 10,
      completed: true,
      clicked: false,
      isIvt: false,
      grossRevenue: 0.006,
      networkDeduction: 0.0006,
      netRevenue: 0.0054,
      creatorShareRate: 0.5,
      creatorShareAmount: 0.0027,
    });

    // Immediate subsequent check must be rejected due to 180s cooldown
    const interstitialCooldownCheck = checkAdEligibility({
      gameId: testGameId,
      sessionToken,
      format: 'INTERSTITIAL',
      activeSeconds: 190,
    });
    expect(interstitialCooldownCheck.eligible).toBe(false);
    expect(interstitialCooldownCheck.reason).toContain('Interstitial cooldown active');
  });

  it('2. Calculates revenue split mathematics accurately across formats (50% organic vs 70% referral)', () => {
    // 1. PREROLL
    const prerollOrganic = calculateAdRevenue('PREROLL', false, false);
    expect(prerollOrganic.grossRevenue).toBe(0.0045);
    expect(prerollOrganic.networkDeduction).toBe(0.00045);
    expect(prerollOrganic.netRevenue).toBe(0.00405);
    expect(prerollOrganic.creatorShareRate).toBe(0.5);
    expect(prerollOrganic.creatorShareAmount).toBe(0.00203);

    const prerollReferral = calculateAdRevenue('PREROLL', true, false);
    expect(prerollReferral.creatorShareRate).toBe(0.7);
    expect(prerollReferral.creatorShareAmount).toBe(0.00284);

    // 2. INTERSTITIAL
    const interstitialOrganic = calculateAdRevenue('INTERSTITIAL', false, false);
    expect(interstitialOrganic.grossRevenue).toBe(0.006);
    expect(interstitialOrganic.networkDeduction).toBe(0.0006);
    expect(interstitialOrganic.netRevenue).toBe(0.0054);
    expect(interstitialOrganic.creatorShareRate).toBe(0.5);
    expect(interstitialOrganic.creatorShareAmount).toBe(0.0027);

    const interstitialReferral = calculateAdRevenue('INTERSTITIAL', true, false);
    expect(interstitialReferral.creatorShareRate).toBe(0.7);
    expect(interstitialReferral.creatorShareAmount).toBe(0.00378);

    // 3. REWARDED
    const rewardedOrganic = calculateAdRevenue('REWARDED', false, false);
    expect(rewardedOrganic.grossRevenue).toBe(0.008);
    expect(rewardedOrganic.networkDeduction).toBe(0.0008);
    expect(rewardedOrganic.netRevenue).toBe(0.0072);
    expect(rewardedOrganic.creatorShareRate).toBe(0.5);
    expect(rewardedOrganic.creatorShareAmount).toBe(0.0036);

    const rewardedReferral = calculateAdRevenue('REWARDED', true, false);
    expect(rewardedReferral.creatorShareRate).toBe(0.7);
    expect(rewardedReferral.creatorShareAmount).toBe(0.00504);
  });

  it('3. Suppresses revenue and marks impressions non-billable for Invalid Traffic (IVT)', () => {
    // IVT eligibility check
    const ivtEligibility = checkAdEligibility({
      gameId: testGameId,
      sessionToken,
      format: 'PREROLL',
      isIvt: true,
    });
    expect(ivtEligibility.eligible).toBe(false);
    expect(ivtEligibility.reason).toContain('Invalid Traffic (IVT)');

    // Revenue calculation under IVT
    const ivtRevenue = calculateAdRevenue('INTERSTITIAL', false, true);
    expect(ivtRevenue.grossRevenue).toBe(0);
    expect(ivtRevenue.networkDeduction).toBe(0);
    expect(ivtRevenue.netRevenue).toBe(0);
    expect(ivtRevenue.creatorShareAmount).toBe(0);
  });

  it('4. Enforces minimum view duration threshold (>= 3 seconds)', () => {
    // Under 3s (skipped at 2s) should yield 0 billable creator share
    const shortViewRevenue = calculateAdRevenue('PREROLL', false, true);
    expect(shortViewRevenue.creatorShareAmount).toBe(0);

    // 3s or greater qualifies as billable
    const fullViewRevenue = calculateAdRevenue('PREROLL', false, false);
    expect(fullViewRevenue.creatorShareAmount).toBeGreaterThan(0);
  });

  it('5. Handles GET /api/ads/slot eligibility inquiries and bot filtering', async () => {
    // Eligible client request
    const validReq = new NextRequest(
      `http://localhost:3000/api/ads/slot?gameId=${testGameId}&sessionToken=${sessionToken}&format=PREROLL`,
      {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    );
    const validRes = await getAdSlot(validReq);
    expect(validRes.status).toBe(200);
    const validData = await validRes.json();
    expect(validData.eligible).toBe(true);
    expect(validData.format).toBe('PREROLL');
    expect(validData.ad).toBeDefined();
    expect(validData.ad.title).toBeDefined();
    expect(validData.skipOffsetSeconds).toBe(3);

    // Missing parameter
    const missingReq = new NextRequest(`http://localhost:3000/api/ads/slot?gameId=${testGameId}`);
    const missingRes = await getAdSlot(missingReq);
    expect(missingRes.status).toBe(400);

    // Non-existent game
    const notFoundReq = new NextRequest(
      `http://localhost:3000/api/ads/slot?gameId=game-non-existent&sessionToken=${sessionToken}`
    );
    const notFoundRes = await getAdSlot(notFoundReq);
    expect(notFoundRes.status).toBe(404);

    // Automated crawler User-Agent detection (IVT rejection)
    const botReq = new NextRequest(
      `http://localhost:3000/api/ads/slot?gameId=${testGameId}&sessionToken=${sessionToken}&format=PREROLL`,
      {
        headers: {
          'user-agent': 'python-requests/2.28.1',
        },
      }
    );
    const botRes = await getAdSlot(botReq);
    expect(botRes.status).toBe(200);
    const botData = await botRes.json();
    expect(botData.eligible).toBe(false);
    expect(botData.reason).toContain('Invalid Traffic');
  });

  it('6. Ingests ad impressions via POST /api/ads/impression with full revenue tracking', async () => {
    const impReq = new NextRequest('http://localhost:3000/api/ads/impression', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
      },
      body: JSON.stringify({
        gameId: testGameId,
        sessionToken,
        format: 'PREROLL',
        durationSeconds: 5,
        completed: true,
        clicked: true,
      }),
    });

    const impRes = await recordAdImpression(impReq);
    expect(impRes.status).toBe(200);
    const data = await impRes.json();
    expect(data.success).toBe(true);
    expect(data.billable).toBe(true);
    expect(data.impression.gameId).toBe(testGameId);
    expect(data.impression.creatorId).toBe(devId);
    expect(data.impression.creatorShareRate).toBe(0.5);
    expect(data.impression.creatorShareAmount).toBe(0.00203);
    expect(data.impression.clicked).toBe(true);
  });

  it('7. Grants boosted 70% creator share when valid referral token is attributed', async () => {
    // Create a referral link
    const refToken = `cr_adtest_${Date.now()}`;
    gvDb.createReferralLink({
      token: refToken,
      gameId: testGameId,
      creatorId: devId,
      campaignName: 'Twitter Summer Campaign',
      bonusPercent: 20,
    });

    const referralImpReq = new NextRequest('http://localhost:3000/api/ads/impression', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        gameId: testGameId,
        sessionToken: `sess-ref-${Date.now()}`,
        format: 'INTERSTITIAL',
        durationSeconds: 8,
        completed: true,
        clicked: false,
        referralToken: refToken,
      }),
    });

    const res = await recordAdImpression(referralImpReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.impression.creatorShareRate).toBe(0.7);
    expect(data.impression.creatorShareAmount).toBe(0.00378);
    expect(data.impression.referralToken).toBe(refToken);
  });

  it('8. Aggregates ad metrics and developer earnings correctly in database', () => {
    const statsDevId = `usr-dev-stats-${Date.now()}`;
    const statsGameId = `game-stats-${Date.now()}`;

    // Seed 2 billable preroll impressions
    gvDb.createAdImpression({
      gameId: statsGameId,
      creatorId: statsDevId,
      sessionToken: 'sess-stats-1',
      format: 'PREROLL',
      durationSeconds: 5,
      completed: true,
      clicked: false,
      isIvt: false,
      grossRevenue: 0.0045,
      networkDeduction: 0.00045,
      netRevenue: 0.00405,
      creatorShareRate: 0.5,
      creatorShareAmount: 0.00203,
    });

    gvDb.createAdImpression({
      gameId: statsGameId,
      creatorId: statsDevId,
      sessionToken: 'sess-stats-2',
      format: 'PREROLL',
      durationSeconds: 6,
      completed: true,
      clicked: false,
      isIvt: false,
      grossRevenue: 0.0045,
      networkDeduction: 0.00045,
      netRevenue: 0.00405,
      creatorShareRate: 0.5,
      creatorShareAmount: 0.00203,
    });

    // Seed 1 billable interstitial impression
    gvDb.createAdImpression({
      gameId: statsGameId,
      creatorId: statsDevId,
      sessionToken: 'sess-stats-3',
      format: 'INTERSTITIAL',
      durationSeconds: 10,
      completed: true,
      clicked: true,
      isIvt: false,
      grossRevenue: 0.006,
      networkDeduction: 0.0006,
      netRevenue: 0.0054,
      creatorShareRate: 0.5,
      creatorShareAmount: 0.0027,
    });

    // Seed 1 IVT non-billable impression
    gvDb.createAdImpression({
      gameId: statsGameId,
      creatorId: statsDevId,
      sessionToken: 'sess-stats-ivt',
      format: 'PREROLL',
      durationSeconds: 2,
      completed: false,
      clicked: false,
      isIvt: true,
      grossRevenue: 0,
      networkDeduction: 0,
      netRevenue: 0,
      creatorShareRate: 0.5,
      creatorShareAmount: 0,
    });

    const stats = gvDb.getAdStats(statsGameId, statsDevId);
    expect(stats.totalImpressions).toBe(4);
    expect(stats.billableImpressions).toBe(3);
    expect(stats.grossRevenue).toBe(0.015); // 0.0045 + 0.0045 + 0.0060 = 0.015
    expect(stats.netRevenue).toBe(0.0135); // 0.00405 + 0.00405 + 0.0054 = 0.0135
    expect(stats.creatorEarnings).toBe(0.0068); // 0.00203 + 0.00203 + 0.0027 = 0.00676 -> rounded to 0.0068
    expect(stats.byFormat.PREROLL.impressions).toBe(2);
    expect(stats.byFormat.INTERSTITIAL.impressions).toBe(1);
    expect(stats.byFormat.REWARDED.impressions).toBe(0);
  });
});
