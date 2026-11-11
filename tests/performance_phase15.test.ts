import { describe, it, expect, beforeEach } from 'vitest';
import {
  CACHE_PROFILES,
  getEdgeCacheHeaders,
  checkCompressionSupport,
  estimateCompressedSize,
  DatabaseIndexEngine,
  globalIndexEngine,
  runConcurrencyBenchmark,
} from '../src/lib/performance';
import { gvDb } from '../src/lib/database';

describe('Phase 15: Performance Optimization, CDN Edge Caching & Stress Testing', () => {
  beforeEach(() => {
    gvDb.resetToSeed();
    globalIndexEngine.rebuildIndexes(gvDb.state);
  });

  // ================= 1. CDN EDGE CACHE HEADERS VALIDATION =================
  it('1. should construct correct Edge CDN Cache-Control headers for static, public, and private assets', () => {
    // 1. Public catalog caching (1 min edge, 5 min SWR)
    const catalogHeaders = getEdgeCacheHeaders('PUBLIC_CATALOG', ['catalog', 'games-list']);
    expect(catalogHeaders['Cache-Control']).toBe(CACHE_PROFILES.PUBLIC_CATALOG);
    expect(catalogHeaders['CDN-Cache-Control']).toBe(CACHE_PROFILES.PUBLIC_CATALOG);
    expect(catalogHeaders['Cloudflare-CDN-Cache-Control']).toBe(CACHE_PROFILES.PUBLIC_CATALOG);
    expect(catalogHeaders['Vary']).toBe('Accept-Encoding');
    expect(catalogHeaders['Cache-Tag']).toBe('catalog,games-list');

    // 2. Static immutable caching (1 year immutable)
    const staticHeaders = getEdgeCacheHeaders('STATIC_IMMUTABLE');
    expect(staticHeaders['Cache-Control']).toBe('public, max-age=31536000, immutable');

    // 3. Game build asset caching
    const buildHeaders = getEdgeCacheHeaders('GAME_BUILD_ASSETS');
    expect(buildHeaders['Cache-Control']).toContain('max-age=86400');
    expect(buildHeaders['Cache-Control']).toContain('s-maxage=604800');

    // 4. Private user data (MUST NEVER BE CACHED ON CDN)
    const privateHeaders = getEdgeCacheHeaders('PRIVATE_USER_DATA');
    expect(privateHeaders['Cache-Control']).toBe('private, no-cache, no-store, must-revalidate');
    expect(privateHeaders['CDN-Cache-Control']).toBeUndefined();
    expect(privateHeaders['Cloudflare-CDN-Cache-Control']).toBeUndefined();
  });

  // ================= 2. BROTLI & GZIP COMPRESSION DETECTION =================
  it('2. should evaluate client compression capabilities and calculate payload reduction estimates', () => {
    // Brotli preferred when supported
    const clientWithBr = checkCompressionSupport('gzip, deflate, br');
    expect(clientWithBr.brotli).toBe(true);
    expect(clientWithBr.gzip).toBe(true);
    expect(clientWithBr.preferred).toBe('br');

    // Fallback to Gzip
    const clientGzipOnly = checkCompressionSupport('gzip, deflate');
    expect(clientGzipOnly.brotli).toBe(false);
    expect(clientGzipOnly.gzip).toBe(true);
    expect(clientGzipOnly.preferred).toBe('gzip');

    // No compression
    const clientNone = checkCompressionSupport(null);
    expect(clientNone.preferred).toBe('none');

    // Estimated size reduction for 500 KB WebGL bundle
    const estimateBr = estimateCompressedSize(500 * 1024, 'br');
    expect(estimateBr.estimatedBytes).toBeLessThan(160 * 1024);
    expect(estimateBr.savedBytes).toBeGreaterThan(340 * 1024);
    expect(estimateBr.reductionRatio).toContain('72% reduction');
  });

  // ================= 3. IN-MEMORY DATABASE INDEXING =================
  it('3. should build and query in-memory database indexes with O(1) complexity', () => {
    const stats = globalIndexEngine.getIndexStats();
    expect(stats.isBuilt).toBe(true);
    expect(stats.indexedGames).toBeGreaterThan(0);
    expect(stats.indexedUsers).toBeGreaterThan(0);

    // Fast O(1) game lookup by ID and slug
    const gameById = globalIndexEngine.getGameById('game-neon-runner');
    expect(gameById).toBeDefined();
    expect(gameById?.title).toContain('Neon Cyber Runner');

    const gameBySlug = globalIndexEngine.getGameBySlug('neon-runner');
    expect(gameBySlug).toBeDefined();
    expect(gameBySlug?.id).toBe('game-neon-runner');

    // Fast O(1) user lookup by email
    const user = globalIndexEngine.getUserByEmail('admin@gameverse.com');
    expect(user).toBeDefined();
    expect(user?.role).toBe('ADMIN');

    // Category list index
    const arcadeGames = globalIndexEngine.getGamesByCategory('cat-arcade');
    expect(arcadeGames.length).toBeGreaterThan(0);
  });

  // ================= 4. CONCURRENCY BENCHMARK: 100 PLAYERS =================
  it('4. should successfully sustain 100 concurrent player requests with 0% failure rate', async () => {
    const result = await runConcurrencyBenchmark(100, 20, async (index) => {
      // Simulate fast catalog retrieval
      return gvDb.getGameById('game-neon-runner');
    });

    expect(result.totalRequests).toBe(100);
    expect(result.successfulRequests).toBe(100);
    expect(result.failedRequests).toBe(0);
    expect(result.latency.avgMs).toBeLessThan(50);
    expect(result.requestsPerSecond).toBeGreaterThan(0);
  });

  // ================= 5. CONCURRENCY BENCHMARK: 500 PLAYERS =================
  it('5. should handle 500 concurrent player session queries with sub-50ms average latency', async () => {
    const result = await runConcurrencyBenchmark(500, 50, async (index) => {
      // Alternating query workload
      if (index % 2 === 0) {
        return gvDb.getGameBySlug('neon-runner');
      } else {
        return gvDb.getCategories();
      }
    });

    expect(result.totalRequests).toBe(500);
    expect(result.successfulRequests).toBe(500);
    expect(result.failedRequests).toBe(0);
    expect(result.latency.p95Ms).toBeLessThan(100);
    expect(result.latency.p99Ms).toBeLessThan(200);
  });

  // ================= 6. CONCURRENCY BENCHMARK: 1,000 PLAYERS =================
  it('6. should execute 1,000 simulated concurrent player telemetry requests with high throughput', async () => {
    const result = await runConcurrencyBenchmark(1000, 100, async (index) => {
      // Simulate reading game details + developer settings
      const game = gvDb.getGameById('game-neon-runner');
      const categories = gvDb.getCategories();
      return { game, categories };
    });

    expect(result.totalRequests).toBe(1000);
    expect(result.successfulRequests).toBe(1000);
    expect(result.failedRequests).toBe(0);
    expect(result.requestsPerSecond).toBeGreaterThan(100);
  });

  // ================= 7. HIGH-CONCURRENCY STRESS TEST: 5,000 SESSIONS =================
  it('7. should endure a massive 5,000 requests concurrency burst without connection drops or errors', async () => {
    const result = await runConcurrencyBenchmark(5000, 250, async (index) => {
      // High-throughput multi-entity read
      const user = gvDb.findUserById('usr-admin-1');
      const game = gvDb.getGameById('game-neon-runner');
      return { userTitle: user?.name, gameTitle: game?.title };
    });

    expect(result.totalRequests).toBe(5000);
    expect(result.successfulRequests).toBe(5000);
    expect(result.failedRequests).toBe(0);
    expect(result.elapsedMs).toBeGreaterThan(0);
    expect(result.latency.avgMs).toBeLessThan(100);
  });

  // ================= 8. DEDICATED INDEX ENGINE REBUILD ISOLATION =================
  it('8. should dynamically reflect database mutations upon index rebuild', () => {
    const customEngine = new DatabaseIndexEngine();
    customEngine.rebuildIndexes(gvDb.state);

    expect(customEngine.getGameById('game-test-perf')).toBeUndefined();

    // Create a new game in database
    const newGame = gvDb.createGame({
      id: 'game-test-perf',
      title: 'Performance Benchmark Odyssey',
      developerId: 'usr-dev-1',
      categoryId: 'cat-action',
    });

    // Rebuild index and verify instant O(1) availability
    customEngine.rebuildIndexes(gvDb.state);
    const found = customEngine.getGameById('game-test-perf');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Performance Benchmark Odyssey');

    const bySlug = customEngine.getGameBySlug('performance-benchmark-odyssey');
    expect(bySlug?.id).toBe('game-test-perf');
  });
});
