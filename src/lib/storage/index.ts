import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  StorageConfig,
  StorageProviderType,
  GameManifestEntry,
} from '@/types';

// Standard MIME type mapping for game runtime assets
export const GAME_MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf',
  '.data': 'application/octet-stream',
  '.bin': 'application/octet-stream',
  '.pck': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

export function resolveMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return GAME_MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Returns the production HTTP caching header for game assets:
 * - Versioned static assets (JS, CSS, WASM, textures, audio): Immutable 1-year cache.
 * - Entry point (index.html, manifest.json): No-cache / short revalidation to support instant version switching.
 */
export function getAssetCacheControl(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();

  if (base === 'index.html' || base === 'manifest.json' || ext === '.html') {
    return 'public, max-age=0, s-maxage=60, must-revalidate';
  }

  // Immutable versioned game dependencies
  return 'public, max-age=31536000, immutable';
}

export class GameverseStorageService {
  private config: StorageConfig;
  private s3Client: S3Client | null = null;
  private localRootDir: string;

  constructor(customConfig?: Partial<StorageConfig>) {
    const provider = (process.env.GAMEVERSE_STORAGE_PROVIDER as StorageProviderType) ||
      (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID ? 'cloudflare_r2' :
       process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET ? 'aws_s3' : 'local_isolated');

    const bucket = process.env.R2_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'gameverse-games';
    const publicCdnDomain = process.env.R2_PUBLIC_DOMAIN || process.env.CLOUDFRONT_DOMAIN || process.env.NEXT_PUBLIC_CDN_ORIGIN || 'https://cdn.gameverse.com';
    const gameServingDomain = process.env.GAME_SERVING_DOMAIN || process.env.NEXT_PUBLIC_SANDBOX_ORIGIN || 'https://play.gameverse.com';
    const maxUploadSizeBytes = Number(process.env.MAX_GAME_ZIP_BYTES) || 100 * 1024 * 1024; // 100MB limit

    this.config = {
      provider,
      bucket,
      region: process.env.AWS_REGION || 'auto',
      endpoint: process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : process.env.AWS_S3_ENDPOINT || undefined,
      accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
      publicCdnDomain: publicCdnDomain.replace(/\/+$/, ''),
      gameServingDomain: gameServingDomain.replace(/\/+$/, ''),
      enableHttps: process.env.NODE_ENV === 'production' || !publicCdnDomain.startsWith('http://localhost'),
      maxUploadSizeBytes,
      ...customConfig,
    };

    this.localRootDir = path.resolve(process.cwd(), '.data', 'cloud_storage_bucket', this.config.bucket);

    // Initialize S3 client for Cloudflare R2 or AWS S3 if credentials exist
    if (this.config.accessKeyId && this.config.secretAccessKey && this.config.provider !== 'local_isolated') {
      this.s3Client = new S3Client({
        region: this.config.region || 'auto',
        endpoint: this.config.endpoint,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
        forcePathStyle: this.config.provider === 'cloudflare_r2',
      });
    } else {
      // Ensure isolated local directory exists for test/local driver
      if (!fs.existsSync(this.localRootDir)) {
        fs.mkdirSync(this.localRootDir, { recursive: true });
      }
    }
  }

  public getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * Generates a secure Presigned Upload URL for direct client-to-storage transfer.
   * This offloads high-concurrency multipart and ZIP uploads away from the application server.
   */
  public async createPresignedUploadUrl(params: {
    key: string;
    contentType: string;
    maxSizeBytes?: number;
    expiresInSeconds?: number;
  }): Promise<{
    uploadUrl: string;
    storageKey: string;
    expiresAt: string;
    headers: Record<string, string>;
  }> {
    const { key, contentType, expiresInSeconds = 900 } = params; // Default 15 min expiration
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    if (this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });

