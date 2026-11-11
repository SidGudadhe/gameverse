import crypto from 'crypto';

/**
 * Generates an opaque, tamper-proof referral token.
 * Format: cr_[12-character random hex or hash]
 * Ensures no sensitive creator IDs or emails are leaked in URLs.
 */
export function generateReferralToken(customPrefix?: string): string {
  const randomBytes = crypto.randomBytes(6).toString('hex');
  const prefix = customPrefix ? customPrefix.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 4) : '';
  return prefix ? `cr_${prefix}_${randomBytes}` : `cr_${randomBytes}`;
}

/**
 * Validates whether a referral attribution is legitimate and eligible for creator bonus.
 * Defends against self-referral and tampering.
 */
export function validateReferralAttribution(params: {
  referralToken?: string;
  creatorId?: string;
  playerId?: string;
  ipHash?: string;
}): { isValid: boolean; reason?: string; bonusPercent: number } {
  const { referralToken, creatorId, playerId } = params;

  if (!referralToken || !referralToken.startsWith('cr_')) {
    return { isValid: false, reason: 'Invalid or missing referral token format', bonusPercent: 0 };
  }

  // 1. Anti-Fraud: Self-Referral Prevention
  // Creators are strictly prohibited from earning referral bonuses on their own gameplay.
  if (playerId && creatorId && playerId === creatorId) {
    return {
      isValid: false,
      reason: 'Self-referral prohibited: Creators cannot earn promotion bonuses on their own gameplay sessions.',
      bonusPercent: 0,
    };
  }

  return {
    isValid: true,
    bonusPercent: 20, // +20% bonus boost
  };
}

/**
 * Calculates Creator Net Revenue Share with tiered referral bonuses.
 * Standard creator share: 50%
 * Direct referral creator share: 70% (50% base + 20% direct promotion bonus)
 */
export function calculateCreatorRevenueShare(
  baseRate = 0.50,
  isReferralValid = false,
  bonusPercent = 20
): { shareRate: number; baseRate: number; bonusRate: number } {
  if (isReferralValid) {
    const bonusRate = bonusPercent / 100;
    const shareRate = Math.min(1.0, baseRate + bonusRate); // Up to 70% or 100% max
    return { shareRate, baseRate, bonusRate };
  }
  return { shareRate: baseRate, baseRate, bonusRate: 0 };
}

/**
 * Generates one-click social share links for Twitter, Reddit, WhatsApp, etc.
 */
export function generateSocialShareLinks(
  gameTitle: string,
  gameSlug: string,
  referralToken?: string,
  baseUrl = 'https://gameverse.com'
) {
  const referralParam = referralToken ? `?ref=${encodeURIComponent(referralToken)}` : '';
  const fullUrl = `${baseUrl}/game/${gameSlug}${referralParam}`;
  const shareText = `Play ${gameTitle} instantly in your browser on GameVerse! Zero downloads, instant 60 FPS gameplay:`;

  return {
    fullUrl,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(`Check out ${gameTitle} on GameVerse`)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`,
    discordCopyText: `🎮 **${gameTitle}** is playable free on GameVerse!\nPlay instantly: ${fullUrl}`,
  };
}
