export type UserRole =
  | 'GUEST'
  | 'PLAYER'
  | 'DEVELOPER'
  | 'MODERATOR'
  | 'FINANCE'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export type GameStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'SECURITY_REVIEW'
  | 'QA_TESTING'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'UNPUBLISHED';

export type AIDisclosure = 'NONE_HUMAN_ONLY' | 'AI_ASSISTED' | 'AI_GENERATED';

export type Orientation = 'LANDSCAPE' | 'PORTRAIT' | 'ANY';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  createdAt: string;
}

export interface CreatorAgreement {
  id: string;
  userId: string;
  agreementVersion: string;
  acceptedAt: string;
  ipAddress: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  count?: number;
}

export interface GameVersion {
  id: string;
  gameId: string;
  versionNumber: string;
  changelog: string;
  entryFile: string;
  archiveChecksum: string;
  archiveSizeBytes: number;
  status: GameStatus;
  scanResults: {
    passed: boolean;
    extractedFilesCount: number;
    uncompressedSizeBytes: number;
    hasEntryFile: boolean;
    suspiciousFilesDetected: string[];
    scanErrors?: string[];
  };
  createdAt: string;
  publishedAt?: string;
}

export interface RightsDeclaration {
  id: string;
  versionId: string;
  aiDisclosure: AIDisclosure;
  thirdPartyAssetsDeclared: boolean;
  licensingNotes: string;
  rightsConfirmed: boolean;
  declaredAt: string;
}

export interface Game {
  id: string;
  developerId: string;
  developerName: string;
  categoryId: string;
  categoryName: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  controlsGuide: string;
  engine: string;
  orientation: Orientation;
  status: GameStatus;
  isFeatured: boolean;
  thumbnailUrl: string;
  bannerUrl: string;
  screenshots: string[];
  currentVersionId?: string;
  totalPlays: number;
  totalPlayMinutes?: number;
  totalReviews?: number;
  rating: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QaSubmission {
  id: string;
  versionId: string;
  gameId: string;
  gameTitle: string;
  developerName: string;
  status: GameStatus;
  automatedChecks: {
    entryPageLoads: boolean;
    consoleErrorsCount: number;
    loadTimeMs: number;
    responsiveViewportOk: boolean;
    cspViolationsCount: number;
  };
  manualNotes?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
}

export interface PlayerSession {
  id: string;
  gameId: string;
  playerId?: string;
  sessionToken: string;
  startTime: string;
  endTime?: string;
  activeSeconds: number;
  lastHeartbeat?: string;
  referralToken?: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET';
  ipHash?: string;
  isIvt?: boolean;
  ivtReason?: string;
}

export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  gameId: string;
  eventType: 'SESSION_START' | 'HEARTBEAT' | 'SESSION_PAUSE' | 'SESSION_RESUME' | 'SESSION_END' | 'CUSTOM';
  activeSeconds: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface GameAnalyticsSummary {
  gameId: string;
  totalStarts: number;
  validSessions: number;
  ivtSessionsCount: number;
  uniquePlayers: number;
  totalPlayMinutes: number;
  avgSessionSeconds: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  retentionRate: number;
  referralStarts: number;
}

export interface ReferralLink {
  id: string;
  token: string;
  gameId: string;
  creatorId: string;
  campaignName: string;
  bonusPercent: number; // e.g. 20 (boosting creator split to 70%)
  clicks: number;
  uniquePlayers: number;
  totalPlayMinutes: number;
  createdAt: string;
}

export type AdFormat = 'PREROLL' | 'INTERSTITIAL' | 'REWARDED';

export interface AdImpression {
  id: string;
  gameId: string;
  creatorId: string;
  sessionToken: string;
  format: AdFormat;
  durationSeconds: number;
  completed: boolean;
  clicked: boolean;
  isIvt: boolean;
  grossRevenue: number;
  networkDeduction: number;
  netRevenue: number;
  creatorShareRate: number; // 0.50 or 0.70
  creatorShareAmount: number;
  referralToken?: string;
  createdAt: string;
}

export interface DeveloperAnalytics {
  totalStarts: number;
  uniquePlayers: number;
  totalPlayMinutes: number;
  avgSessionSeconds: number;
  conversionRate: number;
  estimatedEarnings: number;
  period: string;
}

export type FinancialLedgerStatus = 'ESTIMATED' | 'FINALIZED' | 'PROCESSING' | 'PAID' | 'ON_HOLD';

export interface FinancialLedgerRecord {
  id: string;
  creatorId: string;
  gameId: string;
  gameTitle: string;
  period: string;
  grossRevenue: number;
  deductions: number;
  netRevenue: number;
  creatorShare: number;
  status: FinancialLedgerStatus;
  payoutMethod?: string;
  payoutReference?: string;
  finalizedAt?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface PayoutSummary {
  availableBalance: number;
  estimatedBalance: number;
  lifetimeEarnings: number;
  lifetimePaid: number;
  threshold: number;
  thresholdMet: boolean;
  thresholdProgress: number;
  payoutMethod?: {
    method: 'BANK_WIRE' | 'UPI' | 'PAYPAL';
    details: Record<string, string>;
    isConfigured: boolean;
  };
}

export interface PayoutBatch {
  id: string;
  batchNumber: string;
  period: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalCreatorPayout: number;
  creatorCount: number;
  recordCount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID';
  createdAt: string;
  disbursedAt?: string;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  username: string; // Unique alphanumeric + underscore handle (e.g. cyber_ninja)
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  favoriteGenre?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerFavorite {
  id: string;
  userId: string;
  gameId: string;
  createdAt: string;
}

export interface PlayerHistoryItem {
  id: string;
  userId: string;
  gameId: string;
  lastPlayedAt: string;
  totalPlayMinutes: number;
}

export interface PlayerPayoutMethod {
  id: string;
  userId: string;
  method: 'UPI' | 'BANK_TRANSFER' | 'PAYPAL' | 'GIFT_CARD';
  accountDetails: string;
  beneficiaryName?: string;
  updatedAt: string;
}

export interface PlayerPayoutRequest {
  id: string;
  userId: string;
  amount: number;
  currency?: string;
  method: 'UPI' | 'BANK_TRANSFER' | 'PAYPAL' | 'GIFT_CARD';
  accountDetails: string;
  beneficiaryName?: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED';
  requestedAt: string;
  paidAt?: string;
  transactionRef?: string;
  note?: string;
}

export interface GameReview {
  id: string;
  gameId: string;
  userId: string;
  username: string;
  displayName: string;
  userAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  isVerifiedPlayer: boolean; // active playtime >= 60 seconds
  helpfulCount: number;
  helpfulVoters?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole?: UserRole | 'SYSTEM';
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  ipAddress: string;
  previousHash?: string;
  tamperHash?: string;
  createdAt: string;
}

export interface CookieConsentPreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: string;
}


