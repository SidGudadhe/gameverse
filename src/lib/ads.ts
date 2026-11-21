import { AdFormat, AdImpression } from '../types';
import { gvDb } from './database';

export const AD_RATES: Record<AdFormat, { ecpm: number; ratePerImpression: number }> = {
  PREROLL: { ecpm: 4.5, ratePerImpression: 0.0045 },
  INTERSTITIAL: { ecpm: 6.0, ratePerImpression: 0.006 },
  REWARDED: { ecpm: 8.0, ratePerImpression: 0.008 },
  BONUS_REWARD: { ecpm: 8.5, ratePerImpression: 0.0085 },
  BANNER: { ecpm: 1.5, ratePerImpression: 0.0015 },
  NATIVE: { ecpm: 2.5, ratePerImpression: 0.0025 },
  DISPLAY: { ecpm: 2.0, ratePerImpression: 0.002 },
  SPONSORED_LISTING: { ecpm: 3.0, ratePerImpression: 0.003 },
};

export const AD_CONFIG = {
  NETWORK_FEE_RATE: 0.1, // 10% platform/network hosting & delivery fee
  STANDARD_CREATOR_SHARE_RATE: 0.5, // 50% net share for standard organic plays
  REFERRAL_CREATOR_SHARE_RATE: 0.7, // 70% net share for referral-attributed plays
  MIN_VIEW_DURATION_SECONDS: 3, // Minimum seconds to count as completed impression
  INTERSTITIAL_COOLDOWN_SECONDS: 180, // 180 seconds active gameplay threshold for unskippable
  SKIPPABLE_OFFSET_SECONDS: 10, // Skip unlocks after 10 seconds for game over restart / early levels
  REWARDED_COOLDOWN_SECONDS: 15, // 15 seconds cooldown between rewarded ad requests
};

export interface MockAdCreative {
  id: string;
  title: string;
  sponsorName: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  durationSeconds: number;
  skipOffsetSeconds: number; // 0 for unskippable, 10 for skippable midgame, 3 for preroll
  isUnskippable?: boolean;
  placementText?: string;
  rewardType?: 'EXTRA_LIFE' | 'COINS' | 'DOUBLE_REWARD' | 'NEXT_LIFE';
  rewardLabel?: string;
  stepFlow?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
}

export const MOCK_AD_CREATIVES: MockAdCreative[] = [
  {
    id: 'cr-hyperdrive',
    title: 'HyperDrive Ultra X10',
    sponsorName: 'HyperDrive Gear',
    headline: 'Next-Gen Wireless Low Latency Gaming Headset',
    description:
      'Immerse in 7.1 spatial audio with lossless 2.4GHz ultra-low latency connection. Engineered for competitive pro gaming.',
    ctaText: 'Shop Now',
    ctaUrl: 'https://example.com/hyperdrive',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 10,
    skipOffsetSeconds: 3,
  },
  {
    id: 'cr-quantum-cloud',
    title: 'Quantum Cloud AI Studio',
    sponsorName: 'Quantum AI Systems',
    headline: 'Generate Real-Time 3D Shaders & WebGL Worlds',
    description:
      'Empower your indie studio with generative asset pipelines, automated physics rigging, and instant CDN deployment.',
    ctaText: 'Start Free Trial',
    ctaUrl: 'https://example.com/quantum',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 12,
    skipOffsetSeconds: 3,
  },
  {
    id: 'cr-pixel-cola',
    title: 'PixelPulse Energy Drink',
    sponsorName: 'Pixel Labs Co.',
    headline: 'Zero Sugar, Pure Focus & Natural Electrolytes',
    description:
      'Formulated specifically for esports endurance. Zero crash, zero sugar, infused with neuro-vitamins for lightning reaction times.',
    ctaText: 'Claim 20% Off',
    ctaUrl: 'https://example.com/pixelpulse',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 8,
    skipOffsetSeconds: 3,
  },
  {
    id: 'cr-cyber-shield',
    title: 'CyberShield Gaming VPN',
    sponsorName: 'Aegis Security',
    headline: 'Eliminate Packet Loss & Protect Against DDoS',
    description:
      'Direct fiber optic gaming nodes across 90 countries. Stabilize your ping and safeguard your connection 24/7.',
    ctaText: 'Protect Your Ping',
    ctaUrl: 'https://example.com/cybershield',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 10,
    skipOffsetSeconds: 3,
  },
];

