import crypto from 'crypto';
import { gvDb } from './database';
import { recordAuditLog } from './audit';
import { CookieConsentPreferences } from '../types';

export const COMPLIANCE_FRAMEWORKS = [
  'General Data Protection Regulation (GDPR) Regulation (EU) 2016/679',
  'Digital Personal Data Protection Act 2023 (India DPDP)',
  'California Consumer Privacy Act (CCPA) / CPRA',
];

export interface DataExportPackage {
  exportMetadata: {
    exportId: string;
    generatedAt: string;
    dataSubjectId: string;
    complianceStandards: string[];
    format: string;
    integrityChecksumSha256: string;
  };
  account: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
  };
  profile: Record<string, any> | null;
  playerData: {
    favoritesCount: number;
    favorites: any[];
    playHistoryCount: number;
    playHistory: any[];
    reviewsCount: number;
    reviews: any[];
  };
  creatorData?: {
    gamesCount: number;
    games: any[];
    payoutSettings: any | null;
    financialRecordsCount: number;
    financialRecords: any[];
  };
  auditHistory: any[];
}

/**
 * Generates a full, machine-readable JSON data archive for a data subject under
 * GDPR Article 15/20 and India DPDP Section 11.
 */
export function exportUserData(userId: string): DataExportPackage {
  const user = gvDb.getUserById(userId);
  if (!user) {
    throw new Error(`Data Subject not found: ${userId}`);
  }

  const profile = gvDb.getProfileByUserId(userId);
  const favorites = gvDb.getPlayerFavorites(userId);
  const playHistory = gvDb.getPlayerHistory(userId);
  const reviews = gvDb.state.reviews.filter((r) => r.userId === userId);

  // If creator, fetch developer assets
  let creatorData: DataExportPackage['creatorData'] | undefined;
  if (user.role === 'DEVELOPER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    const games = gvDb.state.games.filter((g) => g.developerId === userId);
    const payoutSettings = gvDb.getDeveloperSettings(userId);
    const financialRecords = gvDb.state.financialRecords.filter((r) => r.creatorId === userId);
    creatorData = {
      gamesCount: games.length,
      games,
      payoutSettings: payoutSettings || null,
      financialRecordsCount: financialRecords.length,
      financialRecords,
    };
  }

  // Audit logs related to this user
  const auditLogs = gvDb.state.auditLogs.filter(
    (l) => l.actorId === userId || l.targetId === userId
  );

  const exportId = `dsar-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const generatedAt = new Date().toISOString();

  // Redact security sensitive raw credentials
  const accountData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    twoFactorEnabled: !!user.twoFactorEnabled,
    createdAt: user.createdAt,
  };

  const payloadToHash = JSON.stringify({
    exportId,
    account: accountData,
    profile,
    favorites,
    playHistory,
    reviews,
  });

  const integrityChecksumSha256 = crypto
    .createHash('sha256')
    .update(payloadToHash)
    .digest('hex');

  // Record audit log for the DSAR request
  recordAuditLog({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    actorEmail: user.email,
    action: 'PRIVACY_DATA_EXPORT_DSAR',
    targetType: 'USER',
    targetId: user.id,
    details: {
      exportId,
      standards: COMPLIANCE_FRAMEWORKS,
      checksum: integrityChecksumSha256,
    },
  });

  return {
    exportMetadata: {
      exportId,
      generatedAt,
      dataSubjectId: user.id,
      complianceStandards: COMPLIANCE_FRAMEWORKS,
      format: 'JSON - Machine Readable Data Subject Archive',
      integrityChecksumSha256,
    },
    account: accountData,
    profile: profile || null,
    playerData: {
      favoritesCount: favorites.length,
      favorites,
      playHistoryCount: playHistory.length,
      playHistory,
      reviewsCount: reviews.length,
      reviews,
    },
    creatorData,
    auditHistory: auditLogs,
  };
}

/**
 * Executes Right to Erasure / Account Anonymization under GDPR Article 17 and India DPDP Section 12.
 * Anonymizes PII, deletes tokens/sessions, and pseudonymizes review authors to preserve platform integrity.
 */
export function eraseUserData(
  userId: string,
  requestedBy: { id: string; name: string; role: any }
): { success: boolean; message: string; erasedUserId: string } {
  const user = gvDb.getUserById(userId);
  if (!user) {
    throw new Error(`User to erase not found: ${userId}`);
  }

  const anonymizedSuffix = crypto.randomBytes(4).toString('hex');
  const originalEmail = user.email;

  // 1. Anonymize user record
  user.name = 'Anonymized Player';
  user.email = `erased-${anonymizedSuffix}@privacy.gameverse.local`;
  user.passwordHash = 'ERASED_ACCOUNT_DEACTIVATED';
  user.twoFactorEnabled = false;
  delete user.twoFactorSecret;
  delete user.avatarUrl;

  // 2. Anonymize or wipe profile
  const profileIndex = gvDb.state.profiles.findIndex((p) => p.userId === userId);
  if (profileIndex >= 0) {
    gvDb.state.profiles[profileIndex] = {
      id: gvDb.state.profiles[profileIndex].id,
      userId,
      username: `deleted_user_${anonymizedSuffix}`,
      displayName: 'Deleted User',
      avatarUrl: undefined,
      bio: undefined,
      studioName: undefined,
      website: undefined,
      portfolioUrl: undefined,
      favoriteGenre: undefined,
      updatedAt: new Date().toISOString(),
    };
  }

  // 3. Wipe personal favorites and play history
  gvDb.state.favorites = gvDb.state.favorites.filter((f) => f.userId !== userId);
  gvDb.state.playHistory = gvDb.state.playHistory.filter((h) => h.userId !== userId);

  // 4. Pseudonymize reviews: preserve game review ratings & commentary for public game integrity,
  // but detach user identity completely
  gvDb.state.reviews.forEach((review) => {
    if (review.userId === userId) {
      review.userId = 'ANONYMIZED_USER';
      review.username = 'deleted_user';
      review.displayName = 'Anonymous Player';
      delete review.userAvatar;
    }
  });

  // 5. Invalidate verification and password reset tokens
  gvDb.state.resetTokens = gvDb.state.resetTokens.filter((t) => t.email !== originalEmail);
  gvDb.state.verificationTokens = gvDb.state.verificationTokens.filter(
    (t) => t.userId !== userId
  );

  // 6. Record tamper-evident audit log
  recordAuditLog({
    actorId: requestedBy.id,
    actorName: requestedBy.name,
    actorRole: requestedBy.role,
    action: 'PRIVACY_RIGHT_TO_ERASURE',
    targetType: 'USER',
    targetId: userId,
    details: {
      anonymizedSuffix,
      reason: 'Data Subject Right to Erasure (GDPR Art. 17 / DPDP Sec. 12)',
      anonymizedEmail: user.email,
    },
  });

  gvDb.persistState();

  return {
    success: true,
    message:
      'User personal data successfully anonymized and erased in compliance with GDPR Article 17 and DPDP Section 12.',
    erasedUserId: userId,
  };
}

/**
 * Returns default cookie & consent settings.
 */
export function getDefaultConsentPreferences(): CookieConsentPreferences {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
    version: '2026.1',
  };
}
