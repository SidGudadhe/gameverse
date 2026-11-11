import { gvDb } from './database';
import { recordAuditLog } from './audit';

export interface BetaInvitation {
  token: string;
  studioName?: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
}

export const OFFICIAL_BETA_TOKENS: BetaInvitation[] = [
  {
    token: 'BETA-CREATOR-2026',
    studioName: 'General Creator Beta Cohort',
    maxUses: 100,
    usedCount: 12,
    expiresAt: '2026-12-31T23:59:59.000Z',
    active: true,
  },
  {
    token: 'BETA-PIXELFORGE-01',
    studioName: 'PixelForge Studios Partner',
    maxUses: 5,
    usedCount: 1,
    expiresAt: '2026-12-31T23:59:59.000Z',
    active: true,
  },
  {
    token: 'BETA-VOXEL-DUNGEON',
    studioName: 'Voxel Games LLC Partner',
    maxUses: 5,
    usedCount: 1,
    expiresAt: '2026-12-31T23:59:59.000Z',
    active: true,
  },
  {
    token: 'BETA-INDIE-STUDIO',
    studioName: 'Indie Pioneer Program',
    maxUses: 20,
    usedCount: 4,
    expiresAt: '2026-12-31T23:59:59.000Z',
    active: true,
  },
  {
    token: 'BETA-EARLY-ACCESS',
    studioName: 'Community Game Jam Winners',
    maxUses: 50,
    usedCount: 7,
    expiresAt: '2026-12-31T23:59:59.000Z',
    active: true,
  },
];

/**
 * Validates a creator beta access invitation code.
 */
export function verifyBetaInvitation(token: string): {
  valid: boolean;
  invitation?: BetaInvitation;
  error?: string;
} {
  const clean = (token || '').trim().toUpperCase();
  const invitation = OFFICIAL_BETA_TOKENS.find((b) => b.token === clean);

  if (!invitation) {
    return { valid: false, error: 'Invalid beta invitation code.' };
  }

  if (!invitation.active) {
    return { valid: false, error: 'This beta invitation program is no longer active.' };
  }

  if (new Date(invitation.expiresAt).getTime() < Date.now()) {
    return { valid: false, error: 'This beta invitation code has expired.' };
  }

  if (invitation.usedCount >= invitation.maxUses) {
    return { valid: false, error: 'This beta invitation code has reached its maximum redemptions.' };
  }

  return { valid: true, invitation };
}

/**
 * Claims a beta invitation for a developer studio.
 */
export function claimBetaInvitation(
  token: string,
  userId: string
): { success: boolean; studioName?: string; error?: string } {
  const check = verifyBetaInvitation(token);
  if (!check.valid || !check.invitation) {
    return { success: false, error: check.error };
  }

  const user = gvDb.findUserById(userId);
  if (!user) {
    return { success: false, error: 'Developer account not found.' };
  }

  // Increment redemption counter
  check.invitation.usedCount++;

  // Record audit log
  recordAuditLog({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'BETA_CREATOR_CLAIMED',
    targetType: 'DEVELOPER_STUDIO',
    targetId: user.id,
    details: {
      token: check.invitation.token,
      studioName: check.invitation.studioName,
      remainingRedemptions: check.invitation.maxUses - check.invitation.usedCount,
    },
  });

  return {
    success: true,
    studioName: check.invitation.studioName,
  };
}
