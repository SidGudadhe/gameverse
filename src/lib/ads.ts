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

export const IN_GAME_AD_FORMATS: AdFormat[] = [
  'PREROLL',
  'INTERSTITIAL',
  'REWARDED',
  'BONUS_REWARD',
  'BANNER',
];

export const WEBSITE_OUTER_AD_FORMATS: AdFormat[] = [
  'NATIVE',
  'DISPLAY',
  'SPONSORED_LISTING',
];

export function isInGameAdFormat(format: AdFormat): boolean {
  return IN_GAME_AD_FORMATS.includes(format);
}

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
  domain?: string;
  rating?: number;
  badge?: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  videoUrl?: string;
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
    id: 'cr-razer-blackshark',
    title: 'Razer BlackShark V2 Pro',
    sponsorName: 'Razer Inc.',
    domain: 'razer.com',
    rating: 4.9,
    badge: 'Pro Esports Audio',
    headline: 'Razer BlackShark V2 Pro — Wireless Esports Gaming Headset',
    description:
      'Engineered with TriForce Titanium 50mm drivers and ultra-wideband microphone. Zero-latency 2.4GHz wireless audio built for competitive champions.',
    ctaText: 'Shop Now',
    ctaUrl: 'https://razer.com',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 10,
    skipOffsetSeconds: 3,
  },
  {
    id: 'cr-samsung-odyssey',
    title: 'Samsung Odyssey Neo G9',
    sponsorName: 'Samsung Electronics',
    domain: 'samsung.com',
    rating: 4.8,
    badge: 'Dual QHD Ultra-Wide',
    headline: 'Samsung Odyssey Neo G9 — 49" 240Hz Curved Gaming Monitor',
    description:
      'Immerse deeper with Quantum Mini-LED technology, 1000R curved display, and 1ms response time for boundary-pushing esports visuals.',
    ctaText: 'Explore Display',
    ctaUrl: 'https://samsung.com',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 12,
    skipOffsetSeconds: 3,
  },
  {
    id: 'cr-spotify-premium',
    title: 'Spotify Premium for Gamers',
    sponsorName: 'Spotify',
    domain: 'spotify.com',
    rating: 4.9,
    badge: 'Ad-Free Gaming Playlists',
    headline: 'Spotify Premium — Game to High-Tempo Soundtracks with No Ads',
    description:
      'Millions of gaming OSTs, synthwave tracks, and lo-fi beats in crystal-clear audio. Unlimited skips and zero ad interruptions while gaming.',
    ctaText: 'Try 3 Months Free',
    ctaUrl: 'https://spotify.com',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 8,
    skipOffsetSeconds: 3,
  },
  {
    id: 'cr-nord-vpn',
    title: 'NordVPN Gaming Shield',
    sponsorName: 'Nord Security',
    domain: 'nordvpn.com',
    rating: 4.9,
    badge: 'DDoS Defense & Stable Ping',
    headline: 'NordVPN — Stabilize Gaming Ping & Prevent ISP Bandwidth Throttling',
    description:
      'Next-gen NordLynx protocol with 6,400+ servers globally. Eliminate latency spikes and shield your home IP from competitive DDoS attacks.',
    ctaText: 'Get 70% Off + 3 Mo',
    ctaUrl: 'https://nordvpn.com',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 10,
    skipOffsetSeconds: 3,
  },
  {
    id: 'cr-playstation-5',
    title: 'PlayStation 5 Pro',
    sponsorName: 'Sony Interactive Entertainment',
    domain: 'playstation.com',
    rating: 4.9,
    badge: 'Next-Gen Visual Fidelity',
    headline: 'PlayStation 5 Pro — 4K 120FPS with Advanced Ray Tracing',
    description:
      'Experience Spectral Super Resolution, ultra-responsive DualSense haptic feedback, and lightning-fast custom 2TB SSD gaming performance.',
    ctaText: 'Discover PS5 Pro',
    ctaUrl: 'https://playstation.com',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 12,
    skipOffsetSeconds: 3,
  },
  {
    id: 'cr-discord-nitro',
    title: 'Discord Nitro',
    sponsorName: 'Discord',
    domain: 'discord.com',
    rating: 4.8,
    badge: 'All-In-One Gamer Pass',
    headline: 'Discord Nitro — 4K 60FPS Streaming, 500MB Uploads & Soundboard Perks',
    description:
      'Level up your voice chat with custom animated emojis, custom profiles across servers, HD screen sharing, and 2 Free Server Boosts.',
    ctaText: 'Upgrade to Nitro',
    ctaUrl: 'https://discord.com',
    imageUrl: '/images/placeholders/banner.png',
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
  // Developers ONLY earn revenue share % from In-Game Ads; website outer ads yield 0% creator share.
  const eligibleForCreatorShare = isInGameAdFormat(format);
  const baseShareRate = !eligibleForCreatorShare
    ? 0
    : isReferral
    ? AD_CONFIG.REFERRAL_CREATOR_SHARE_RATE
    : AD_CONFIG.STANDARD_CREATOR_SHARE_RATE;

  if (isIvt) {
    return {
      grossRevenue: 0,
      networkDeduction: 0,
      netRevenue: 0,
      creatorShareRate: baseShareRate,
      creatorShareAmount: 0,
    };
  }

  const rateConfig = AD_RATES[format] || AD_RATES.PREROLL;
  const grossRevenue = rateConfig.ratePerImpression;
  const networkDeduction = Math.round(grossRevenue * AD_CONFIG.NETWORK_FEE_RATE * 100000) / 100000;
  const netRevenue = Math.round((grossRevenue - networkDeduction) * 100000) / 100000;
  const creatorShareRate = baseShareRate;
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
