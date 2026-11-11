import { gvDb } from './database';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'system',
  'gameverse',
  'support',
  'moderator',
  'mod',
  'api',
  'bot',
  'staff',
  'official',
]);

const PROFANITY_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|bastard|dick|pussy|cunt|nigger|faggot)\b/i,
  /\b(scam|cheat|hack|free robux|download link|bit\.ly|t\.co)\b/i,
];

/**
 * Validates player handle format and reserved status.
 */
export function validateUsername(username?: string): { valid: boolean; cleanUsername?: string; reason?: string } {
  if (!username) {
    return { valid: false, reason: 'Username is required.' };
  }

  const clean = username.trim().replace(/^@/, '');

  if (clean.length < 3 || clean.length > 20) {
    return { valid: false, reason: 'Username must be between 3 and 20 characters.' };
  }

  if (!USERNAME_REGEX.test(clean)) {
    return {
      valid: false,
      reason: 'Username can only contain alphanumeric characters and underscores (a-z, 0-9, _).',
    };
  }

  if (RESERVED_USERNAMES.has(clean.toLowerCase())) {
    return { valid: false, reason: `Username "${clean}" is reserved by the platform.` };
  }

  return { valid: true, cleanUsername: clean };
}

/**
 * Moderates review commentary for length, repetitive spam, and offensive language.
 */
export function moderateReviewContent(comment?: string): { approved: boolean; reason?: string } {
  if (!comment || comment.trim().length < 5) {
    return { approved: false, reason: 'Review commentary must be at least 5 characters.' };
  }

  const clean = comment.trim();

  if (clean.length > 1000) {
    return { approved: false, reason: 'Review commentary cannot exceed 1000 characters.' };
  }

  // Detect spam (e.g. "aaaaa" or single char repeated > 10 times)
  if (/(.)\1{9,}/.test(clean)) {
    return { approved: false, reason: 'Review commentary contains excessive repetitive characters.' };
  }

  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(clean)) {
      return { approved: false, reason: 'Review contains prohibited language or spam links.' };
    }
  }

  return { approved: true };
}

/**
 * Evaluates whether a player qualifies for the Verified Player badge on a game.
 * Requires at least 60 active seconds of recorded gameplay.
 */
export function checkPlayerVerification(userId: string, gameId: string): boolean {
  const activeSeconds = gvDb.getTotalPlaytimeForGame(userId, gameId);
  return activeSeconds >= 60;
}
