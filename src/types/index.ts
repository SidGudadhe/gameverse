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
  | 'UNPUBLISHED'
  | 'QUARANTINED';

export type AIDisclosure = 'NONE_HUMAN_ONLY' | 'AI_ASSISTED' | 'AI_GENERATED';
export type DevelopmentType = 'AI Developed' | 'Human Developed' | 'AI + Human Developed';

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
  deletionRequestedAt?: string;
  scheduledDeletionAt?: string;
}

export interface CreatorAgreement {
  id: string;
  userId: string;
  agreementVersion: string;
  acceptedAt: string;
  ipAddress: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
}

export type MainCategory = 'VEG' | 'NON_VEG';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  count?: number;
  mainCategory?: MainCategory;
}

export interface GameVersion {
  id: string;
  gameId: string;
  versionNumber: string;
  changelog: string;
  entryFile: string;
  entryPoint?: string;
  storagePrefix?: string;
  archiveChecksum: string;
  archiveSizeBytes: number;
  totalSizeBytes?: number;
  fileCount?: number;
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
  developedBy?: DevelopmentType | string;
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
  category?: string;
  mainCategory?: MainCategory;
  subCategory?: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  description?: string;
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
  developedBy?: DevelopmentType | string;
  developmentType?: DevelopmentType | string;
}

export interface QaSubmission {
  id: string;
  versionId: string;
  gameId: string;
  gameTitle: string;
  developerName: string;
  developerId?: string;
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
  winClaimed?: boolean;
  winClaimedAt?: string;
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

export type AdFormat =
  | 'PREROLL'
  | 'INTERSTITIAL'
  | 'REWARDED'
  | 'BONUS_REWARD'
  | 'BANNER'
  | 'NATIVE'
  | 'DISPLAY'
  | 'SPONSORED_LISTING';

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

export type FinancialLedgerStatus =
  | 'SUCCESS'
  | 'PENDING'
  | 'REJECT'
  | 'ESTIMATED'
  | 'FINALIZED'
  | 'PROCESSING'
  | 'PAID'
  | 'ON_HOLD'
  | 'REJECTED';

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
  currency?: string;
  status: FinancialLedgerStatus;
  payoutMethod?: string;
  payoutReference?: string;
  rejectionReason?: string;
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
  currency?: string;
  studioVerified?: boolean;
  payoutMethod?: {
    method: 'BANK_WIRE' | 'UPI' | 'BANK_AND_UPI' | 'PAYPAL' | 'STRIPE';
    details: Record<string, string>;
    bankAccount?: {
      accountNumber: string;
      ifscCode: string;
      beneficiaryName: string;
      bankName: string;
    };
    upi?: {
      upiId: string;
      beneficiaryName?: string;
    };
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
  hasWon?: boolean;
  winCount?: number;
  bestScore?: number;
  lastWonAt?: string;
}

export interface PlayerGameWin {
  id: string;
  userId: string;
  gameId: string;
  sessionId?: string;
  sessionToken?: string;
  playSeconds: number;
  playMinutes: number;
  wonAt: string;
  score?: number;
  isQualified: boolean; // Qualified for payout winnings if play duration is >= 5 minutes (300s)
  verificationStatus?: 'VERIFIED' | 'REJECTED_IVT' | 'REJECTED_TIME' | 'REJECTED_DUPLICATE';
  rejectionReason?: string;
  ipHash?: string;
}

export interface PlayerPayoutMethod {
  id: string;
  userId: string;
  method: 'UPI' | 'BANK_TRANSFER' | 'PAYPAL' | 'GIFT_CARD';
  accountDetails: string;
  beneficiaryName?: string;
  label?: string; // e.g. "Primary GPay", "PhonePe Personal", "Paytm Business"
  provider?: 'GPAY' | 'PHONEPE' | 'PAYTM' | 'BHIM' | 'GENERIC_UPI' | 'BANK' | 'PAYPAL' | 'GIFT';
  isDefault?: boolean;
  createdAt?: string;
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

export interface PlayerWallet {
  userId: string;
  availableBalance: number;
  inProcessing: number;
  lifetimeWithdrawn: number;
  totalEarned: number;
  currency: string;
  updatedAt: string;
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

// ================= GAME HOSTING, STORAGE & CDN TYPES =================

export type StorageProviderType = 'cloudflare_r2' | 'aws_s3' | 'local_isolated';

export interface StorageConfig {
  provider: StorageProviderType;
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicCdnDomain: string;
  gameServingDomain: string;
  enableHttps: boolean;
  maxUploadSizeBytes: number;
}

export type UploadSessionStatus =
  | 'INITIALIZED'
  | 'PENDING_UPLOAD'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED';

export interface GameUploadSession {
  id: string;
  gameId: string;
  developerId: string;
  fileName: string;
  fileSizeBytes: number;
  contentType?: string;
  status: UploadSessionStatus;
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
  metadata?: Record<string, any>;
  completedAt?: string;
  createdAt: string;
  errorMessage?: string;
}

export interface GameManifestEntry {
  path: string;
  sizeBytes: number;
  sha256: string;
  contentType: string;
  storageKey: string;
  cdnUrl: string;
}

export interface GameFileManifest {
  id: string;
  versionId: string;
  gameId: string;
  entryPoint: string;
  files: GameManifestEntry[];
  totalFilesCount: number;
  totalSizeBytes: number;
  manifestHash: string;
  createdAt: string;
}

export interface GameRollbackRecord {
  id: string;
  gameId: string;
  fromVersionId: string;
  toVersionId: string;
  fromVersionNumber?: string;
  toVersionNumber?: string;
  triggeredBy?: string;
  triggeredByName?: string;
  triggeredByRole?: UserRole;
  performedBy?: string;
  performedByName?: string;
  reason: string;
  createdAt: string;
}

export interface GameStorageMetrics {
  id: string;
  gameId: string;
  developerId: string;
  totalStorageBytes: number;
  totalAssetsCount: number;
  totalBandwidthBytesServed: number;
  lastCalculatedAt: string;
}


