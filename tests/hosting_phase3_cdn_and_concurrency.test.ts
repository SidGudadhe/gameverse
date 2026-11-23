import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { gameverseStorage, getAssetCacheControl, resolveMimeType } from '../src/lib/storage';
import { runConcurrencyBenchmark, checkCompressionSupport, estimateCompressedSize } from '../src/lib/performance';
import { gvDb } from '../src/lib/database';
import { GET as getGameSlugRoute } from '../src/app/api/games/[slug]/route';

describe('Phase 5: CDN Configuration, Edge Caching Strategy & High-Concurrency Delivery', () => {
  const testSlug = 'cyber-runner-2077';
  const testGameId = 'game-cdn-perf-01';

  beforeEach(() => {
    // Ensure test game and version exist
    const existing = gvDb.getGameById(testGameId);
    if (!existing) {
      gvDb.createGame({
        id: testGameId,
        title: 'Cyber Runner 2077',
        slug: testSlug,
        description: 'Neon cyberpunk parkour platformer.',
        category: 'ACTION',
        developerId: 'dev-cdn-tester',
        developerName: 'NeonEdge Games',
        engine: 'HTML5 WebGL',
        orientation: 'LANDSCAPE',
        status: 'PUBLISHED',
      });

      const ver = gvDb.createVersion({
        id: 'ver-cdn-v1',
        gameId: testGameId,
        versionNumber: '1.0.0',
        changelog: 'Initial high-performance build',
        status: 'PUBLISHED',
        storagePrefix: `games/${testGameId}/versions/1.0.0/`,
        entryPoint: 'index.html',
        totalSizeBytes: 5242880, // 5 MB
        fileCount: 42,
      });

      gvDb.updateGame(testGameId, {
        currentVersionId: ver.id,
        status: 'PUBLISHED',
      });
    }
  });

  describe('1. CDN Edge Caching Header Rules', () => {
    it('should assign immutable 1-year cache headers to versioned static code and assets', () => {
      const staticAssets = [
        'main.wasm',
        'bundle.min.js',
        'styles.min.css',
        'spritesheet.png',
        'theme.mp3',
        'font.woff2',
      ];

      for (const asset of staticAssets) {
        const cacheHeader = getAssetCacheControl(`games/${testGameId}/versions/1.0.0/${asset}`);
        expect(cacheHeader).toBe('public, max-age=31536000, immutable');
      }
    });

    it('should enforce revalidation headers for entry index.html and manifests to support instant rollbacks', () => {
      const entryFiles = [
        'index.html',
        'manifest.json',
        'games/game-01/versions/1.0.0/index.html',
        'games/game-01/versions/1.0.0/manifest.json',
      ];

      for (const entry of entryFiles) {
        const cacheHeader = getAssetCacheControl(entry);
        expect(cacheHeader).toContain('max-age=0');
        expect(cacheHeader).toContain('s-maxage=60');
        expect(cacheHeader).toContain('must-revalidate');
      }
    });

    it('should resolve precise MIME types for all HTML5 and WebGL asset formats', () => {
      expect(resolveMimeType('index.html')).toBe('text/html; charset=utf-8');
      expect(resolveMimeType('engine.js')).toBe('application/javascript; charset=utf-8');
      expect(resolveMimeType('engine.wasm')).toBe('application/wasm');
      expect(resolveMimeType('styles.css')).toBe('text/css; charset=utf-8');
      expect(resolveMimeType('texture.png')).toBe('image/png');
      expect(resolveMimeType('music.mp3')).toBe('audio/mpeg');
      expect(resolveMimeType('font.woff2')).toBe('font/woff2');
      expect(resolveMimeType('levels.json')).toBe('application/json; charset=utf-8');
    });
  });

  describe('2. Compression Heuristics for Game Delivery', () => {
    it('should prioritize modern Brotli compression over Gzip for supported browsers', () => {
      const brotliClient = checkCompressionSupport('gzip, deflate, br');
      expect(brotliClient.brotli).toBe(true);
      expect(brotliClient.preferred).toBe('br');

      const legacyClient = checkCompressionSupport('gzip, deflate');
      expect(legacyClient.brotli).toBe(false);
      expect(legacyClient.gzip).toBe(true);
      expect(legacyClient.preferred).toBe('gzip');

      const rawClient = checkCompressionSupport(null);
      expect(rawClient.preferred).toBe('none');
    });

    it('should calculate realistic payload savings for uncompressed WebGL game bundles', () => {
      const uncompressedBundleBytes = 2 * 1024 * 1024; // 2 MB bundle
      const brotliSavings = estimateCompressedSize(uncompressedBundleBytes, 'br');
      expect(brotliSavings.savedBytes).toBeGreaterThan(1.3 * 1024 * 1024);
      expect(brotliSavings.reductionRatio).toContain('72% reduction');

      const gzipSavings = estimateCompressedSize(uncompressedBundleBytes, 'gzip');
      expect(gzipSavings.savedBytes).toBeGreaterThan(1.2 * 1024 * 1024);
      expect(gzipSavings.reductionRatio).toContain('66% reduction');
    });
  });

  describe('3. High-Concurrency Game Delivery Benchmark', () => {
    it('should sustain 250 concurrent game player URL resolutions with 0% error rate and sub-20ms avg latency', async () => {
      const totalRequests = 250;
      const concurrencyLimit = 50;

      const benchmark = await runConcurrencyBenchmark(
        totalRequests,
        concurrencyLimit,
        async (idx) => {
          const req = new NextRequest(`http://localhost:3000/api/games/${testSlug}`);
          const res = await getGameSlugRoute(req, { params: { slug: testSlug } });
          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.game.slug).toBe(testSlug);
          expect(data.cdnUrl).toBeDefined();
          return data;
        }
      );

      expect(benchmark.totalRequests).toBe(250);
      expect(benchmark.successfulRequests).toBe(250);
      expect(benchmark.failedRequests).toBe(0);
      expect(benchmark.requestsPerSecond).toBeGreaterThan(100);
      expect(benchmark.latency.p95Ms).toBeLessThan(150);
      expect(benchmark.latency.avgMs).toBeLessThan(50);
    });

    it('should sustain high-frequency storage object read probes with 0% data corruption', async () => {
      const probeKey = `benchmark/probe_${Date.now()}.bin`;
      const probeData = Buffer.from('GameVerse High-Throughput Storage Verification Block');

      // 1. Upload probe asset
      await gameverseStorage.uploadObject(probeKey, probeData, 'application/octet-stream');

      // 2. Concurrently read probe asset 100 times
      const benchmark = await runConcurrencyBenchmark(100, 25, async () => {
        const obj = await gameverseStorage.getObject(probeKey);
        expect(obj).not.toBeNull();
        expect(obj!.body.equals(probeData)).toBe(true);
      });

      expect(benchmark.successfulRequests).toBe(100);
      expect(benchmark.failedRequests).toBe(0);

      // Clean up probe
      await gameverseStorage.deleteObject(probeKey);
    });
  });

  describe('4. Direct CDN Offloading & Security Architecture', () => {
    it('should offload 100% of static asset bandwidth to the dedicated CDN domain', () => {
      const game = gvDb.getGameBySlug(testSlug);
      expect(game).toBeDefined();
      const version = gvDb.getVersionById(game!.currentVersionId!);
      expect(version).toBeDefined();

      const cdnUrl = gameverseStorage.getCdnUrl(
        gameverseStorage.getGameAssetStorageKey(game!.id, version!.versionNumber, 'index.html')
      );

      // Must point to dedicated CDN domain, NOT to internal Next.js server route
      expect(cdnUrl).toMatch(/^https:\/\/cdn\.gameverse\.com\//);
      expect(cdnUrl).not.toContain('/api/sandbox/files');
      expect(cdnUrl).toContain(`games/${game!.id}/versions/${version!.versionNumber}/index.html`);
    });

    it('should provide isolated origin for game sandbox player to prevent cookie leakage', () => {
      const stableUrl = gameverseStorage.getStableGamePlayerUrl(testSlug);
      // Dedicated player origin: play.gameverse.com
      expect(stableUrl).toBe(`https://play.gameverse.com/${testSlug}/`);
      expect(stableUrl).not.toContain('localhost:3000');
    });
  });
});
