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
  financialRecords: FinancialLedgerRecord[];
  auditLogs: AuditLog[];
  resetTokens: PasswordResetToken[];
  verificationTokens: EmailVerificationToken[];
  developerSettings: DeveloperSettings[];
  supportTickets: SupportTicket[];
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
          profiles: parsed.profiles || INITIAL_DATABASE_STATE.profiles || [],
          agreements: parsed.agreements || INITIAL_DATABASE_STATE.agreements || [],
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
      result = result.filter((g) => g.title.toLowerCase().includes(q) || g.shortDescription.toLowerCase().includes(q));
    }
    return result;
  }

  getGameById(id: string) {
    return this.state.games.find((g) => g.id === id);
  }

  getGameBySlug(slug: string) {
    return this.state.games.find((g) => g.slug === slug);
  }

  // ================= FINANCIAL RECORDS & TENANT ISOLATION =================
  getFinancialRecordsByCreator(creatorId: string) {
    return this.state.financialRecords.filter((r) => r.creatorId === creatorId);
  }

  // ================= SUBMISSIONS =================
  getSubmissions() {
    return [...this.state.submissions];
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
}

// Global Singleton
const globalForDb = global as unknown as { gameverseDatabase: GameVerseDatabase };
export const gvDb = globalForDb.gameverseDatabase || new GameVerseDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.gameverseDatabase = gvDb;
