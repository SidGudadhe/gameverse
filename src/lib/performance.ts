import { Game, User, ReferralLink } from '../types';
import type { DatabaseState } from './database';

// ================= 1. CDN & EDGE CACHE CONFIGURATIONS =================

export const CACHE_PROFILES = {
  /** Static immutable assets: JS bundles, WASM binaries, textures (1 year) */
  STATIC_IMMUTABLE: 'public, max-age=31536000, immutable',

  /** Public game catalog, trending lists, category views (1 min edge, 5 min SWR) */
  PUBLIC_CATALOG: 'public, s-maxage=60, stale-while-revalidate=300',

  /** Individual game detail page metadata (30 sec edge, 2 min SWR) */
  PUBLIC_GAME_DETAIL: 'public, s-maxage=30, stale-while-revalidate=120',

  /** Game build extracted files (.wasm, .data, audio, png) (1 day browser, 7 days edge) */
  GAME_BUILD_ASSETS: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',

  /** Private user data (favorites, sessions, payouts, auth, admin): strictly never cached */
  PRIVATE_USER_DATA: 'private, no-cache, no-store, must-revalidate',
};

/**
 * Generates Cloudflare and Edge CDN Cache-Control headers with Cache Tags.
 */
export function getEdgeCacheHeaders(
  profileKey: keyof typeof CACHE_PROFILES,
  cacheTags?: string[]
): Record<string, string> {
  const cacheValue = CACHE_PROFILES[profileKey];
  const isPrivate = profileKey === 'PRIVATE_USER_DATA';

  const headers: Record<string, string> = {
    'Cache-Control': cacheValue,
    Vary: 'Accept-Encoding',
  };

  if (!isPrivate) {
    headers['CDN-Cache-Control'] = cacheValue;
    headers['Cloudflare-CDN-Cache-Control'] = cacheValue;
    if (cacheTags && cacheTags.length > 0) {
      headers['Cache-Tag'] = cacheTags.join(',');
    }
  }

  return headers;
}

// ================= 2. COMPRESSION HEURISTICS (BROTLI / GZIP) =================

/**
 * Determines client compression capabilities from the Accept-Encoding header.
 */
export function checkCompressionSupport(acceptEncodingHeader: string | null): {
  brotli: boolean;
  gzip: boolean;
  preferred: 'br' | 'gzip' | 'none';
} {
  if (!acceptEncodingHeader) {
    return { brotli: false, gzip: false, preferred: 'none' };
  }

  const encodings = acceptEncodingHeader.toLowerCase();
  const brotli = encodings.includes('br');
  const gzip = encodings.includes('gzip') || encodings.includes('deflate');

  // Brotli offers superior compression ratios (up to 20% smaller than Gzip for HTML/JS/WASM)
  const preferred = brotli ? 'br' : gzip ? 'gzip' : 'none';

  return { brotli, gzip, preferred };
}

/**
 * Calculates estimated payload size reduction under Brotli or Gzip.
 */
export function estimateCompressedSize(
  rawBytes: number,
  format: 'br' | 'gzip' = 'br'
): { estimatedBytes: number; savedBytes: number; reductionRatio: string } {
  // Typical text/json/js/wasm compression ratios: Brotli ~72%, Gzip ~66%
  const ratio = format === 'br' ? 0.28 : 0.34;
  const estimatedBytes = Math.round(rawBytes * ratio);
  const savedBytes = rawBytes - estimatedBytes;
  const reductionPercent = Math.round((1 - ratio) * 100);

  return {
    estimatedBytes,
    savedBytes,
    reductionRatio: `${reductionPercent}% reduction`,
  };
}

// ================= 3. DATABASE IN-MEMORY INDEXING ENGINE =================

export type DbUser = DatabaseState['users'][0];

export class DatabaseIndexEngine {
  private gamesById = new Map<string, Game>();
  private gamesBySlug = new Map<string, Game>();
  private gamesByCategory = new Map<string, Game[]>();
  private usersById = new Map<string, DbUser>();
  private usersByEmail = new Map<string, DbUser>();
  private referralsByToken = new Map<string, ReferralLink>();

  private isBuilt = false;

