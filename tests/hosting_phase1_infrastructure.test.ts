import { describe, it, expect, beforeEach } from 'vitest';
import {
  GameverseStorageService,
  resolveMimeType,
  getAssetCacheControl,
  GAME_MIME_TYPES,
} from '../src/lib/storage';
import { gvDb } from '../src/lib/database';

describe('Phase 1: GameVerse Cloud Hosting, Storage & CDN Infrastructure', () => {
  let storage: GameverseStorageService;

  beforeEach(() => {
    storage = new GameverseStorageService();
  });

  describe('1. Storage & CDN Configuration', () => {
    it('should initialize storage configuration with valid defaults', () => {
      const config = storage.getConfig();
      expect(config).toBeDefined();
      expect(config.bucket).toBeDefined();
      expect(config.publicCdnDomain).toContain('http');
      expect(config.gameServingDomain).toContain('http');
      expect(config.maxUploadSizeBytes).toBeGreaterThan(10 * 1024 * 1024); // >= 10MB
    });

    it('should correctly configure Cloudflare R2 provider when R2 credentials are provided', () => {
      const r2Storage = new GameverseStorageService({
        provider: 'cloudflare_r2',
        bucket: 'prod-gameverse-games',
        endpoint: 'https://test-account-id.r2.cloudflarestorage.com',
        accessKeyId: 'test-r2-key',
        secretAccessKey: 'test-r2-secret',
        publicCdnDomain: 'https://cdn.gameverse.com',
        gameServingDomain: 'https://play.gameverse.com',
      });

      const config = r2Storage.getConfig();
      expect(config.provider).toBe('cloudflare_r2');
      expect(config.bucket).toBe('prod-gameverse-games');
      expect(config.endpoint).toContain('r2.cloudflarestorage.com');
      expect(config.publicCdnDomain).toBe('https://cdn.gameverse.com');
      expect(config.gameServingDomain).toBe('https://play.gameverse.com');
    });

    it('should correctly configure AWS S3 provider when S3 credentials are provided', () => {
      const s3Storage = new GameverseStorageService({
        provider: 'aws_s3',
        bucket: 'gameverse-games-s3',
        region: 'ap-south-1',
        accessKeyId: 'test-s3-key',
        secretAccessKey: 'test-s3-secret',
        publicCdnDomain: 'https://d123456.cloudfront.net',
        gameServingDomain: 'https://play.gameverse.com',
      });

      const config = s3Storage.getConfig();
      expect(config.provider).toBe('aws_s3');
      expect(config.bucket).toBe('gameverse-games-s3');
      expect(config.region).toBe('ap-south-1');
      expect(config.publicCdnDomain).toBe('https://d123456.cloudfront.net');
    });
  });

  describe('2. MIME Type Resolution & CDN Cache-Control Policies', () => {
    it('should resolve standard and WebGL game runtime MIME types', () => {
      expect(resolveMimeType('index.html')).toBe('text/html; charset=utf-8');
      expect(resolveMimeType('main.js')).toBe('application/javascript; charset=utf-8');
      expect(resolveMimeType('engine.wasm')).toBe('application/wasm');
      expect(resolveMimeType('bundle.data')).toBe('application/octet-stream');
      expect(resolveMimeType('style.css')).toBe('text/css; charset=utf-8');
      expect(resolveMimeType('texture.png')).toBe('image/png');
      expect(resolveMimeType('sfx.ogg')).toBe('audio/ogg');
      expect(resolveMimeType('font.woff2')).toBe('font/woff2');
    });

    it('should enforce immutable long-term caching for versioned static assets', () => {
      expect(getAssetCacheControl('games/game-1/v1/main.js')).toBe('public, max-age=31536000, immutable');
      expect(getAssetCacheControl('games/game-1/v1/engine.wasm')).toBe('public, max-age=31536000, immutable');
      expect(getAssetCacheControl('games/game-1/v1/sprites.png')).toBe('public, max-age=31536000, immutable');
      expect(getAssetCacheControl('games/game-1/v1/theme.mp3')).toBe('public, max-age=31536000, immutable');
    });

    it('should enforce short revalidation for entry index.html and manifest.json to enable atomic version updates', () => {
      expect(getAssetCacheControl('games/game-1/v1/index.html')).toBe('public, max-age=0, s-maxage=60, must-revalidate');
      expect(getAssetCacheControl('games/game-1/v1/manifest.json')).toBe('public, max-age=0, s-maxage=60, must-revalidate');
    });
  });

  describe('3. Object Operations & Presigned Upload Lifecycle', () => {
    it('should create presigned upload session url with expiration and headers', async () => {
      const presigned = await storage.createPresignedUploadUrl({
        key: 'games/game-test/uploads/bundle.zip',
        contentType: 'application/zip',
        expiresInSeconds: 600,
      });

      expect(presigned.uploadUrl).toBeDefined();
      expect(presigned.storageKey).toBe('games/game-test/uploads/bundle.zip');
      expect(new Date(presigned.expiresAt).getTime()).toBeGreaterThan(Date.now());
      expect(presigned.headers['Content-Type']).toBe('application/zip');
    });

    it('should upload, retrieve, check existence, and delete object with data integrity', async () => {
      const testKey = `games/test-slug/v1/test_asset_${Date.now()}.json`;
      const testContent = Buffer.from(JSON.stringify({ game: 'CyberQuest', version: '1.0.0' }));

      // 1. Upload
      const uploadRes = await storage.uploadObject(testKey, testContent, 'application/json');
      expect(uploadRes.key).toBe(testKey);
      expect(uploadRes.sizeBytes).toBe(testContent.length);
      expect(uploadRes.etag).toBeDefined();
      expect(uploadRes.publicUrl).toContain(testKey);

      // 2. Head object
      const headRes = await storage.headObject(testKey);
      expect(headRes.exists).toBe(true);
      expect(headRes.contentLength).toBe(testContent.length);

      // 3. Get object
      const getRes = await storage.getObject(testKey);
      expect(getRes).not.toBeNull();
      expect(getRes!.body.toString()).toBe(testContent.toString());
      expect(getRes!.contentType).toBe('application/json; charset=utf-8');

      // 4. Delete object
      const deleteRes = await storage.deleteObject(testKey);
      expect(deleteRes).toBe(true);

      // Verify deletion
      const headAfter = await storage.headObject(testKey);
      expect(headAfter.exists).toBe(false);
    });

    it('should pass infrastructure connectivity test probe', async () => {
      const probe = await storage.testStorageConnectivity();
      expect(probe.connected).toBe(true);
      expect(probe.latencyMs).toBeGreaterThanOrEqual(0);
      expect(probe.publicCdnDomain).toBeDefined();
      expect(probe.gameServingDomain).toBeDefined();
    });
  });

  describe('4. Isolated Game Domain & CDN URL Resolution', () => {
    it('should generate stable game URL on dedicated serving origin (offloading application server)', () => {
      const stableUrl = storage.getStableGameUrl('neon-runner');
      expect(stableUrl).toBe('https://play.gameverse.com/neon-runner/');
      // Must not point to application server route /api/sandbox/...
      expect(stableUrl).not.toContain('/api/sandbox/');
    });

    it('should generate versioned immutable CDN URL for static game assets', () => {
      const cdnUrl = storage.getPublicCdnUrl('games/neon-runner/v1.0.0/assets/engine.wasm');
      expect(cdnUrl).toBe('https://cdn.gameverse.com/games/neon-runner/v1.0.0/assets/engine.wasm');
    });

    it('should generate version preview URL for developer staging reviews', () => {
      const previewUrl = storage.getVersionPreviewUrl('neon-runner', 'v2.0.0');
      expect(previewUrl).toBe('https://play.gameverse.com/preview/neon-runner/v2.0.0/');
    });
  });

  describe('5. Database Schema Extensions for Storage, Manifests & Rollback', () => {
    it('should create and retrieve upload sessions in database', () => {
      const session = gvDb.createUploadSession({
        gameId: 'game-neon-runner',
        developerId: 'usr-dev-1',
        fileName: 'build_v1_1_0.zip',
        fileSizeBytes: 24500000,
        status: 'INITIALIZED',
        uploadUrl: 'https://upload.gameverse.com/presigned',
        storageKey: 'games/game-neon-runner/uploads/build_v1_1_0.zip',
      });

      expect(session.id).toBeDefined();
      expect(session.status).toBe('INITIALIZED');

      const retrieved = gvDb.getUploadSession(session.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.fileName).toBe('build_v1_1_0.zip');

      const updated = gvDb.updateUploadSession(session.id, { status: 'COMPLETED' });
      expect(updated?.status).toBe('COMPLETED');
    });

    it('should create and retrieve game file manifests', () => {
      const manifest = gvDb.createManifest({
        versionId: 'ver-neon-runner-1_1_0',
        gameId: 'game-neon-runner',
        entryPoint: 'index.html',
        files: [
          {
            path: 'index.html',
            sizeBytes: 1540,
            sha256: 'abc123sha',
            contentType: 'text/html; charset=utf-8',
            storageKey: 'games/game-neon-runner/versions/v1.1.0/index.html',
            cdnUrl: 'https://cdn.gameverse.com/games/game-neon-runner/versions/v1.1.0/index.html',
          },
          {
            path: 'assets/game.wasm',
            sizeBytes: 12500000,
            sha256: 'wasm456sha',
            contentType: 'application/wasm',
            storageKey: 'games/game-neon-runner/versions/v1.1.0/assets/game.wasm',
            cdnUrl: 'https://cdn.gameverse.com/games/game-neon-runner/versions/v1.1.0/assets/game.wasm',
          },
        ],
        totalFilesCount: 2,
        totalSizeBytes: 12501540,
        manifestHash: 'combined_manifest_hash_123',
      });

      expect(manifest.id).toBeDefined();
      expect(manifest.totalFilesCount).toBe(2);

      const retrieved = gvDb.getManifestByVersionId('ver-neon-runner-1_1_0');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.entryPoint).toBe('index.html');
      expect(retrieved?.files[1].path).toBe('assets/game.wasm');
    });

    it('should record and audit version rollbacks in database', () => {
      const rollback = gvDb.recordRollback({
        gameId: 'game-neon-runner',
        fromVersionId: 'ver-neon-runner-1_1_0',
        toVersionId: 'ver-neon-runner-1_0_0',
        triggeredBy: 'usr-dev-1',
        triggeredByName: 'PixelForge Studios',
        triggeredByRole: 'DEVELOPER',
        reason: 'Critical WebGL shader regression detected on mobile devices.',
      });

      expect(rollback.id).toBeDefined();
      expect(rollback.fromVersionId).toBe('ver-neon-runner-1_1_0');
      expect(rollback.toVersionId).toBe('ver-neon-runner-1_0_0');

      const history = gvDb.getRollbackHistory('game-neon-runner');
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].reason).toContain('WebGL shader regression');
    });

    it('should update and query game storage usage metrics', () => {
      const metrics = gvDb.updateStorageMetrics('game-neon-runner', 'usr-dev-1', {
        totalStorageBytes: 45000000,
        totalAssetsCount: 142,
        totalBandwidthBytesServed: 850000000,
      });

      expect(metrics.totalStorageBytes).toBe(45000000);
      expect(metrics.totalAssetsCount).toBe(142);
      expect(metrics.totalBandwidthBytesServed).toBe(850000000);

      const fetched = gvDb.getStorageMetrics('game-neon-runner');
      expect(fetched?.totalStorageBytes).toBe(45000000);
    });
  });
});
