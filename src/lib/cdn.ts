/**
 * GameVerse CDN Edge Cache Simulator & Metrics Engine
 * RFC 7234 Compliant HTTP Caching & Edge PoP Offload Telemetry
 */

import { getAssetCacheControl, resolveMimeType } from './storage';

export type CacheStatus = 'HIT' | 'MISS' | 'BYPASS' | 'REVALIDATE';

export interface CacheEntry {
  url: string;
  cacheKey: string;
  headers: Record<string, string>;
  sizeBytes: number;
  etag: string;
  cachedAt: number;
  ttlSeconds: number;
  staleWhileRevalidateSeconds: number;
  isImmutable: boolean;
  isPrivate: boolean;
  mimeType: string;
}

export interface CacheLookupResult {
  status: CacheStatus;
  latencyMs: number;
  fromCache: boolean;
  bytesServed: number;
  etag?: string;
  cacheControl?: string;
  revalidated?: boolean;
}

export interface CdnMetrics {
  totalRequests: number;
  hits: number;
  misses: number;
  bypasses: number;
  revalidations: number;
  hitRatio: number;
  bandwidthSavedBytes: number;
  totalBytesServed: number;
  bandwidthOffloadRatio: number;
  // Aliases for seamless interface compatibility
  cacheHits: number;
  cacheMisses: number;
  cacheBypasses: number;
  cacheHitRatio: number;
  breakdownByType: Record<
    string,
    {
      requests: number;
      hits: number;
      misses: number;
      bypasses: number;
      hitRatio: number;
      bandwidthSavedBytes: number;
    }
  >;
}

export class CdnEdgeCacheSimulator {
  private cache = new Map<string, CacheEntry>();
  private totalRequests = 0;
  private hits = 0;
  private misses = 0;
  private bypasses = 0;
  private revalidations = 0;
  private bandwidthSavedBytes = 0;
  private totalBytesServed = 0;
  private typeMetrics: Record<
    string,
    {
      requests: number;
      hits: number;
      misses: number;
      bypasses: number;
      bandwidthSavedBytes: number;
    }
  > = {};

  constructor() {
    this.reset();
  }

  /**
   * Resets all internal cache state and telemetry metrics.
   */
  public reset(): void {
    this.cache.clear();
    this.totalRequests = 0;
    this.hits = 0;
    this.misses = 0;
    this.bypasses = 0;
    this.revalidations = 0;
    this.bandwidthSavedBytes = 0;
    this.totalBytesServed = 0;
    this.typeMetrics = {};
  }

  /**
   * Normalizes a URL for use as an RFC 7234 cache key.
   */
  public normalizeCacheKey(url: string): string {
    try {
      const parsed = new URL(url, 'https://cdn.gameverse.com');
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return url.split('?')[0].split('#')[0];
    }
  }

