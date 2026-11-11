import fs from 'fs';
import path from 'path';
import {
  User,
  UserRole,
  Category,
  Game,
  GameVersion,
  QaSubmission,
  CreatorAgreement,
  FinancialLedgerRecord,
  PlayerSession,
  AnalyticsEvent,
  GameAnalyticsSummary,
  RightsDeclaration,
  ReferralLink,
  AIDisclosure,
  GameStatus,
} from '../../types';

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  ipAddress: string;
  createdAt: string;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  used: boolean;
}

export interface EmailVerificationToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

export interface DeveloperSettings {
  id: string;
  userId: string;
  payoutMethod: 'BANK_WIRE' | 'UPI' | 'PAYPAL';
  payoutDetails: Record<string, string>;
  notifyOnQaUpdate: boolean;
  notifyOnPayout: boolean;
  notifyOnPlayerReport: boolean;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  creatorId: string;
  subject: string;
  category: 'PUBLISHING' | 'MONETIZATION' | 'TECHNICAL' | 'GENERAL';
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

export interface DatabaseState {
  users: (User & { passwordHash: string; twoFactorSecret?: string })[];
  profiles: {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    studioName?: string;
    website?: string;
    portfolioUrl?: string;
  }[];
  categories: Category[];
  games: Game[];
  versions: GameVersion[];
  submissions: QaSubmission[];
  agreements: CreatorAgreement[];
  sessions: PlayerSession[];
  events: AnalyticsEvent[];
  financialRecords: FinancialLedgerRecord[];
  auditLogs: AuditLog[];
  resetTokens: PasswordResetToken[];
  verificationTokens: EmailVerificationToken[];
  developerSettings: DeveloperSettings[];
  supportTickets: SupportTicket[];
  rightsDeclarations: RightsDeclaration[];
  referralLinks: ReferralLink[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'gameverse_db.json');

// Initial seed data with hashed password for "Password123!"
// Hash for "Password123!" using bcryptjs is deterministic:
const DEFAULT_PASSWORD_HASH = '$2a$10$wE43rWk1H6q0E8.s2M0xse1nLpTqgS4hV7aA.nC.y9nE3c1sI3gS6';

export const INITIAL_DATABASE_STATE: DatabaseState = {
  users: [
    {
      id: 'usr-admin-1',
      email: 'admin@gameverse.com',
      name: 'System Admin',
      role: 'ADMIN',
      emailVerified: true,
      passwordHash: DEFAULT_PASSWORD_HASH,
      twoFactorEnabled: true,
      twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Base32 test secret
      createdAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'usr-dev-1',
      email: 'creator@pixelstudio.com',
      name: 'PixelForge Studios',
      role: 'DEVELOPER',
      emailVerified: true,
      passwordHash: DEFAULT_PASSWORD_HASH,
      createdAt: '2026-11-02T00:00:00.000Z',
    },
    {
      id: 'usr-dev-2',
      email: 'indie@voxelgames.com',
      name: 'Voxel Games LLC',
      role: 'DEVELOPER',
      emailVerified: true,
      passwordHash: DEFAULT_PASSWORD_HASH,
      createdAt: '2026-11-03T00:00:00.000Z',
    },
    {
      id: 'usr-player-1',
      email: 'player@gamer.com',
      name: 'NeoGamer99',
      role: 'PLAYER',
      emailVerified: true,
      passwordHash: DEFAULT_PASSWORD_HASH,
      createdAt: '2026-11-04T00:00:00.000Z',
    },
  ],
  profiles: [
    {
      id: 'prof-1',
      userId: 'usr-admin-1',
      username: 'admin',
      displayName: 'System Admin',
    },
    {
      id: 'prof-2',
      userId: 'usr-dev-1',
      username: 'pixelforge',
      displayName: 'PixelForge Studios',
      studioName: 'PixelForge Studios',
    },
    {
      id: 'prof-3',
      userId: 'usr-dev-2',
      username: 'voxelgames',
      displayName: 'Voxel Games LLC',
      studioName: 'Voxel Games LLC',
    },
    {
      id: 'prof-4',
      userId: 'usr-player-1',
      username: 'neogamer',
      displayName: 'NeoGamer99',
    },
  ],
  categories: [
    { id: 'cat-action', name: 'Action', slug: 'action', description: 'Fast-paced reflexes and combat', icon: 'Swords', count: 12 },
    { id: 'cat-puzzle', name: 'Puzzle', slug: 'puzzle', description: 'Brain teasers, logic, and match-3', icon: 'Puzzle', count: 18 },
    { id: 'cat-arcade', name: 'Arcade', slug: 'arcade', description: 'Classic 2D retro and endless runners', icon: 'Gamepad2', count: 24 },
    { id: 'cat-strategy', name: 'Strategy', slug: 'strategy', description: 'Tactical planning and tower defense', icon: 'Crown', count: 8 },
    { id: 'cat-rpg', name: 'RPG', slug: 'rpg', description: 'Character progression and adventures', icon: 'Shield', count: 7 },
    { id: 'cat-sports', name: 'Sports', slug: 'sports', description: 'Soccer, basketball, and racing', icon: 'Trophy', count: 11 },
    { id: 'cat-casual', name: 'Casual', slug: 'casual', description: 'Relaxing and accessible instant games', icon: 'Sparkles', count: 30 },
  ],
  games: [
    {
      id: 'game-neon-runner',
      developerId: 'usr-dev-1',
      developerName: 'PixelForge Studios',
      categoryId: 'cat-arcade',
      categoryName: 'Arcade',
      slug: 'neon-runner',
      title: 'Neon Cyber Runner 2088',
      shortDescription: 'Dash, jump, and dodge laser barriers in this synthwave endless runner.',
      fullDescription: 'Sprint across neo-Tokyo rooftops while evading rogue security drones. Time your high jumps and slide under magnetic beams to rack up the ultimate high score in full retro-futuristic audio.',
      controlsGuide: 'Space / Up Arrow: Jump (Double tap for double jump)\nDown Arrow: Slide\nP: Pause Game',
      engine: 'Phaser 3 / HTML5 Canvas',
      orientation: 'LANDSCAPE',
      status: 'PUBLISHED',
      isFeatured: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      ],
      currentVersionId: 'ver-neon-1',
      totalPlays: 14280,
      rating: 4.8,
      publishedAt: '2026-11-04T12:00:00.000Z',
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-04T12:00:00.000Z',
    },
    {
      id: 'game-voxel-quest',
      developerId: 'usr-dev-2',
      developerName: 'Voxel Games LLC',
      categoryId: 'cat-rpg',
      categoryName: 'RPG',
      slug: 'voxel-quest',
      title: 'Voxel Dungeons',
      shortDescription: 'Procedural voxel dungeon crawler with loot and monsters.',
      fullDescription: 'Explore subterranean mazes, collect magic weapons, and defeat skeleton kings in real-time isometric perspective.',
      controlsGuide: 'WASD: Move\nLeft Click: Attack\nI: Inventory',
      engine: 'Three.js / WebGL',
      orientation: 'LANDSCAPE',
      status: 'PUBLISHED',
      isFeatured: false,
      thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80',
      screenshots: [],
      currentVersionId: 'ver-voxel-1',
      totalPlays: 6540,
      rating: 4.6,
      publishedAt: '2026-11-05T10:00:00.000Z',
      createdAt: '2026-11-04T12:00:00.000Z',
      updatedAt: '2026-11-05T10:00:00.000Z',
    },
  ],
  versions: [
    {
      id: 'ver-neon-1',
      gameId: 'game-neon-runner',
      versionNumber: '1.0.4',
      changelog: 'Initial public launch with 6 synthwave tracks and 60fps physics.',
      entryFile: 'index.html',
      archiveChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      archiveSizeBytes: 14205000,
      status: 'PUBLISHED',
      scanResults: {
        passed: true,
        extractedFilesCount: 42,
        uncompressedSizeBytes: 18400000,
        hasEntryFile: true,
        suspiciousFilesDetected: [],
      },
      createdAt: '2026-11-03T11:00:00.000Z',
      publishedAt: '2026-11-04T12:00:00.000Z',
    },
  ],
  submissions: [
    {
      id: 'sub-neon-1',
      versionId: 'ver-neon-1',
      gameId: 'game-neon-runner',
      gameTitle: 'Neon Cyber Runner 2088',
      developerName: 'PixelForge Studios',
      status: 'PUBLISHED',
      automatedChecks: {
        entryPageLoads: true,
        consoleErrorsCount: 0,
        loadTimeMs: 420,
        responsiveViewportOk: true,
        cspViolationsCount: 0,
      },
      manualNotes: 'Passed QA inspection. Flawless audio sync.',
      reviewedBy: 'System Admin',
      reviewedAt: '2026-11-04T11:45:00.000Z',
      submittedAt: '2026-11-03T11:15:00.000Z',
    },
  ],
  agreements: [
    {
      id: 'agr-001',
      userId: 'usr-dev-1',
      agreementVersion: 'v1.0-2026',
      acceptedAt: '2026-11-02T10:00:00.000Z',
      ipAddress: '127.0.0.1',
      accountStatus: 'ACTIVE',
    },
    {
      id: 'agr-002',
      userId: 'usr-dev-2',
      agreementVersion: 'v1.0-2026',
      acceptedAt: '2026-11-03T09:30:00.000Z',
      ipAddress: '127.0.0.1',
      accountStatus: 'ACTIVE',
    },
  ],
  sessions: [],
  events: [],
  referralLinks: [],
  financialRecords: [
    {
      id: 'led-001',
      creatorId: 'usr-dev-1',
      gameId: 'game-neon-runner',
      gameTitle: 'Neon Cyber Runner 2088',
      period: 'October 2026',
      grossRevenue: 480.50,
      deductions: 32.20,
      netRevenue: 448.30,
      creatorShare: 224.15,
      status: 'FINALIZED',
      paidAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'led-002',
      creatorId: 'usr-dev-1',
      gameId: 'game-neon-runner',
      gameTitle: 'Neon Cyber Runner 2088',
      period: 'November 2026 (MTD)',
      grossRevenue: 310.80,
      deductions: 18.40,
      netRevenue: 292.40,
      creatorShare: 146.20,
      status: 'ESTIMATED',
    },
  ],
  auditLogs: [
    {
      id: 'log-001',
      actorId: 'usr-admin-1',
      actorName: 'System Admin',
      action: 'APPROVE_GAME',
      targetType: 'GAME_VERSION',
      targetId: 'ver-neon-1',
      details: { title: 'Neon Cyber Runner 2088', version: '1.0.4' },
      ipAddress: '127.0.0.1',
      createdAt: '2026-11-04T11:45:00.000Z',
    },
  ],
  resetTokens: [],
  verificationTokens: [],
  developerSettings: [
    {
      id: 'set-dev-1',
      userId: 'usr-dev-1',
      payoutMethod: 'BANK_WIRE',
      payoutDetails: {
        accountHolder: 'PixelForge Studios Ltd',
        iban: 'GB29NWBK60161331926819',
        swift: 'NWBKGB2L',
      },
      notifyOnQaUpdate: true,
      notifyOnPayout: true,
      notifyOnPlayerReport: false,
      updatedAt: '2026-11-02T10:00:00.000Z',
    },
  ],
  supportTickets: [
    {
      id: 'tkt-001',
      creatorId: 'usr-dev-1',
      subject: 'WebGL 2.0 compressed texture support',
      category: 'TECHNICAL',
      message: 'Does the sandbox runner support Basis Universal / KTX2 texture formats?',
      status: 'RESOLVED',
      createdAt: '2026-11-05T14:00:00.000Z',
    },
  ],
  rightsDeclarations: [
    {
      id: 'rgt-001',
      versionId: 'ver-neon-1',
      aiDisclosure: 'NONE_HUMAN_ONLY',
      thirdPartyAssetsDeclared: true,
      licensingNotes: 'Original synthwave soundtrack composed in-house. Free commercial font license.',
      rightsConfirmed: true,
      declaredAt: '2026-11-03T11:15:00.000Z',
    },
  ],
};

class GameVerseDatabase {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...INITIAL_DATABASE_STATE,
          ...parsed,
          developerSettings: parsed.developerSettings || INITIAL_DATABASE_STATE.developerSettings || [],
          supportTickets: parsed.supportTickets || INITIAL_DATABASE_STATE.supportTickets || [],
          rightsDeclarations: parsed.rightsDeclarations || INITIAL_DATABASE_STATE.rightsDeclarations || [],
          profiles: parsed.profiles || INITIAL_DATABASE_STATE.profiles || [],
          agreements: parsed.agreements || INITIAL_DATABASE_STATE.agreements || [],
          sessions: parsed.sessions || INITIAL_DATABASE_STATE.sessions || [],
          events: parsed.events || INITIAL_DATABASE_STATE.events || [],
          referralLinks: parsed.referralLinks || INITIAL_DATABASE_STATE.referralLinks || [],
        };
      }
    } catch (e) {
      console.warn('Failed to load database file, using in-memory baseline:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATABASE_STATE));
  }

  private persistState() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to persist database to disk:', e);
    }
  }

  // ================= USERS & AUTH =================
  findUserByEmail(email: string) {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string) {
    return this.state.users.find((u) => u.id === id);
  }

  createUser(userData: {
    email: string;
    passwordHash: string;
    name: string;
    role: UserRole;
    emailVerified?: boolean;
  }) {
    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      passwordHash: userData.passwordHash,
      emailVerified: userData.emailVerified || false,
      createdAt: new Date().toISOString(),
    };

    this.state.users.push(newUser);

    // Create corresponding profile
    this.state.profiles.push({
      id: `prof-${Date.now()}`,
      userId: newUser.id,
      username: userData.email.split('@')[0],
      displayName: userData.name,
      studioName: userData.role === 'DEVELOPER' ? userData.name : undefined,
    });

    this.persistState();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User & { passwordHash?: string; twoFactorSecret?: string }>) {
    const user = this.findUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    this.persistState();
    return user;
  }

  // ================= EMAIL & RESET TOKENS =================
  createEmailVerificationToken(userId: string) {
    const token = `verify_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
    const entry: EmailVerificationToken = { id: `evt-${Date.now()}`, userId, token, expiresAt };
    this.state.verificationTokens.push(entry);
    this.persistState();
    return entry;
  }

  verifyEmailToken(token: string) {
    const entry = this.state.verificationTokens.find((t) => t.token === token);
    if (!entry) return null;
    if (new Date(entry.expiresAt) < new Date()) return null;

    const user = this.findUserById(entry.userId);
    if (user) {
      user.emailVerified = true;
      this.persistState();
    }
    return user;
  }

  createPasswordResetToken(email: string) {
    const token = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
    const entry: PasswordResetToken = { id: `prt-${Date.now()}`, email, token, expiresAt, used: false };
    this.state.resetTokens.push(entry);
    this.persistState();
    return entry;
  }

  usePasswordResetToken(token: string, newPasswordHash: string) {
    const entry = this.state.resetTokens.find((t) => t.token === token && !t.used);
    if (!entry) return false;
    if (new Date(entry.expiresAt) < new Date()) return false;

    const user = this.findUserByEmail(entry.email);
    if (!user) return false;

    user.passwordHash = newPasswordHash;
    entry.used = true;
    this.persistState();
    return true;
  }

  // ================= AUDIT LOGGING =================
  logAudit(entry: Omit<AuditLog, 'id' | 'createdAt'>) {
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      ...entry,
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    this.persistState();
    return log;
  }

  getAuditLogs(limit = 50) {
    return this.state.auditLogs.slice(0, limit);
  }

  // ================= GAMES & TENANT ISOLATION =================
  getGames(filter?: { status?: string; categoryId?: string; developerId?: string; search?: string }) {
    let result = [...this.state.games];
    if (filter?.status) {
      result = result.filter((g) => g.status === filter.status);
    }
    if (filter?.categoryId) {
      result = result.filter((g) => g.categoryId === filter.categoryId);
    }
    if (filter?.developerId) {
      result = result.filter((g) => g.developerId === filter.developerId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.shortDescription.toLowerCase().includes(q) ||
          (g.developerName && g.developerName.toLowerCase().includes(q))
      );
    }
    return result;
  }

  getGameById(id: string) {
    return this.state.games.find((g) => g.id === id);
  }

  getGameBySlug(slug: string) {
    return this.state.games.find((g) => g.slug === slug);
  }

  getCategories(): (Category & { count: number })[] {
    const publishedGames = this.state.games.filter((g) => g.status === 'PUBLISHED');
    return this.state.categories.map((cat) => {
      const count = publishedGames.filter(
        (g) => g.categoryId === cat.id || g.categoryName?.toLowerCase() === cat.name.toLowerCase()
      ).length;
      return {
        ...cat,
        count,
      };
    });
  }

  getCategoryBySlug(slug: string): Category | null {
    return this.state.categories.find((c) => c.slug === slug || c.id === slug) || null;
  }

  createGame(gameData: Partial<Game> & { title: string; developerId: string }): Game {
    const id = gameData.id || `game-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const slug = gameData.slug || gameData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const now = new Date().toISOString();

    const newGame: Game = {
      id,
      developerId: gameData.developerId,
      developerName: gameData.developerName || 'Independent Studio',
      categoryId: gameData.categoryId || 'cat-arcade',
      categoryName: gameData.categoryName || 'Arcade',
      slug,
      title: gameData.title,
      shortDescription: gameData.shortDescription || '',
      fullDescription: gameData.fullDescription || '',
      controlsGuide: gameData.controlsGuide || '',
      engine: gameData.engine || 'HTML5 Canvas',
      orientation: gameData.orientation || 'LANDSCAPE',
      status: gameData.status || 'SUBMITTED',
      isFeatured: false,
      thumbnailUrl: gameData.thumbnailUrl || '/images/placeholders/thumb.png',
      bannerUrl: gameData.bannerUrl || '/images/placeholders/banner.png',
      screenshots: gameData.screenshots || [],
      currentVersionId: gameData.currentVersionId,
      totalPlays: 0,
      rating: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.state.games.push(newGame);
    this.persistState();
    return newGame;
  }

  updateGame(id: string, updates: Partial<Game>): Game | null {
    const game = this.state.games.find((g) => g.id === id);
    if (!game) return null;
    Object.assign(game, updates, { updatedAt: new Date().toISOString() });
    this.persistState();
    return game;
  }

  // ================= GAME VERSIONS =================
  createVersion(verData: Partial<GameVersion> & { gameId: string; versionNumber: string }): GameVersion {
    const id = verData.id || `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newVer: GameVersion = {
      id,
      gameId: verData.gameId,
      versionNumber: verData.versionNumber,
      changelog: verData.changelog || 'Initial build release.',
      entryFile: verData.entryFile || 'index.html',
      archiveChecksum: verData.archiveChecksum || '',
      archiveSizeBytes: verData.archiveSizeBytes || 0,
      status: verData.status || 'SUBMITTED',
      scanResults: verData.scanResults || {
        passed: true,
        extractedFilesCount: 0,
        uncompressedSizeBytes: 0,
        hasEntryFile: true,
        suspiciousFilesDetected: [],
      },
      createdAt: now,
    };

    this.state.versions.push(newVer);
    this.persistState();
    return newVer;
  }

  getVersionById(id: string): GameVersion | null {
    return this.state.versions.find((v) => v.id === id) || null;
  }

  getVersionsByGameId(gameId: string): GameVersion[] {
    return this.state.versions.filter((v) => v.gameId === gameId);
  }

  updateVersion(id: string, updates: Partial<GameVersion>): GameVersion | null {
    const ver = this.state.versions.find((v) => v.id === id);
    if (!ver) return null;
    Object.assign(ver, updates);
    this.persistState();
    return ver;
  }

  // ================= RIGHTS DECLARATIONS =================
  saveRightsDeclaration(rightsData: {
    versionId: string;
    aiDisclosure: AIDisclosure;
    thirdPartyAssetsDeclared: boolean;
    licensingNotes?: string;
    rightsConfirmed: boolean;
  }): RightsDeclaration {
    const id = `rgt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const entry: RightsDeclaration = {
      id,
      versionId: rightsData.versionId,
      aiDisclosure: rightsData.aiDisclosure,
      thirdPartyAssetsDeclared: rightsData.thirdPartyAssetsDeclared,
      licensingNotes: rightsData.licensingNotes || '',
      rightsConfirmed: rightsData.rightsConfirmed,
      declaredAt: new Date().toISOString(),
    };

    this.state.rightsDeclarations.push(entry);
    this.persistState();
    return entry;
  }

  getRightsDeclarationByVersionId(versionId: string): RightsDeclaration | null {
    return this.state.rightsDeclarations.find((r) => r.versionId === versionId) || null;
  }

  // ================= FINANCIAL RECORDS & TENANT ISOLATION =================
  getFinancialRecordsByCreator(creatorId: string) {
    return this.state.financialRecords.filter((r) => r.creatorId === creatorId);
  }

  // ================= SUBMISSIONS =================
  getSubmissions() {
    return [...this.state.submissions];
  }

  createSubmission(subData: {
    versionId: string;
    gameId: string;
    gameTitle: string;
    developerName: string;
    automatedChecks?: Partial<QaSubmission['automatedChecks']>;
    manualNotes?: string;
  }): QaSubmission {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const submission: QaSubmission = {
      id,
      versionId: subData.versionId,
      gameId: subData.gameId,
      gameTitle: subData.gameTitle,
      developerName: subData.developerName,
      status: 'SUBMITTED',
      automatedChecks: {
        entryPageLoads: true,
        consoleErrorsCount: 0,
        loadTimeMs: 0,
        responsiveViewportOk: true,
        cspViolationsCount: 0,
        ...subData.automatedChecks,
      },
      manualNotes: subData.manualNotes,
      submittedAt: now,
    };

    this.state.submissions.unshift(submission);
    this.persistState();
    return submission;
  }

  getSubmissionsByCreator(creatorId: string): QaSubmission[] {
    const creatorGameIds = new Set(this.state.games.filter((g) => g.developerId === creatorId).map((g) => g.id));
    return this.state.submissions.filter((s) => creatorGameIds.has(s.gameId));
  }

  getSubmissionById(id: string): QaSubmission | null {
    return this.state.submissions.find((s) => s.id === id) || null;
  }

  updateSubmissionStatus(
    id: string,
    status: GameStatus,
    reviewData?: { reviewedBy?: string; manualNotes?: string; rejectionReason?: string }
  ): QaSubmission | null {
    const sub = this.state.submissions.find((s) => s.id === id);
    if (!sub) return null;
    sub.status = status;
    if (reviewData) {
      if (reviewData.reviewedBy) sub.reviewedBy = reviewData.reviewedBy;
      if (reviewData.manualNotes) sub.manualNotes = reviewData.manualNotes;
      if (reviewData.rejectionReason) sub.rejectionReason = reviewData.rejectionReason;
      sub.reviewedAt = new Date().toISOString();
    }
    this.persistState();
    return sub;
  }

  // ================= DEVELOPER PROFILES & ONBOARDING =================
  getProfileByUserId(userId: string) {
    return this.state.profiles.find((p) => p.userId === userId) || null;
  }

  updateProfile(userId: string, data: Partial<DatabaseState['profiles'][0]>) {
    let profile = this.state.profiles.find((p) => p.userId === userId);
    if (!profile) {
      profile = {
        id: `prof-${Date.now()}`,
        userId,
        username: `dev_${Date.now()}`,
        displayName: 'Creator',
      };
      this.state.profiles.push(profile);
    }
    Object.assign(profile, data);
    this.persistState();
    return profile;
  }

  getAgreementByUserId(userId: string) {
    return this.state.agreements.find((a) => a.userId === userId) || null;
  }

  saveAgreement(data: {
    userId: string;
    agreementVersion: string;
    ipAddress: string;
    accountStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  }) {
    let agreement = this.state.agreements.find((a) => a.userId === data.userId);
    if (agreement) {
      agreement.agreementVersion = data.agreementVersion;
      agreement.acceptedAt = new Date().toISOString();
      agreement.ipAddress = data.ipAddress;
      agreement.accountStatus = data.accountStatus;
    } else {
      agreement = {
        id: `agr-${Date.now()}`,
        userId: data.userId,
        agreementVersion: data.agreementVersion,
        acceptedAt: new Date().toISOString(),
        ipAddress: data.ipAddress,
        accountStatus: data.accountStatus,
      };
      this.state.agreements.push(agreement);
    }
    this.persistState();
    return agreement;
  }

  // ================= DEVELOPER SETTINGS =================
  getDeveloperSettings(userId: string): DeveloperSettings {
    let settings = this.state.developerSettings.find((s) => s.userId === userId);
    if (!settings) {
      settings = {
        id: `set-${Date.now()}`,
        userId,
        payoutMethod: 'BANK_WIRE',
        payoutDetails: {},
        notifyOnQaUpdate: true,
        notifyOnPayout: true,
        notifyOnPlayerReport: false,
        updatedAt: new Date().toISOString(),
      };
      this.state.developerSettings.push(settings);
      this.persistState();
    }
    return settings;
  }

  updateDeveloperSettings(userId: string, updates: Partial<DeveloperSettings>) {
    const settings = this.getDeveloperSettings(userId);
    Object.assign(settings, updates, { updatedAt: new Date().toISOString() });
    this.persistState();
    return settings;
  }

  // ================= SUPPORT TICKETS =================
  createSupportTicket(data: {
    creatorId: string;
    subject: string;
    category: SupportTicket['category'];
    message: string;
  }): SupportTicket {
    const ticket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      creatorId: data.creatorId,
      subject: data.subject,
      category: data.category,
      message: data.message,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    this.state.supportTickets.unshift(ticket);
    this.persistState();
    return ticket;
  }

  getSupportTicketsByCreator(creatorId: string): SupportTicket[] {
    return this.state.supportTickets.filter((t) => t.creatorId === creatorId);
  }

  // ================= PLAYER SESSIONS & ANALYTICS PIPELINE =================
  createSession(data: {
    gameId: string;
    sessionToken: string;
    playerId?: string;
    ipHash?: string;
    deviceType?: 'DESKTOP' | 'MOBILE' | 'TABLET';
    referralToken?: string;
    isIvt?: boolean;
    ivtReason?: string;
  }): PlayerSession {
    const existing = this.state.sessions.find((s) => s.sessionToken === data.sessionToken);
    if (existing) return existing;

    const newSession: PlayerSession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      gameId: data.gameId,
      sessionToken: data.sessionToken,
      playerId: data.playerId,
      ipHash: data.ipHash || 'anon',
      deviceType: data.deviceType || 'DESKTOP',
      referralToken: data.referralToken,
      isIvt: !!data.isIvt,
      ivtReason: data.ivtReason,
      startTime: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      activeSeconds: 0,
    };

    this.state.sessions.push(newSession);

    // If legitimate start, increment totalPlays on game
    if (!newSession.isIvt) {
      const game = this.getGameById(data.gameId);
      if (game) {
        game.totalPlays = (game.totalPlays || 0) + 1;
        game.updatedAt = new Date().toISOString();
      }

      if (data.referralToken) {
        this.recordReferralClick(data.referralToken, data.playerId);
      }
    }

    this.persistState();
    return newSession;
  }

  getSessionByToken(token: string): PlayerSession | null {
    return this.state.sessions.find((s) => s.sessionToken === token) || null;
  }

  updateSessionHeartbeat(
    token: string,
    activeSeconds: number,
    isIvt?: boolean,
    ivtReason?: string
  ): PlayerSession | null {
    const session = this.state.sessions.find((s) => s.sessionToken === token);
    if (!session) return null;

    if (isIvt) {
      session.isIvt = true;
      if (ivtReason) session.ivtReason = ivtReason;
    }

    session.activeSeconds = Math.max(session.activeSeconds, activeSeconds);
    session.lastHeartbeat = new Date().toISOString();

    // Recalculate game totalPlayMinutes
    this.recalculateGamePlayTime(session.gameId);

    this.persistState();
    return session;
  }

  endSession(token: string, activeSeconds?: number): PlayerSession | null {
    const session = this.state.sessions.find((s) => s.sessionToken === token);
    if (!session) return null;

    if (typeof activeSeconds === 'number') {
      session.activeSeconds = Math.max(session.activeSeconds, activeSeconds);
    }
    session.endTime = new Date().toISOString();
    session.lastHeartbeat = new Date().toISOString();

    this.recalculateGamePlayTime(session.gameId);

    this.persistState();
    return session;
  }

  private recalculateGamePlayTime(gameId: string) {
    const game = this.getGameById(gameId);
    if (!game) return;

    // Sum active seconds of all non-IVT sessions
    const validSessions = this.state.sessions.filter((s) => s.gameId === gameId && !s.isIvt);
    const totalSeconds = validSessions.reduce((acc, s) => acc + (s.activeSeconds || 0), 0);
    game.totalPlayMinutes = Math.round((totalSeconds / 60) * 10) / 10;
  }

  recordAnalyticsEvent(data: {
    sessionId: string;
    gameId: string;
    eventType: 'SESSION_START' | 'HEARTBEAT' | 'SESSION_PAUSE' | 'SESSION_RESUME' | 'SESSION_END' | 'CUSTOM';
    activeSeconds: number;
    metadata?: Record<string, any>;
  }): AnalyticsEvent {
    const newEvent: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId: data.sessionId,
      gameId: data.gameId,
      eventType: data.eventType,
      activeSeconds: data.activeSeconds || 0,
      metadata: data.metadata,
      timestamp: new Date().toISOString(),
    };

    if (!this.state.events) {
      this.state.events = [];
    }
    this.state.events.push(newEvent);
    this.persistState();
    return newEvent;
  }

  getSessionsByGameId(gameId: string): PlayerSession[] {
    return this.state.sessions.filter((s) => s.gameId === gameId);
  }

  getGameAnalytics(gameId: string): GameAnalyticsSummary {
    const sessions = this.state.sessions.filter((s) => s.gameId === gameId);
    const totalStarts = sessions.length;

    const validSessions = sessions.filter((s) => !s.isIvt && s.activeSeconds >= 10);
    const ivtSessionsCount = sessions.filter((s) => s.isIvt).length;

    // Unique players: unique playerIds + unique guest ipHashes
    const playerIds = new Set<string>();
    const guestIps = new Set<string>();
    sessions.forEach((s) => {
      if (s.playerId) playerIds.add(s.playerId);
      else if (s.ipHash) guestIps.add(s.ipHash);
    });
    const uniquePlayers = playerIds.size + guestIps.size || (totalStarts > 0 ? 1 : 0);

    const totalSeconds = validSessions.reduce((acc, s) => acc + s.activeSeconds, 0);
    const totalPlayMinutes = Math.round((totalSeconds / 60) * 10) / 10;
    const avgSessionSeconds =
      validSessions.length > 0 ? Math.round(totalSeconds / validSessions.length) : 0;

    const deviceBreakdown = {
      desktop: sessions.filter((s) => s.deviceType === 'DESKTOP').length,
      mobile: sessions.filter((s) => s.deviceType === 'MOBILE').length,
      tablet: sessions.filter((s) => s.deviceType === 'TABLET').length,
    };

    // Retention rate: count of players who had > 1 session
    const playerSessionCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      const key = s.playerId || s.ipHash || 'anon';
      playerSessionCounts[key] = (playerSessionCounts[key] || 0) + 1;
    });
    const returningCount = Object.values(playerSessionCounts).filter((c) => c > 1).length;
    const totalUniqueKeys = Object.keys(playerSessionCounts).length;
    const retentionRate =
      totalUniqueKeys > 0 ? Math.round((returningCount / totalUniqueKeys) * 1000) / 10 : 0;

    const referralStarts = sessions.filter((s) => !!s.referralToken).length;

    return {
      gameId,
      totalStarts,
      validSessions: validSessions.length,
      ivtSessionsCount,
      uniquePlayers,
      totalPlayMinutes,
      avgSessionSeconds,
      deviceBreakdown,
      retentionRate,
      referralStarts,
    };
  }

  // ================= REFERRAL ATTRIBUTION & CAMPAIGNS =================
  createReferralLink(data: {
    gameId: string;
    creatorId: string;
    campaignName?: string;
    bonusPercent?: number;
    customToken?: string;
  }): ReferralLink {
    if (!this.state.referralLinks) {
      this.state.referralLinks = [];
    }

    const token =
      data.customToken ||
      `cr_${Math.random().toString(36).substring(2, 6)}_${Date.now().toString(36)}`;

    // Ensure token uniqueness
    const existing = this.state.referralLinks.find((r) => r.token === token);
    if (existing) return existing;

    const link: ReferralLink = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      token,
      gameId: data.gameId,
      creatorId: data.creatorId,
      campaignName: data.campaignName || 'Direct Share',
      bonusPercent: data.bonusPercent ?? 20,
      clicks: 0,
      uniquePlayers: 0,
      totalPlayMinutes: 0,
      createdAt: new Date().toISOString(),
    };

    this.state.referralLinks.push(link);
    this.persistState();
    return link;
  }

  getReferralLinkByToken(token: string): ReferralLink | null {
    if (!this.state.referralLinks) return null;
    return this.state.referralLinks.find((r) => r.token === token) || null;
  }

  getReferralLinksByCreator(creatorId: string): ReferralLink[] {
    if (!this.state.referralLinks) return [];
    return this.state.referralLinks.filter((r) => r.creatorId === creatorId);
  }

  getReferralLinksByGame(gameId: string): ReferralLink[] {
    if (!this.state.referralLinks) return [];
    return this.state.referralLinks.filter((r) => r.gameId === gameId);
  }

  recordReferralClick(token: string, playerId?: string): ReferralLink | null {
    if (!this.state.referralLinks) return null;
    const link = this.state.referralLinks.find((r) => r.token === token);
    if (!link) return null;

    link.clicks = (link.clicks || 0) + 1;
    if (playerId) {
      link.uniquePlayers = (link.uniquePlayers || 0) + 1;
    }
    this.persistState();
    return link;
  }
}

// Global Singleton
const globalForDb = global as unknown as { gameverseDatabase: GameVerseDatabase };
export const gvDb = globalForDb.gameverseDatabase || new GameVerseDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.gameverseDatabase = gvDb;
