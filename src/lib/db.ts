import { User, Category, Game, GameVersion, QaSubmission, CreatorAgreement, FinancialLedgerRecord } from '@/types';

// Pre-seeded Categories
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-action', name: 'Action', slug: 'action', description: 'Fast-paced reflexes and combat', icon: 'Swords', count: 12 },
  { id: 'cat-puzzle', name: 'Puzzle', slug: 'puzzle', description: 'Brain teasers, logic, and match-3', icon: 'Puzzle', count: 18 },
  { id: 'cat-arcade', name: 'Arcade', slug: 'arcade', description: 'Classic 2D retro and endless runners', icon: 'Gamepad2', count: 24 },
  { id: 'cat-strategy', name: 'Strategy', slug: 'strategy', description: 'Tactical planning and tower defense', icon: 'Crown', count: 8 },
  { id: 'cat-rpg', name: 'RPG', slug: 'rpg', description: 'Character progression and adventures', icon: 'Shield', count: 7 },
  { id: 'cat-sports', name: 'Sports', slug: 'sports', description: 'Soccer, basketball, and racing', icon: 'Trophy', count: 11 },
  { id: 'cat-casual', name: 'Casual', slug: 'casual', description: 'Relaxing and accessible instant games', icon: 'Sparkles', count: 30 },
];

// Pre-seeded Users
export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@gameverse.com',
    name: 'Admin Operations',
    role: 'ADMIN',
    emailVerified: true,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'usr-dev-1',
    email: 'creator@pixelstudio.com',
    name: 'PixelForge Studios',
    role: 'DEVELOPER',
    emailVerified: true,
    createdAt: '2026-11-02T00:00:00.000Z',
  },
  {
    id: 'usr-player-1',
    email: 'player@gamer.com',
    name: 'NeoGamer99',
    role: 'PLAYER',
    emailVerified: true,
    createdAt: '2026-11-03T00:00:00.000Z',
  },
];

// Pre-seeded Games with built-in playable HTML5 canvas games
export const INITIAL_GAMES: Game[] = [
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
    id: 'game-quantum-blocks',
    developerId: 'usr-dev-1',
    developerName: 'PixelForge Studios',
    categoryId: 'cat-puzzle',
    categoryName: 'Puzzle',
    slug: 'quantum-blocks',
    title: 'Quantum Grid Shift',
    shortDescription: 'Satisfying spatial block alignment and color frequency matching.',
    fullDescription: 'Manipulate quantum gravity fields to slide color tiles into harmonic frequency resonance. Clear multiple combo lines simultaneously for cascading points.',
    controlsGuide: 'Mouse / Touch: Drag tiles to rotate and align\nEnter: Lock tile position',
    engine: 'WebGL / Three.js',
    orientation: 'ANY',
    status: 'PUBLISHED',
    isFeatured: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    ],
    currentVersionId: 'ver-quantum-1',
    totalPlays: 8940,
    rating: 4.7,
    publishedAt: '2026-11-05T09:30:00.000Z',
    createdAt: '2026-11-04T14:00:00.000Z',
    updatedAt: '2026-11-05T09:30:00.000Z',
  },
  {
    id: 'game-retro-invaders',
    developerId: 'usr-dev-1',
    developerName: 'PixelForge Studios',
    categoryId: 'cat-action',
    categoryName: 'Action',
    slug: 'space-invaders-redux',
    title: 'Void Strike: Space Defender',
    shortDescription: 'Defend orbital satellites from invading alien fleets with plasma blasters.',
    fullDescription: 'Classic shoot-em-up arcade action reimagined for modern browser viewports. Collect particle shields, spread cannon upgrades, and take down towering sector dreadnoughts.',
    controlsGuide: 'Left/Right or A/D: Move ship\nSpacebar: Fire Plasma Laser\nShift: Deploy EMP Bomb',
    engine: 'HTML5 Canvas',
    orientation: 'LANDSCAPE',
    status: 'PUBLISHED',
    isFeatured: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    ],
    currentVersionId: 'ver-invaders-1',
    totalPlays: 23150,
    rating: 4.9,
    publishedAt: '2026-11-06T15:00:00.000Z',
    createdAt: '2026-11-05T11:00:00.000Z',
    updatedAt: '2026-11-06T15:00:00.000Z',
  },
];