      return {
        uploadUrl,
        storageKey: key,
        expiresAt,
        headers: {
          'Content-Type': contentType,
        },
      };
    }

    // Local sandbox driver fallback (mirrors real presigned behavior for tests/dev)
    const token = crypto.randomBytes(24).toString('hex');
    const localUploadEndpoint = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/developer/upload/presigned?token=${token}&key=${encodeURIComponent(key)}`;

    return {
      uploadUrl: localUploadEndpoint,
      storageKey: key,
      expiresAt,
      headers: {
        'Content-Type': contentType,
        'X-Gameverse-Upload-Token': token,
      },
    };
  }

  /**
   * Uploads an asset directly to cloud object storage (R2/S3) with appropriate CDN caching headers.
   */
  public async uploadObject(
    key: string,
    body: Buffer | Uint8Array,
    contentType?: string,
    metadata?: Record<string, string>,
    customCacheControl?: string
  ): Promise<{
    key: string;
    etag: string;
    sizeBytes: number;
    publicUrl: string;
  }> {
    const resolvedType = contentType || resolveMimeType(key);
    const cacheControl = customCacheControl || getAssetCacheControl(key);
    const sizeBytes = body.length;
    const sha256 = crypto.createHash('sha256').update(body).digest('hex');

    if (this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: resolvedType,
        CacheControl: cacheControl,
        Metadata: {
          ...metadata,
          'sha256-checksum': sha256,
        },
      });

      const response = await this.s3Client.send(command);
      return {
        key,
        etag: response.ETag?.replace(/"/g, '') || sha256,
        sizeBytes,
        publicUrl: this.getPublicCdnUrl(key),
      };
    }

    // Local isolated storage driver
    const localPath = path.resolve(this.localRootDir, key);
    const parentDir = path.dirname(localPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(localPath, body);

    return {
      key,
      etag: sha256,
      sizeBytes,
      publicUrl: this.getPublicCdnUrl(key),
    };
  }

  /**
   * Retrieves an object from storage.
   */
  public async getObject(key: string): Promise<{
    body: Buffer;
    contentType: string;
    contentLength: number;
    etag?: string;
  } | null> {
    if (this.s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        });
        const res = await this.s3Client.send(command);
        if (!res.Body) return null;

        const chunks: Uint8Array[] = [];
        for await (const chunk of res.Body as any) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        return {
          body: buffer,
          contentType: res.ContentType || resolveMimeType(key),
          contentLength: res.ContentLength || buffer.length,
          etag: res.ETag?.replace(/"/g, ''),
        };
      } catch (err: any) {
        if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
          return null;
        }
        throw err;
      }
    }

    // Local isolated storage
    const localPath = path.resolve(this.localRootDir, key);
    if (!fs.existsSync(localPath) || fs.statSync(localPath).isDirectory()) {
      return null;
    }
    const buffer = fs.readFileSync(localPath);
    return {
      body: buffer,
      contentType: resolveMimeType(key),
      contentLength: buffer.length,
      etag: crypto.createHash('sha256').update(buffer).digest('hex'),
    };
  }

  /**
   * Checks whether an object exists in storage without downloading its body.
   */
  public async headObject(key: string): Promise<{
    exists: boolean;
    contentLength?: number;
    contentType?: string;
    etag?: string;
  }> {
    if (this.s3Client) {
      try {
        const command = new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        });
        const res = await this.s3Client.send(command);
        return {
          exists: true,
          contentLength: res.ContentLength,
          contentType: res.ContentType,
          etag: res.ETag?.replace(/"/g, ''),
        };
      } catch (err: any) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
          return { exists: false };
        }
        throw err;
      }
    }

    const localPath = path.resolve(this.localRootDir, key);
    if (fs.existsSync(localPath) && !fs.statSync(localPath).isDirectory()) {
      const stat = fs.statSync(localPath);
      return {
        exists: true,
        contentLength: stat.size,
        contentType: resolveMimeType(key),
      };
    }
    return { exists: false };
  }

  /**
   * Deletes an object from storage.
   */
  public async deleteObject(key: string): Promise<boolean> {
    if (this.s3Client) {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    }

    const localPath = path.resolve(this.localRootDir, key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      return true;
    }
    return false;
  }

  /**
   * Constructs the canonical storage key for a versioned game asset.
   * e.g. games/game-001/versions/v1.0.0/index.html
   */
  public getGameAssetStorageKey(gameId: string, versionId: string, relativePath: string): string {
    const cleanRel = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    return `games/${gameId}/versions/${versionId}/${cleanRel}`;
  }

  /**
   * Resolves the immutable public CDN URL for an asset.
   * e.g. https://cdn.gameverse.com/games/game-001/versions/v1/assets/main.wasm
   */
  public getPublicCdnUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return `${this.config.publicCdnDomain}/${cleanKey}`;
  }

  /**
   * Resolves the direct CDN URL for a key. Alias of getPublicCdnUrl.
   */
  public getCdnUrl(key: string): string {
    return this.getPublicCdnUrl(key);
  }

  /**
   * Resolves the stable, isolated player URL for an active game title.
   * Resolves to the game-serving domain (e.g. https://play.gameverse.com/game-001/)
   * Users playing this game load static assets directly from the CDN without touching the application server.
   */
  public getStableGameUrl(gameSlug: string): string {
    return `${this.config.gameServingDomain}/${gameSlug}/`;
  }

  /**
   * Alias of getStableGameUrl
   */
  public getStableGamePlayerUrl(gameSlug: string): string {
    return this.getStableGameUrl(gameSlug);
  }

  /**
   * Resolves the specific version preview URL for developer QA.
   * e.g. https://play.gameverse.com/preview/game-001/v2/
   */
  public getVersionPreviewUrl(gameSlug: string, versionNumber: string): string {
    return `${this.config.gameServingDomain}/preview/${gameSlug}/${versionNumber}/`;
  }

  /**
   * Validates storage and CDN infrastructure connectivity.
   */
  public async testStorageConnectivity(): Promise<{
    connected: boolean;
    provider: StorageProviderType;
    bucket: string;
    publicCdnDomain: string;
    gameServingDomain: string;
    latencyMs: number;
    error?: string;
    details: Record<string, any>;
  }> {
    const startTime = Date.now();
    const probeKey = `__infrastructure_probes/ping_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.txt`;
    const probeContent = Buffer.from(`GameVerse Infrastructure Health Check ${new Date().toISOString()}`);

    try {
      // 1. Write probe
      await this.uploadObject(probeKey, probeContent, 'text/plain', { purpose: 'health_check' }, 'no-store');

      // 2. Read probe
      const readResult = await this.getObject(probeKey);
      if (!readResult || readResult.body.toString() !== probeContent.toString()) {
        throw new Error('Integrity mismatch during storage read/write verification probe.');
      }

      // 3. Delete probe
      await this.deleteObject(probeKey);

      const latencyMs = Date.now() - startTime;
      return {
        connected: true,
        provider: this.config.provider,
        bucket: this.config.bucket,
        publicCdnDomain: this.config.publicCdnDomain,
        gameServingDomain: this.config.gameServingDomain,
        latencyMs,
        details: {
          httpsEnforced: this.config.enableHttps,
          maxUploadSizeMB: Math.round(this.config.maxUploadSizeBytes / 1024 / 1024),
          clientInitialized: !!this.s3Client,
          endpoint: this.config.endpoint || 'local_filesystem',
        },
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: this.config.provider,
        bucket: this.config.bucket,
        publicCdnDomain: this.config.publicCdnDomain,
        gameServingDomain: this.config.gameServingDomain,
        latencyMs: Date.now() - startTime,
        error: err.message,
        details: {
          clientInitialized: !!this.s3Client,
        },
      };
    }
  }
}

// Global singleton instance
export const gameverseStorage = new GameverseStorageService();
