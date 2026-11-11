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

export interface DeveloperAnalytics {
  totalStarts: number;
  uniquePlayers: number;
  totalPlayMinutes: number;
  avgSessionSeconds: number;
  conversionRate: number;
  estimatedEarnings: number;
  period: string;
}

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
  status: 'ESTIMATED' | 'FINALIZED' | 'PAID';
  paidAt?: string;
}