export function getRandomAdCreative(format: AdFormat, activeSeconds = 0): MockAdCreative {
  const randomIndex = Math.floor(Math.random() * MOCK_AD_CREATIVES.length);
  const creative: MockAdCreative = { ...MOCK_AD_CREATIVES[randomIndex] };

  if (format === 'PREROLL') {
    creative.durationSeconds = 8;
    creative.skipOffsetSeconds = 3; // Pre-roll runs through the 4-step sequence (3s skip threshold for tests)
    creative.placementText = '[ PRE-ROLL AD: 1. Game Load -> 2. Video Ad -> 3. Ad Complete -> 4. Game Start ]';
    creative.stepFlow = {
      step1: '1. Game load hona start hota hai.',
      step2: '2. Video advertisement show hota hai.',
      step3: '3. Advertisement complete hota hai.',
      step4: '4. Game start hota hai.',
    };
  } else if (format === 'INTERSTITIAL') {
    // 3-minute rule:
    // If game has been played for 3+ minutes (>= 180s), it is an UNSKIPPABLE ad!
    // If under 3 minutes (e.g. game over restart / early level), it is SKIPPABLE after 10s!
    if (activeSeconds >= AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS) {
      creative.isUnskippable = true;
      creative.skipOffsetSeconds = 0;
      creative.durationSeconds = 12;
      creative.placementText = '[ IN-GAME AD: Midgame / Interstitial Unskippable Ad (3+ Min Gameplay Natural Break) ]';
    } else {
      creative.isUnskippable = false;
      creative.skipOffsetSeconds = AD_CONFIG.SKIPPABLE_OFFSET_SECONDS; // Skip unlocked after 10s
      creative.durationSeconds = 15;
      creative.placementText = '[ IN-GAME AD: Midgame / Interstitial Skippable Ad (Skip available after 10s) ]';
    }
  } else if (format === 'REWARDED') {
    creative.isUnskippable = true;
    creative.skipOffsetSeconds = 0; // Rewarded ads must be watched in full
    creative.durationSeconds = 15;
    creative.rewardType = 'EXTRA_LIFE';
    creative.rewardLabel = 'Extra Life / Revive (Next Life • 3s Safe Shield)';
    creative.placementText = '[ IN-GAME REWARDED AD: Extra Life / Revive (1 Per Game Limit) ]';
  } else if (format === 'BONUS_REWARD') {
    creative.isUnskippable = true;
    creative.skipOffsetSeconds = 0;
    creative.durationSeconds = 15;
    creative.rewardType = 'DOUBLE_REWARD';
    creative.rewardLabel = 'Level Complete 2x Multiplier & Bonus Coins';
    creative.placementText = '[ IN-GAME BONUS REWARD AD: Level Complete 2x Reward Claim ]';
  } else if (format === 'BANNER') {
    creative.placementText = '[ IN-GAME BANNER AD: Main Menu / Lobby / Shop / Level Selection - 728x90 ]';
  } else if (format === 'NATIVE') {
    creative.placementText = '[ NATIVE AD: Sponsored Content In-Grid Promotion ]';
  } else if (format === 'DISPLAY') {
    creative.placementText = '[ DISPLAY AD: Website Display Advertisement ]';
  } else if (format === 'SPONSORED_LISTING') {
    creative.placementText = '[ SPONSORED LISTING: Top Search Partner Game ]';
  }

  return creative;
}

export function calculateAdRevenue(
  format: AdFormat,
  isReferral: boolean,
  isIvt = false
): {
  grossRevenue: number;
  networkDeduction: number;
  netRevenue: number;
  creatorShareRate: number;
  creatorShareAmount: number;
} {
  if (isIvt) {
    return {
      grossRevenue: 0,
      networkDeduction: 0,
      netRevenue: 0,
      creatorShareRate: isReferral ? AD_CONFIG.REFERRAL_CREATOR_SHARE_RATE : AD_CONFIG.STANDARD_CREATOR_SHARE_RATE,
      creatorShareAmount: 0,
    };
  }

  const rateConfig = AD_RATES[format] || AD_RATES.PREROLL;
  const grossRevenue = rateConfig.ratePerImpression;
  const networkDeduction = Math.round(grossRevenue * AD_CONFIG.NETWORK_FEE_RATE * 100000) / 100000;
  const netRevenue = Math.round((grossRevenue - networkDeduction) * 100000) / 100000;
  const creatorShareRate = isReferral ? AD_CONFIG.REFERRAL_CREATOR_SHARE_RATE : AD_CONFIG.STANDARD_CREATOR_SHARE_RATE;
  const creatorShareAmount = Math.round(netRevenue * creatorShareRate * 100000) / 100000;

  return {
    grossRevenue,
    networkDeduction,
    netRevenue,
    creatorShareRate,
    creatorShareAmount,
  };
}

