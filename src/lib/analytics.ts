import crypto from 'crypto';

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /crawling/i,
  /curl/i,
  /wget/i,
  /python/i,
  /urllib/i,
  /requests/i,
  /postman/i,
  /headless/i,
  /puppeteer/i,
  /selenium/i,
  /playwright/i,
  /phantomjs/i,
  /lighthouse/i,
];

const IP_SALT = process.env.ANALYTICS_SALT || 'gameverse-telemetry-salt-2026';

/**
 * Detects whether incoming request is from a known bot, crawler, or automated script.
 */
export function detectBot(userAgent?: string | null): { isBot: boolean; reason?: string } {
  if (!userAgent || userAgent.trim() === '') {
    return { isBot: true, reason: 'Empty or missing User-Agent header' };
  }

  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { isBot: true, reason: `Matched bot signature: ${pattern.source}` };
    }
  }

  return { isBot: false };
}

/**
 * Securely hashes an IP address using SHA-256 for privacy compliance (GDPR/DPDP).
 */
export function hashIpAddress(ip?: string | null): string {
  const cleanIp = ip ? ip.split(',')[0].trim() : '127.0.0.1';
  return crypto.createHash('sha256').update(`${cleanIp}:${IP_SALT}`).digest('hex');
}

/**
 * Validates heartbeat active gameplay delta.
 * Protects against clients forging artificially high active play seconds.
 */
export function validateHeartbeat(
  prevActiveSeconds: number,
  currentActiveSeconds: number,
  maxAllowedDelta = 60
): { isValid: boolean; reason?: string } {
  if (currentActiveSeconds < prevActiveSeconds) {
    return {
      isValid: false,
      reason: `Negative playtime anomaly: current (${currentActiveSeconds}s) < previous (${prevActiveSeconds}s)`,
    };
  }

  const delta = currentActiveSeconds - prevActiveSeconds;
  if (delta > maxAllowedDelta) {
    return {
      isValid: false,
      reason: `Excessive playtime delta anomaly: +${delta}s exceeds maximum threshold of ${maxAllowedDelta}s`,
    };
  }

  return { isValid: true };
}

/**
 * Checks if a session qualifies for verified developer monetization credit.
 * Minimum threshold: 10 active gameplay seconds and zero IVT flags.
 */
export function isEligibleForMonetization(activeSeconds: number, isIvt?: boolean): boolean {
  if (isIvt) return false;
  return activeSeconds >= 10;
}
