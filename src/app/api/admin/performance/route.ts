import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { globalIndexEngine, runConcurrencyBenchmark, CACHE_PROFILES } from '@/lib/performance';
import { gvDb } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, 'ADMIN');
    if (errorResponse) return errorResponse;

    const url = new URL(req.url);
    const runBenchmark = url.searchParams.get('runBenchmark') === 'true';
    const benchmarkConcurrency = Math.min(
      parseInt(url.searchParams.get('concurrency') || '100', 10),
      1000
    );
    const benchmarkRequests = Math.min(
      parseInt(url.searchParams.get('requests') || '500', 10),
      5000
    );

    const mem = process.memoryUsage();
    const indexStats = globalIndexEngine.getIndexStats();

    let benchmarkResult = null;
    if (runBenchmark) {
      // Simulate concurrent catalog reads against the indexed in-memory store
      benchmarkResult = await runConcurrencyBenchmark(
        benchmarkRequests,
        benchmarkConcurrency,
        async (i) => {
          // Alternating lookup between games, categories, and users
          if (i % 2 === 0) {
            return gvDb.getGameById('game-cyber-runner');
          } else {
            return gvDb.getCategories();
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsageMb: {
          rss: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
          heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
          heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
        },
      },
      indexes: indexStats,
      cacheProfiles: CACHE_PROFILES,
      benchmark: benchmarkResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Performance audit failed: ${err.message}` },
      { status: 500 }
    );
  }
}