export function checkAdEligibility(params: {
  gameId: string;
  sessionToken: string;
  format: AdFormat;
  activeSeconds?: number;
  isIvt?: boolean;
  isRestart?: boolean;
  isNextLevel?: boolean;
  hasUsedRevive?: boolean;
  trigger?: 'restart' | 'next_level' | 'game_over' | 'periodic' | 'manual' | string;
}): { eligible: boolean; cooldownRemainingSeconds: number; reason?: string; isUnskippable?: boolean } {
  const { sessionToken, format, activeSeconds = 0, isIvt = false, isRestart, isNextLevel, hasUsedRevive, trigger } = params;

  if (isIvt) {
    return {
      eligible: false,
      cooldownRemainingSeconds: 0,
      reason: 'Session flagged as Invalid Traffic (IVT). Monetization suppressed.',
    };
  }

  // PREROLL: 1 preroll per session start
  if (format === 'PREROLL') {
    const existingPreroll = gvDb.getRecentAdImpression(sessionToken, 'PREROLL');
    if (existingPreroll) {
      return {
        eligible: false,
        cooldownRemainingSeconds: 0,
        reason: 'Preroll ad already served for this active session.',
      };
    }
    return { eligible: true, cooldownRemainingSeconds: 0 };
  }

  // INTERSTITIAL (Midgame / Next Level / Game Over restart):
  // Rules:
  // 1. If restart / next level (second game / game over restart):
  //    - If activeSeconds >= 180s (3+ mins): Unskippable ad!
  //    - If activeSeconds < 180s (under 3 mins): Skippable ad after 10s!
  // 2. If standard during-gameplay check without restart/next-level:
  //    - Requires 180s active gameplay cooldown or minimum active playtime.
  if (format === 'INTERSTITIAL') {
    const isRestartOrNextLevel = Boolean(
      isRestart ||
      isNextLevel ||
      trigger === 'restart' ||
      trigger === 'next_level' ||
      trigger === 'game_over'
    );

    if (isRestartOrNextLevel) {
      const isUnskippable = activeSeconds >= AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS;

      // Minimum 15-second spam protection between consecutive midgame calls
      const existingInterstitial = gvDb.getRecentAdImpression(sessionToken, 'INTERSTITIAL');
      if (existingInterstitial) {
        const lastImpressionTime = new Date(existingInterstitial.createdAt).getTime();
        const elapsedSeconds = Math.floor((Date.now() - lastImpressionTime) / 1000);
        if (elapsedSeconds < 15) {
          return {
            eligible: false,
            cooldownRemainingSeconds: 15 - elapsedSeconds,
            reason: `Midgame cooldown active. Please wait ${15 - elapsedSeconds}s.`,
          };
        }
      }

      return {
        eligible: true,
        cooldownRemainingSeconds: 0,
        isUnskippable,
      };
    }

    // Standard during-gameplay interstitial (no restart / next-level trigger)
    const existingInterstitial = gvDb.getRecentAdImpression(sessionToken, 'INTERSTITIAL');
    if (existingInterstitial) {
      const lastImpressionTime = new Date(existingInterstitial.createdAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastImpressionTime) / 1000);
      if (elapsedSeconds < AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS) {
        return {
          eligible: false,
          cooldownRemainingSeconds: AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS - elapsedSeconds,
          reason: `Interstitial cooldown active. Please wait ${
            AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS - elapsedSeconds
          }s.`,
        };
      }
    } else {
      if (activeSeconds < AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS) {
        const remaining = AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS - activeSeconds;
        return {
          eligible: false,
          cooldownRemainingSeconds: remaining,
          reason: `Minimum active playtime not reached for interstitial (${activeSeconds}s / ${AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS}s).`,
        };
      }
    }

    return {
      eligible: true,
      cooldownRemainingSeconds: 0,
      isUnskippable: true,
    };
  }

  // REWARDED & BONUS_REWARD: Optional, user-initiated
  if (format === 'REWARDED' || format === 'BONUS_REWARD') {
    // 1 Next Life per game run limit
    if (format === 'REWARDED' && hasUsedRevive) {
      return {
        eligible: false,
        cooldownRemainingSeconds: 0,
        reason: 'Next Life already used in current game run. Only 1 revive permitted per game.',
      };
    }

    const existingRewarded = gvDb.getRecentAdImpression(sessionToken, format);
    if (existingRewarded) {
      const lastImpressionTime = new Date(existingRewarded.createdAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastImpressionTime) / 1000);
      if (elapsedSeconds < AD_CONFIG.REWARDED_COOLDOWN_SECONDS) {
        return {
          eligible: false,
          cooldownRemainingSeconds: AD_CONFIG.REWARDED_COOLDOWN_SECONDS - elapsedSeconds,
          reason: `Rewarded ad cooldown active. Please wait ${AD_CONFIG.REWARDED_COOLDOWN_SECONDS - elapsedSeconds}s.`,
        };
      }
    }
    return { eligible: true, cooldownRemainingSeconds: 0, isUnskippable: true };
  }

  return { eligible: true, cooldownRemainingSeconds: 0 };
}