export const INITIAL_VERSIONS: GameVersion[] = [
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
  {
    id: 'ver-quantum-1',
    gameId: 'game-quantum-blocks',
    versionNumber: '1.0.0',
    changelog: 'Genesis release with 50 progressive difficulty levels.',
    entryFile: 'index.html',
    archiveChecksum: 'a2f901198fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b899',
    archiveSizeBytes: 8120000,
    status: 'PUBLISHED',
    scanResults: {
      passed: true,
      extractedFilesCount: 28,
      uncompressedSizeBytes: 9500000,
      hasEntryFile: true,
      suspiciousFilesDetected: [],
    },
    createdAt: '2026-11-04T14:30:00.000Z',
    publishedAt: '2026-11-05T09:30:00.000Z',
  },
];

export const INITIAL_SUBMISSIONS: QaSubmission[] = [
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
    manualNotes: 'Flawless 60fps performance on Chrome & Safari. Crisp audio synchronization.',
    reviewedBy: 'Admin Operations',
    reviewedAt: '2026-11-04T11:45:00.000Z',
    submittedAt: '2026-11-03T11:15:00.000Z',
  },
];

export const INITIAL_FINANCIAL_RECORDS: FinancialLedgerRecord[] = [
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
];

// In-Memory Data Store with getters and mutations
class DatabaseStore {
  users: User[] = [...INITIAL_USERS];
  categories: Category[] = [...INITIAL_CATEGORIES];
  games: Game[] = [...INITIAL_GAMES];
  versions: GameVersion[] = [...INITIAL_VERSIONS];
  submissions: QaSubmission[] = [...INITIAL_SUBMISSIONS];
  financialRecords: FinancialLedgerRecord[] = [...INITIAL_FINANCIAL_RECORDS];
  agreements: CreatorAgreement[] = [
    {
      id: 'agr-001',
      userId: 'usr-dev-1',
      agreementVersion: 'v1.0-2026',
      acceptedAt: '2026-11-02T10:00:00.000Z',
      ipAddress: '127.0.0.1',
      accountStatus: 'ACTIVE',
    },
  ];

  getGames(filter?: { status?: string; categoryId?: string; search?: string }) {
    let result = [...this.games];
    if (filter?.status) {
      result = result.filter(g => g.status === filter.status);
    }
    if (filter?.categoryId) {
      result = result.filter(g => g.categoryId === filter.categoryId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(g => g.title.toLowerCase().includes(q) || g.shortDescription.toLowerCase().includes(q));
    }
    return result;
  }

  getGameBySlug(slug: string) {
    return this.games.find(g => g.slug === slug);
  }

  getGameById(id: string) {
    return this.games.find(g => g.id === id);
  }

  createGame(gameData: Partial<Game>): Game {
    const newGame: Game = {
      id: `game-${Date.now()}`,
      developerId: gameData.developerId || 'usr-dev-1',
      developerName: gameData.developerName || 'PixelForge Studios',
      categoryId: gameData.categoryId || 'cat-arcade',
      categoryName: gameData.categoryName || 'Arcade',
      slug: gameData.slug || `game-${Date.now()}`,
      title: gameData.title || 'Untitled Game',
      shortDescription: gameData.shortDescription || '',
      fullDescription: gameData.fullDescription || '',
      controlsGuide: gameData.controlsGuide || '',
      engine: gameData.engine || 'HTML5 Canvas',
      orientation: gameData.orientation || 'LANDSCAPE',
      status: 'DRAFT',
      isFeatured: false,
      thumbnailUrl: gameData.thumbnailUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      bannerUrl: gameData.bannerUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
      screenshots: gameData.screenshots || [],
      totalPlays: 0,
      rating: 5.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.games.push(newGame);
    return newGame;
  }

  updateGame(id: string, updates: Partial<Game>): Game | null {
    const index = this.games.findIndex(g => g.id === id);
    if (index === -1) return null;
    this.games[index] = { ...this.games[index], ...updates, updatedAt: new Date().toISOString() };
    return this.games[index];
  }

  getSubmissions() {
    return [...this.submissions];
  }

  updateSubmissionStatus(id: string, status: any, notes?: string, reviewer?: string) {
    const sub = this.submissions.find(s => s.id === id);
    if (!sub) return null;
    sub.status = status;
    if (notes) sub.manualNotes = notes;
    if (reviewer) sub.reviewedBy = reviewer;
    sub.reviewedAt = new Date().toISOString();

    // Also update game status
    const game = this.games.find(g => g.id === sub.gameId);
    if (game) {
      game.status = status;
      if (status === 'PUBLISHED') {
        game.publishedAt = new Date().toISOString();
      }
    }
    return sub;
  }
}

// Global Singleton to retain state during development sessions
const globalForDb = global as unknown as { dbStore: DatabaseStore };
export const db = globalForDb.dbStore || new DatabaseStore();
if (process.env.NODE_ENV !== 'production') globalForDb.dbStore = db;
