import { describe, it, expect, beforeEach } from 'vitest';
import { gvDb } from '../src/lib/database';
import {
  getRandomAdCreative,
  checkAdEligibility,
  calculateAdRevenue,
  AD_RATES,
  AD_CONFIG,
} from '../src/lib/ads';
import { AdFormat } from '../src/types';

describe('100x Deep Ads System & Placements Verification', () => {
  const testGameId = 'game-cyber-runner-2077';
  const testSession = `test-sess-${Date.now()}`;

  describe('1. Pre-Roll Ad: 4-Step Sequence Verification', () => {
    it('should generate pre-roll ad with complete 4-step execution flow', () => {
      const ad = getRandomAdCreative('PREROLL');
      expect(ad).toBeDefined();
      expect(ad.placementText).toContain('PRE-ROLL AD: 1. Game Load -> 2. Video Ad -> 3. Ad Complete -> 4. Game Start');
      expect(ad.stepFlow).toBeDefined();
      expect(ad.stepFlow?.step1).toBe('1. Game load hona start hota hai.');
      expect(ad.stepFlow?.step2).toBe('2. Video advertisement show hota hai.');
      expect(ad.stepFlow?.step3).toBe('3. Advertisement complete hota hai.');
      expect(ad.stepFlow?.step4).toBe('4. Game start hota hai.');
    });

    it('should enforce only 1 pre-roll ad per session initialization', () => {
      const firstCheck = checkAdEligibility({
        gameId: testGameId,
        sessionToken: testSession,
        format: 'PREROLL',
      });
      expect(firstCheck.eligible).toBe(true);

      // Record first preroll impression
      gvDb.createAdImpression({
        gameId: testGameId,
        creatorId: 'dev-alpha',
        sessionToken: testSession,
        format: 'PREROLL',
        durationSeconds: 8,
        completed: true,
        clicked: false,
        isIvt: false,
        grossRevenue: 0.0045,
        networkDeduction: 0.00045,
        netRevenue: 0.00405,
        creatorShareRate: 0.5,
        creatorShareAmount: 0.00203,
      });

      const secondCheck = checkAdEligibility({
        gameId: testGameId,
        sessionToken: testSession,
        format: 'PREROLL',
      });
      expect(secondCheck.eligible).toBe(false);
      expect(secondCheck.reason).toContain('Preroll ad already served');
    });
  });

  describe('2. Midgame / Interstitial 3-Minute Rule Verification', () => {
    it('should configure UNSKIPPABLE ad when active playtime is 3+ minutes (>= 180s)', () => {
      const ad = getRandomAdCreative('INTERSTITIAL', 190);
      expect(ad.isUnskippable).toBe(true);
      expect(ad.skipOffsetSeconds).toBe(0);
      expect(ad.placementText).toContain('Midgame / Interstitial Unskippable Ad (3+ Min Gameplay Natural Break)');

      const eligibility = checkAdEligibility({
        gameId: testGameId,
        sessionToken: `sess-3min-${Date.now()}`,
        format: 'INTERSTITIAL',
        activeSeconds: 200,
      });
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.isUnskippable).toBe(true);
    });

    it('should configure SKIPPABLE ad AFTER 10 SECONDS when active playtime is under 3 minutes (e.g. game over restart)', () => {
      const ad = getRandomAdCreative('INTERSTITIAL', 45); // 45 seconds of play before game over
      expect(ad.isUnskippable).toBe(false);
      expect(ad.skipOffsetSeconds).toBe(10); // Skip unlocked after 10 seconds
      expect(ad.placementText).toContain('Midgame / Interstitial Skippable Ad (Skip available after 10s)');

      const eligibility = checkAdEligibility({
        gameId: testGameId,
        sessionToken: `sess-under3min-${Date.now()}`,
        format: 'INTERSTITIAL',
        activeSeconds: 45,
        isRestart: true,
      });
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.isUnskippable).toBe(false);
    });
  });

  describe('3. In-Game Rewarded Ads & Bonus Reward Ads (Coins / Life)', () => {
    it('should configure unskippable rewarded ads for Next Life without fixed coins and with 3s shield', () => {
      const ad = getRandomAdCreative('REWARDED');
      expect(ad.isUnskippable).toBe(true);
      expect(ad.skipOffsetSeconds).toBe(0);
      expect(ad.rewardType).toBe('EXTRA_LIFE');
      expect(ad.rewardLabel).toContain('Extra Life / Revive (Next Life • 3s Safe Shield)');
      expect(ad.placementText).toContain('IN-GAME REWARDED AD: Extra Life / Revive (1 Per Game Limit)');
    });

    it('should enforce 1 Next Life per game run limit', () => {
      // First attempt in game run: eligible
      const check1 = checkAdEligibility({
        gameId: testGameId,
        sessionToken: `sess-revive-${Date.now()}`,
        format: 'REWARDED',
        hasUsedRevive: false,
      });
      expect(check1.eligible).toBe(true);

      // Second attempt in same run: rejected due to 1-per-game limit
      const check2 = checkAdEligibility({
        gameId: testGameId,
        sessionToken: `sess-revive-${Date.now()}`,
        format: 'REWARDED',
        hasUsedRevive: true,
      });
      expect(check2.eligible).toBe(false);
      expect(check2.reason).toContain('Next Life already used in current game run');
    });

    it('should configure level complete 2x bonus reward ads', () => {
      const ad = getRandomAdCreative('BONUS_REWARD');
      expect(ad.isUnskippable).toBe(true);
      expect(ad.skipOffsetSeconds).toBe(0);
      expect(ad.rewardType).toBe('DOUBLE_REWARD');
      expect(ad.placementText).toContain('IN-GAME BONUS REWARD AD: Level Complete 2x Reward Claim');
    });
  });

  describe('4. In-Game Placement C: In-Game Banner Ad (Lobby / Menu / Shop)', () => {
    it('should generate in-game banner ad metadata for lobby and menu screens', () => {
      const ad = getRandomAdCreative('BANNER');
      expect(ad.placementText).toContain('IN-GAME BANNER AD: Main Menu / Lobby / Shop / Level Selection - 728x90');
    });
  });

  describe('5. Website Outer Ad Formats & Revenue Calculation', () => {
    const allFormats: AdFormat[] = [
      'PREROLL',
      'INTERSTITIAL',
      'REWARDED',
      'BONUS_REWARD',
      'BANNER',
      'NATIVE',
      'DISPLAY',
      'SPONSORED_LISTING',
    ];

    it('should have valid ecpm and revenue rates configured for all ad placements', () => {
      for (const fmt of allFormats) {
        expect(AD_RATES[fmt]).toBeDefined();
        expect(AD_RATES[fmt].ecpm).toBeGreaterThan(0);
        expect(AD_RATES[fmt].ratePerImpression).toBeGreaterThan(0);

        const rev = calculateAdRevenue(fmt, false, false);
        expect(rev.grossRevenue).toBeGreaterThan(0);
        expect(rev.netRevenue).toBeGreaterThan(0);
        expect(rev.creatorShareAmount).toBeGreaterThan(0);
        expect(rev.creatorShareRate).toBe(0.5); // 50% standard share
      }
    });

    it('should grant 70% enhanced creator revenue share for referral-attributed impressions', () => {
      const rev = calculateAdRevenue('INTERSTITIAL', true, false);
      expect(rev.creatorShareRate).toBe(0.7);
      expect(rev.creatorShareAmount).toBeCloseTo(rev.netRevenue * 0.7, 5);
    });

    it('should suppress revenue and zero-out creator earnings on Invalid Traffic (IVT / Bots)', () => {
      const rev = calculateAdRevenue('PREROLL', false, true);
      expect(rev.grossRevenue).toBe(0);
      expect(rev.netRevenue).toBe(0);
      expect(rev.creatorShareAmount).toBe(0);
    });
  });

  describe('6. Database byFormat Aggregation Across All Formats', () => {
    it('should aggregate impressions across all 8 formats without runtime errors', () => {
      const stats = gvDb.getAdStats();
      expect(stats).toBeDefined();
      expect(stats.byFormat).toBeDefined();
      expect(stats.byFormat.PREROLL).toBeDefined();
      expect(stats.byFormat.INTERSTITIAL).toBeDefined();
      expect(stats.byFormat.REWARDED).toBeDefined();
      expect(stats.byFormat.BONUS_REWARD).toBeDefined();
      expect(stats.byFormat.BANNER).toBeDefined();
      expect(stats.byFormat.NATIVE).toBeDefined();
      expect(stats.byFormat.DISPLAY).toBeDefined();
      expect(stats.byFormat.SPONSORED_LISTING).toBeDefined();
    });
  });
});
