import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { gvDb } from '@/lib/database';
import { globalIndexEngine } from '@/lib/performance';
import { verifyAuditTrailIntegrity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'UP' | 'DOWN'; latencyMs?: number; details?: any }> = {};

  // 1. Database Check
  try {
    const dbStart = Date.now();
    const gameCount = gvDb.state.games.length;
    const userCount = gvDb.state.users.length;
    checks.database = {
      status: 'UP',
      latencyMs: Date.now() - dbStart,
      details: {
        totalGames: gameCount,
        totalUsers: userCount,
        totalReviews: gvDb.state.reviews.length,
        totalAuditLogs: gvDb.state.auditLogs.length,
      },
    };
  } catch (err: any) {
    checks.database = { status: 'DOWN', details: err.message };
  }

  // 2. In-Memory Index Engine Check
  try {
    const idxStart = Date.now();
    if (!globalIndexEngine.getIndexStats().isBuilt) {
      globalIndexEngine.rebuildIndexes(gvDb.state);
    }
    const stats = globalIndexEngine.getIndexStats();
    checks.indexes = {
      status: stats.isBuilt ? 'UP' : 'DOWN',
      latencyMs: Date.now() - idxStart,
      details: stats,
    };
  } catch (err: any) {
    checks.indexes = { status: 'DOWN', details: err.message };
  }

  // 3. Storage Directory & Filesystem Check
  try {
    const dataDir = path.resolve(process.cwd(), '.data');
    const exists = fs.existsSync(dataDir);
    checks.storage = {
      status: exists ? 'UP' : 'DOWN',
      details: {
        dataDirectory: dataDir,
        exists,
      },
    };
  } catch (err: any) {
    checks.storage = { status: 'DOWN', details: err.message };
  }

  // 4. Security & Audit Trail Integrity
  try {
    const auditStart = Date.now();
    const auditCheck = verifyAuditTrailIntegrity();
    checks.security = {
      status: auditCheck.valid ? 'UP' : 'DOWN',
      latencyMs: Date.now() - auditStart,
      details: {
        auditChainIntact: auditCheck.valid,
        recordsChecked: auditCheck.totalChecked,
      },
    };
  } catch (err: any) {
    checks.security = { status: 'DOWN', details: err.message };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'UP');
  const elapsedTotal = Date.now() - startTime;

  return NextResponse.json(
    {
      status: allHealthy ? 'HEALTHY' : 'DEGRADED',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      responseTimeMs: elapsedTotal,
      checks,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    },
    { status: allHealthy ? 200 : 503 }
  );
}