  /**
   * Categorizes asset type based on URL extension.
   */
  public getAssetCategory(url: string): string {
    const cleanUrl = url.split('?')[0].toLowerCase();
    if (cleanUrl.endsWith('.wasm')) return 'wasm';
    if (cleanUrl.endsWith('.js') || cleanUrl.endsWith('.mjs')) return 'javascript';
    if (cleanUrl.endsWith('.css')) return 'css';
    if (cleanUrl.endsWith('.png') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.svg')) return 'images';
    if (cleanUrl.endsWith('.mp3') || cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.wav')) return 'audio';
    if (cleanUrl.endsWith('.html') || cleanUrl.endsWith('.htm')) return 'html';
    if (cleanUrl.endsWith('.json') || cleanUrl.endsWith('.data') || cleanUrl.endsWith('.pck')) return 'data';
    return 'other';
  }

  /**
   * Estimates asset size in bytes when not explicitly provided.
   */
  private estimateAssetSize(url: string): number {
    const category = this.getAssetCategory(url);
    switch (category) {
      case 'wasm':
        return 4 * 1024 * 1024; // ~4 MB typical WebGL/WASM binary
      case 'javascript':
        return 250 * 1024; // ~250 KB JS bundle
      case 'css':
        return 45 * 1024; // ~45 KB CSS
      case 'images':
        return 120 * 1024; // ~120 KB image
      case 'audio':
        return 512 * 1024; // ~512 KB audio sample
      case 'data':
        return 1024 * 1024; // ~1 MB game assets package
      case 'html':
        return 15 * 1024; // ~15 KB HTML entrypoint
      default:
        return 20 * 1024;
    }
  }

  /**
   * Determines if a request should bypass edge caching according to RFC 7234.
   */
  private isBypassRequest(
    url: string,
    reqHeaders: Record<string, string>,
    respHeaders?: Record<string, string>
  ): boolean {
    const lowerReq = Object.fromEntries(
      Object.entries(reqHeaders).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()])
    );
    const lowerResp = respHeaders
      ? Object.fromEntries(Object.entries(respHeaders).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]))
      : {};

    const reqCc = lowerReq['cache-control'] || '';
    const respCc = lowerResp['cache-control'] || '';

    // Explicit bypass directives
    if (reqCc.includes('no-store') || lowerReq['pragma'] === 'no-cache') return true;
    if (respCc.includes('no-store') || respCc.includes('private')) return true;

    // Authorization or private user paths bypass edge caching
    if (lowerReq['authorization'] && !respCc.includes('public')) return true;
    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.includes('/api/auth') ||
      lowerUrl.includes('/api/admin') ||
      lowerUrl.includes('/api/analytics') ||
      lowerUrl.includes('/api/creator/payout')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Parses Cache-Control header into directives.
   */
  private parseCacheControl(headerValue: string): {
    maxAge: number;
    sMaxAge: number;
    staleWhileRevalidate: number;
    immutable: boolean;
    isPrivate: boolean;
  } {
    const directives = headerValue.split(',').map((d) => d.trim().toLowerCase());
    let maxAge = 0;
    let sMaxAge = 0;
    let staleWhileRevalidate = 0;
    let immutable = false;
    let isPrivate = false;

    for (const directive of directives) {
      if (directive.startsWith('max-age=')) {
        maxAge = parseInt(directive.split('=')[1], 10) || 0;
      } else if (directive.startsWith('s-maxage=')) {
        sMaxAge = parseInt(directive.split('=')[1], 10) || 0;
      } else if (directive.startsWith('stale-while-revalidate=')) {
        staleWhileRevalidate = parseInt(directive.split('=')[1], 10) || 0;
      } else if (directive === 'immutable') {
        immutable = true;
      } else if (directive === 'private') {
        isPrivate = true;
      }
    }

    return { maxAge, sMaxAge, staleWhileRevalidate, immutable, isPrivate };
  }

  /**
   * Pre-populates the cache with a warm entry (e.g., during startup or pre-warming).
   */
  public primeCache(
    url: string,
    headers: Record<string, string> = {},
    sizeBytes?: number
  ): void {
    const cacheKey = this.normalizeCacheKey(url);
    const resolvedSize = sizeBytes || this.estimateAssetSize(url);
    const cacheControlHeader = headers['Cache-Control'] || getAssetCacheControl(url);
    const parsedCc = this.parseCacheControl(cacheControlHeader);
    const ttlSeconds = parsedCc.sMaxAge > 0 ? parsedCc.sMaxAge : (parsedCc.maxAge > 0 ? parsedCc.maxAge : 31536000);

    this.cache.set(cacheKey, {
      url,
      cacheKey,
      headers: {
        'Cache-Control': cacheControlHeader,
        ...headers,
      },
      sizeBytes: resolvedSize,
      etag: `"${Date.now().toString(16)}-${resolvedSize.toString(16)}"`,
      cachedAt: Date.now(),
      ttlSeconds,
      staleWhileRevalidateSeconds: parsedCc.staleWhileRevalidate || 86400,
      isImmutable: parsedCc.immutable,
      isPrivate: parsedCc.isPrivate,
      mimeType: resolveMimeType(url),
    });
  }

  /**
   * Simulates an edge PoP cache request lookup according to RFC 7234.
   */
  public recordRequest(
    url: string,
    reqHeaders: Record<string, string> = {},
    respHeaders?: Record<string, string>,
    bodySize?: number
  ): CacheLookupResult {
    this.totalRequests++;
    const category = this.getAssetCategory(url);
    if (!this.typeMetrics[category]) {
      this.typeMetrics[category] = {
        requests: 0,
        hits: 0,
        misses: 0,
        bypasses: 0,
        bandwidthSavedBytes: 0,
      };
    }
    this.typeMetrics[category].requests++;

    const lowerReq = Object.fromEntries(
      Object.entries(reqHeaders).map(([k, v]) => [k.toLowerCase(), v])
    );
    const cacheKey = this.normalizeCacheKey(url);
    const assetSize = bodySize || this.estimateAssetSize(url);

    // 1. Check RFC 7234 bypass directives
    if (this.isBypassRequest(url, reqHeaders, respHeaders)) {
      this.bypasses++;
      this.typeMetrics[category].bypasses++;
      this.totalBytesServed += assetSize;
      const latencyMs = Math.floor(Math.random() * 20) + 25; // 25-45ms origin latency
      return {
        status: 'BYPASS',
        latencyMs,
        fromCache: false,
        bytesServed: assetSize,
      };
    }

    const cachedEntry = this.cache.get(cacheKey);
    const now = Date.now();

    // 2. Check if cached and fresh
    if (cachedEntry) {
      const ageSeconds = Math.max(0, (now - cachedEntry.cachedAt) / 1000);
      const isFresh = cachedEntry.isImmutable || ageSeconds < cachedEntry.ttlSeconds;

      if (isFresh) {
        this.hits++;
        this.typeMetrics[category].hits++;
        this.bandwidthSavedBytes += cachedEntry.sizeBytes;
        this.totalBytesServed += cachedEntry.sizeBytes;
        const latencyMs = Math.floor(Math.random() * 3) + 1; // 1-3ms edge PoP latency

        return {
          status: 'HIT',
          latencyMs,
          fromCache: true,
          bytesServed: cachedEntry.sizeBytes,
          etag: cachedEntry.etag,
          cacheControl: cachedEntry.headers['Cache-Control'],
        };
      }

      // Check conditional revalidation (ETag / If-None-Match)
      const ifNoneMatch = lowerReq['if-none-match'];
      if (ifNoneMatch && (ifNoneMatch === cachedEntry.etag || ifNoneMatch === '*')) {
        this.revalidations++;
        this.hits++; // 304 Not Modified counts as cached response
        this.typeMetrics[category].hits++;
        cachedEntry.cachedAt = now; // Reset freshness
        this.bandwidthSavedBytes += cachedEntry.sizeBytes - 300; // Small header overhead
        this.totalBytesServed += 300;
        const latencyMs = Math.floor(Math.random() * 5) + 5; // 5-10ms revalidation

        return {
          status: 'REVALIDATE',
          latencyMs,
          fromCache: true,
          bytesServed: 300,
          etag: cachedEntry.etag,
          revalidated: true,
        };
      }
    }

    // 3. Cache MISS - Fetch from origin storage and populate cache
    this.misses++;
    this.typeMetrics[category].misses++;
    this.totalBytesServed += assetSize;

    const cacheControlHeader =
      respHeaders?.['Cache-Control'] ||
      respHeaders?.['cache-control'] ||
      getAssetCacheControl(url);
    const parsedCc = this.parseCacheControl(cacheControlHeader);
    const ttlSeconds =
      parsedCc.sMaxAge > 0
        ? parsedCc.sMaxAge
        : parsedCc.maxAge > 0
        ? parsedCc.maxAge
        : 31536000;

    // Cache the object if not marked private/no-store
    if (!parsedCc.isPrivate) {
      this.cache.set(cacheKey, {
        url,
        cacheKey,
        headers: {
          'Cache-Control': cacheControlHeader,
          ...(respHeaders || {}),
        },
        sizeBytes: assetSize,
        etag: `"${now.toString(16)}-${assetSize.toString(16)}"`,
        cachedAt: now,
        ttlSeconds,
        staleWhileRevalidateSeconds: parsedCc.staleWhileRevalidate || 86400,
        isImmutable: parsedCc.immutable,
        isPrivate: false,
        mimeType: resolveMimeType(url),
      });
    }

    const latencyMs = Math.floor(Math.random() * 25) + 30; // 30-55ms origin latency

    return {
      status: 'MISS',
      latencyMs,
      fromCache: false,
      bytesServed: assetSize,
      cacheControl: cacheControlHeader,
    };
  }

  /**
   * Purges cached entries matching a URL or wildcard prefix.
   */
  public purge(urlOrPrefix?: string): number {
    if (!urlOrPrefix) {
      const count = this.cache.size;
      this.cache.clear();
      return count;
    }

    let purgedCount = 0;
    const cleanPrefix = this.normalizeCacheKey(urlOrPrefix);
    for (const [key] of Array.from(this.cache.entries())) {
      if (key.startsWith(cleanPrefix) || key === cleanPrefix) {
        this.cache.delete(key);
        purgedCount++;
      }
    }
    return purgedCount;
  }

  /**
   * Returns total number of cached entries in memory.
   */
  public getCachedEntriesCount(): number {
    return this.cache.size;
  }

  /**
   * Computes comprehensive edge cache telemetry and performance metrics.
   */
  public getMetrics(): CdnMetrics {
    const total = this.totalRequests;
    const hitRatio = total > 0 ? Math.round((this.hits / total) * 10000) / 100 : 0;
    const offloadRatio =
      this.totalBytesServed > 0
        ? Math.round((this.bandwidthSavedBytes / this.totalBytesServed) * 10000) / 100
        : 0;

    const breakdown: CdnMetrics['breakdownByType'] = {};
    for (const [category, data] of Object.entries(this.typeMetrics)) {
      const catRatio =
        data.requests > 0
          ? Math.round((data.hits / data.requests) * 10000) / 100
          : 0;
      breakdown[category] = {
        requests: data.requests,
        hits: data.hits,
        misses: data.misses,
        bypasses: data.bypasses,
        hitRatio: catRatio,
        bandwidthSavedBytes: data.bandwidthSavedBytes,
      };
    }

    return {
      totalRequests: total,
      hits: this.hits,
      misses: this.misses,
      bypasses: this.bypasses,
      revalidations: this.revalidations,
      hitRatio,
      bandwidthSavedBytes: this.bandwidthSavedBytes,
      totalBytesServed: this.totalBytesServed,
      bandwidthOffloadRatio: offloadRatio,
      // Compatibility aliases
      cacheHits: this.hits,
      cacheMisses: this.misses,
      cacheBypasses: this.bypasses,
      cacheHitRatio: hitRatio,
      breakdownByType: breakdown,
    };
  }
}

// Global edge cache simulator singleton
export const cdnEdgeCacheSimulator = new CdnEdgeCacheSimulator();