  public rebuildIndexes(state: DatabaseState): void {
    this.gamesById.clear();
    this.gamesBySlug.clear();
    this.gamesByCategory.clear();
    this.usersById.clear();
    this.usersByEmail.clear();
    this.referralsByToken.clear();

    // 1. Index Games
    for (const game of state.games) {
      this.gamesById.set(game.id, game);
      this.gamesBySlug.set(game.slug.toLowerCase(), game);

      const catList = this.gamesByCategory.get(game.categoryId) || [];
      catList.push(game);
      this.gamesByCategory.set(game.categoryId, catList);
    }

    // 2. Index Users
    for (const user of state.users) {
      this.usersById.set(user.id, user);
      this.usersByEmail.set(user.email.toLowerCase(), user);
    }

    // 3. Index Referral Links
    if (state.referralLinks) {
      for (const link of state.referralLinks) {
        this.referralsByToken.set(link.token, link);
      }
    }

    this.isBuilt = true;
  }

  public getGameById(id: string): Game | undefined {
    return this.gamesById.get(id);
  }

  public getGameBySlug(slug: string): Game | undefined {
    return this.gamesBySlug.get(slug.toLowerCase());
  }

  public getGamesByCategory(categoryId: string): Game[] {
    return this.gamesByCategory.get(categoryId) || [];
  }

  public getUserByEmail(email: string): DbUser | undefined {
    return this.usersByEmail.get(email.toLowerCase());
  }

  public getUserById(id: string): DbUser | undefined {
    return this.usersById.get(id);
  }

  public getReferralByToken(token: string): ReferralLink | undefined {
    return this.referralsByToken.get(token);
  }

  public getIndexStats(): {
    isBuilt: boolean;
    indexedGames: number;
    indexedUsers: number;
    indexedReferrals: number;
    indexedCategories: number;
  } {
    return {
      isBuilt: this.isBuilt,
      indexedGames: this.gamesById.size,
      indexedUsers: this.usersById.size,
      indexedReferrals: this.referralsByToken.size,
      indexedCategories: this.gamesByCategory.size,
    };
  }
}

// Global Index Singleton
export const globalIndexEngine = new DatabaseIndexEngine();

// ================= 4. CONCURRENCY & STRESS SIMULATION ENGINE =================

export interface ConcurrencyBenchmarkResult {
  concurrencyLevel: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  elapsedMs: number;
  requestsPerSecond: number;
  latency: {
    avgMs: number;
    minMs: number;
    maxMs: number;
    p95Ms: number;
    p99Ms: number;
  };
}

/**
 * Runs a simulated high-concurrency stress test against an async workload function.
 * Evaluates throughput, latency distribution (avg, P95, P99), and failure rates.
 */
export async function runConcurrencyBenchmark<T>(
  totalRequests: number,
  concurrencyLimit: number,
  taskFn: (index: number) => Promise<T>
): Promise<ConcurrencyBenchmarkResult> {
  const latencies: number[] = [];
  let successCount = 0;
  let failCount = 0;

  const startTime = Date.now();
  let currentIndex = 0;

  // Worker runner consuming tasks from queue up to concurrencyLimit
  async function worker() {
    while (currentIndex < totalRequests) {
      const idx = currentIndex++;
      const reqStart = Date.now();
      try {
        await taskFn(idx);
        successCount++;
      } catch {
        failCount++;
      } finally {
        const reqDuration = Date.now() - reqStart;
        latencies.push(reqDuration);
      }
    }
  }

  // Spawn pool of concurrent workers
  const pool = Array.from(
    { length: Math.min(concurrencyLimit, totalRequests) },
    () => worker()
  );
  await Promise.all(pool);

  const elapsedMs = Math.max(1, Date.now() - startTime);
  const requestsPerSecond = Math.round((totalRequests / (elapsedMs / 1000)) * 10) / 10;

  // Calculate percentiles
  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const avgMs = Math.round((sum / latencies.length) * 10) / 10;
  const minMs = latencies[0] || 0;
  const maxMs = latencies[latencies.length - 1] || 0;
  const p95Index = Math.min(Math.floor(latencies.length * 0.95), latencies.length - 1);
  const p99Index = Math.min(Math.floor(latencies.length * 0.99), latencies.length - 1);

  return {
    concurrencyLevel: concurrencyLimit,
    totalRequests,
    successfulRequests: successCount,
    failedRequests: failCount,
    elapsedMs,
    requestsPerSecond,
    latency: {
      avgMs,
      minMs,
      maxMs,
      p95Ms: latencies[p95Index] || 0,
      p99Ms: latencies[p99Index] || 0,
    },
  };
}
