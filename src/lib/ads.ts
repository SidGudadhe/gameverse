import { AdFormat, AdImpression } from '../types';
import { gvDb } from './database';

export const AD_RATES: Record<AdFormat, { ecpm: number; ratePerImpression: number }> = {
  PREROLL: { ecpm: 4.5, ratePerImpression: 0.0045 },
  INTERSTITIAL: { ecpm: 6.0, ratePerImpression: 0.006 },
  REWARDED: { ecpm: 8.0, ratePerImpression: 0.008 },
};

export const AD_CONFIG = {
  NETWORK_FEE_RATE: 0.1, // 10% platform/network hosting & delivery fee
  STANDARD_CREATOR_SHARE_RATE: 0.5, // 50% net share for standard organic plays
  REFERRAL_CREATOR_SHARE_RATE: 0.7, // 70% net share for referral-attributed plays
  MIN_VIEW_DURATION_SECONDS: 3, // Minimum seconds to count as completed impression
  INTERSTITIAL_COOLDOWN_SECONDS: 180, // 180 seconds active gameplay between interstitials
  REWARDED_COOLDOWN_SECONDS: 60, // 60 seconds cooldown between rewarded ad requests
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
  skipOffsetSeconds: number; // 0 for rewarded (unskippable)
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

export function getRandomAdCreative(format: AdFormat): MockAdCreative {
  const randomIndex = Math.floor(Math.random() * MOCK_AD_CREATIVES.length);
  const creative = { ...MOCK_AD_CREATIVES[randomIndex] };
  if (format === 'REWARDED') {
    creative.skipOffsetSeconds = 0; // Rewarded ads must be watched in full
    creative.durationSeconds = 15;
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
}): { eligible: boolean; cooldownRemainingSeconds: number; reason?: string } {
  const { sessionToken, format, activeSeconds = 0, isIvt = false } = params;

  if (isIvt) {
    return {
      eligible: false,
      cooldownRemainingSeconds: 0,
      reason: 'Session flagged as Invalid Traffic (IVT). Monetization suppressed.',
    };
  }

  // PREROLL: Only 1 preroll permitted per session start
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

  // INTERSTITIAL: 180 seconds active gameplay cooldown between impressions
  if (format === 'INTERSTITIAL') {
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
      // If no interstitial was served yet, enforce minimum active gameplay time before first interstitial
      if (activeSeconds < AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS) {
        const remaining = AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS - activeSeconds;
        return {
          eligible: false,
          cooldownRemainingSeconds: remaining,
          reason: `Minimum active playtime not reached for interstitial (${activeSeconds}s / ${AD_CONFIG.INTERSTITIAL_COOLDOWN_SECONDS}s).`,
        };
      }
    }
    return { eligible: true, cooldownRemainingSeconds: 0 };
  }

  // REWARDED: Optional, user-initiated, 60s cooldown between claims
  if (format === 'REWARDED') {
    const existingRewarded = gvDb.getRecentAdImpression(sessionToken, 'REWARDED');
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
    return { eligible: true, cooldownRemainingSeconds: 0 };
  }

  return { eligible: true, cooldownRemainingSeconds: 0 };
}
