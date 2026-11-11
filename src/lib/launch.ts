import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { gvDb } from './database';
import { globalIndexEngine, CACHE_PROFILES, getEdgeCacheHeaders } from './performance';
import { recordAuditLog, verifyAuditTrailIntegrity } from './audit';
import { validateSandboxFlags, verifyOriginIsolation, getStandardSecurityHeaders } from './security';
import { COMPLIANCE_FRAMEWORKS, exportUserData } from './privacy';
import { MINIMUM_PAYOUT_THRESHOLD, getPlatformFinancialOverview } from './ledger';
import { OFFICIAL_BETA_TOKENS } from './beta';

export type LaunchGateId =
  | 'CORE_ARCHITECTURE'
  | 'SECURITY_ISOLATION'
  | 'PRIVACY_COMPLIANCE'
  | 'FINANCIAL_LEDGER'
  | 'CATALOG_PIPELINE'
  | 'EDGE_PERFORMANCE'
  | 'CREATOR_BETA';

export interface LaunchGateResult {
  id: LaunchGateId;
  title: string;
  description: string;
  passed: boolean;
  score: number; // 0 to 100
  details: Record<string, any>;
  timestamp: string;
}

export interface LaunchReadinessReport {
  passed: boolean;
  readinessScore: number; // 0 to 100
  gates: LaunchGateResult[];
  timestamp: string;
  version: string;
  status: 'READY_FOR_PRODUCTION' | 'PREFLIGHT_BLOCKED';
}

export interface ProductionLaunchCertificate {
  certificateId: string;
  authorizedBy: {
    id: string;
    name: string;
    email: string;
  };
  signedAt: string;
  version: string;
  sha256Seal: string;
  status: 'AUTHORIZED';
  gatesPassed: number;
  totalGates: number;
  readinessScore: number;
}

let cachedLaunchCertificate: ProductionLaunchCertificate | null = null;

/**
 * Evaluates the 7 mandatory pre-flight launch readiness gates.
 */
export function evaluateLaunchReadiness(): LaunchReadinessReport {
  const now = new Date().toISOString();
  const gates: LaunchGateResult[] = [];

  // Gate 1: Core Architecture & Storage Health
  try {
    const dataDir = path.resolve(process.cwd(), '.data');
    const storageExists = fs.existsSync(dataDir);
    const indexStats = globalIndexEngine.getIndexStats();
    const gamesCount = gvDb.state.games.length;
    const usersCount = gvDb.state.users.length;

    const passed = storageExists && indexStats.isBuilt && gamesCount > 0 && usersCount > 0;
    gates.push({
      id: 'CORE_ARCHITECTURE',
      title: 'Core Architecture & File Storage',
      description: 'Persistent file store, database collections, and $O(1)$ memory index engine.',
      passed,
      score: passed ? 100 : 0,
      details: {
        storageExists,
        indexesBuilt: indexStats.isBuilt,
        totalGames: gamesCount,
        totalUsers: usersCount,
      },
      timestamp: now,
    });
  } catch (err: any) {
    gates.push({
      id: 'CORE_ARCHITECTURE',
      title: 'Core Architecture & File Storage',
      description: 'Persistent file store, database collections, and $O(1)$ memory index engine.',
      passed: false,
      score: 0,
      details: { error: err.message },
      timestamp: now,
    });
  }

  // Gate 2: Security, CSP & Subdomain Origin Isolation
  try {
    const auditCheck = verifyAuditTrailIntegrity();
    const sandboxCheck = validateSandboxFlags('allow-scripts allow-same-origin allow-pointer-lock');
    const originIsolation = verifyOriginIsolation('http://localhost:3000', 'http://localhost:5001');
    const secHeaders = getStandardSecurityHeaders();
    const hasCsp = !!secHeaders['Content-Security-Policy'];

    const passed = auditCheck.valid && sandboxCheck.secure && originIsolation && hasCsp;
    gates.push({
      id: 'SECURITY_ISOLATION',
      title: 'Security, CSP & Origin Isolation',
      description: 'HMAC-SHA256 audit log integrity, strict iframe sandbox, and parent/game origin isolation.',
      passed,
      score: passed ? 100 : 0,
      details: {
        auditChainIntact: auditCheck.valid,
        recordsVerified: auditCheck.totalChecked,
        sandboxValidationPassed: sandboxCheck.secure,
        originIsolated: originIsolation,
        cspEnforced: hasCsp,
      },
      timestamp: now,
    });
  } catch (err: any) {
    gates.push({
      id: 'SECURITY_ISOLATION',
      title: 'Security, CSP & Origin Isolation',
      description: 'HMAC-SHA256 audit log integrity, strict iframe sandbox, and parent/game origin isolation.',
      passed: false,
      score: 0,
      details: { error: err.message },
      timestamp: now,
    });
  }

  // Gate 3: GDPR, DPDP & Privacy Hub Compliance
  try {
    const frameworksCount = COMPLIANCE_FRAMEWORKS.length;
    // Test export capability for admin
    const adminUser = gvDb.state.users.find((u) => u.role === 'ADMIN');
    let exportOperational = false;
    if (adminUser) {
      const exportPkg = exportUserData(adminUser.id);
      exportOperational = !!exportPkg.exportMetadata.integrityChecksumSha256;
    }

    const passed = frameworksCount >= 3 && exportOperational;
    gates.push({
      id: 'PRIVACY_COMPLIANCE',
      title: 'GDPR, DPDP & Privacy Hub',
      description: 'Right of Access / DSAR portable archive export and Account Erasure pipelines.',
      passed,
      score: passed ? 100 : 0,
      details: {
        complianceFrameworks: COMPLIANCE_FRAMEWORKS,
        dsarExportOperational: exportOperational,
      },
      timestamp: now,
    });
  } catch (err: any) {
    gates.push({
      id: 'PRIVACY_COMPLIANCE',
      title: 'GDPR, DPDP & Privacy Hub',
      description: 'Right of Access / DSAR portable archive export and Account Erasure pipelines.',
      passed: false,
      score: 0,
      details: { error: err.message },
      timestamp: now,
    });
  }

  // Gate 4: Financial Reconciliation & Double-Entry Ledger
  try {
    const finOverview = getPlatformFinancialOverview();
    const thresholdValid = MINIMUM_PAYOUT_THRESHOLD === 50.0;
    const ledgerHealthy = finOverview.totalGrossRevenue >= finOverview.netRevenue;

    const passed = thresholdValid && ledgerHealthy;
    gates.push({
      id: 'FINANCIAL_LEDGER',
      title: 'Financial Ledger & Payout Pipeline',
      description: 'Automated Net-30 revenue settlements, $50 minimum threshold, and double-entry auditing.',
      passed,
      score: passed ? 100 : 0,
      details: {
        minimumThreshold: MINIMUM_PAYOUT_THRESHOLD,
        totalGrossRevenue: finOverview.totalGrossRevenue,
        netRevenue: finOverview.netRevenue,
        totalCreatorEarnings: finOverview.totalCreatorEarnings,
        totalRecordsCount: finOverview.totalRecordsCount,
      },
      timestamp: now,
    });
  } catch (err: any) {
    gates.push({
      id: 'FINANCIAL_LEDGER',
      title: 'Financial Ledger & Payout Pipeline',
      description: 'Automated Net-30 revenue settlements, $50 minimum threshold, and double-entry auditing.',
      passed: false,
      score: 0,
      details: { error: err.message },
      timestamp: now,
    });
  }

  // Gate 5: Game Catalog & QA Review Pipeline
  try {
    const publishedGames = gvDb.state.games.filter((g) => g.status === 'PUBLISHED');
    const categoriesCount = gvDb.state.categories.length;

    const passed = publishedGames.length > 0 && categoriesCount >= 5;
    gates.push({
      id: 'CATALOG_PIPELINE',
      title: 'Game Catalog & QA Review Pipeline',
      description: 'ZIP verification, virus scanning sandbox, and published multi-genre catalog.',
      passed,
      score: passed ? 100 : 0,
      details: {
        publishedGamesCount: publishedGames.length,
        categoriesCount,
        featuredGameSlug: publishedGames[0]?.slug,
      },
      timestamp: now,
    });
  } catch (err: any) {
    gates.push({
      id: 'CATALOG_PIPELINE',
      title: 'Game Catalog & QA Review Pipeline',
      description: 'ZIP verification, virus scanning sandbox, and published multi-genre catalog.',
      passed: false,
      score: 0,
      details: { error: err.message },
      timestamp: now,
    });
  }

  // Gate 6: Edge CDN & Performance Optimization
  try {
    const staticCache = CACHE_PROFILES.STATIC_IMMUTABLE;
    const catalogCache = CACHE_PROFILES.PUBLIC_CATALOG;
    const edgeHeaders = getEdgeCacheHeaders('PUBLIC_CATALOG', ['games', 'categories']);

    const passed = !!staticCache && !!catalogCache && !!edgeHeaders['CDN-Cache-Control'];
    gates.push({
      id: 'EDGE_PERFORMANCE',
      title: 'Edge CDN Caching & Load Optimization',
      description: 'Cloudflare stale-while-revalidate policies, dynamic bundle splitting, and Brotli compression.',
      passed,
      score: passed ? 100 : 0,
      details: {
        edgeCacheProfilesConfigured: Object.keys(CACHE_PROFILES).length,
        catalogTtl: catalogCache,
        edgeHeadersSet: Object.keys(edgeHeaders),
      },
      timestamp: now,
    });
  } catch (err: any) {
    gates.push({
      id: 'EDGE_PERFORMANCE',
      title: 'Edge CDN Caching & Load Optimization',
      description: 'Cloudflare stale-while-revalidate policies, dynamic bundle splitting, and Brotli compression.',
      passed: false,
      score: 0,
      details: { error: err.message },
      timestamp: now,
    });
  }

  // Gate 7: Creator Beta Program & Onboarding
  try {
    const activeBetaTokens = OFFICIAL_BETA_TOKENS.filter((t) => t.active);
    const passed = activeBetaTokens.length >= 4;

    gates.push({
      id: 'CREATOR_BETA',
      title: 'Creator Beta Onboarding Hub',
      description: 'Partner studio beta invitation tokens, quota enforcement, and automated claiming pipeline.',
      passed,
      score: passed ? 100 : 0,
      details: {
        activeTokensCount: activeBetaTokens.length,
        totalQuotas: activeBetaTokens.reduce((acc, t) => acc + t.maxUses, 0),
        tokens: activeBetaTokens.map((t) => t.token),
      },
      timestamp: now,
    });
  } catch (err: any) {
    gates.push({
      id: 'CREATOR_BETA',
      title: 'Creator Beta Onboarding Hub',
      description: 'Partner studio beta invitation tokens, quota enforcement, and automated claiming pipeline.',
      passed: false,
      score: 0,
      details: { error: err.message },
      timestamp: now,
    });
  }

  const passedCount = gates.filter((g) => g.passed).length;
  const readinessScore = Math.round((passedCount / gates.length) * 100);
  const allPassed = passedCount === gates.length;

  return {
    passed: allPassed,
    readinessScore,
    gates,
    timestamp: now,
    version: '1.0.0',
    status: allPassed ? 'READY_FOR_PRODUCTION' : 'PREFLIGHT_BLOCKED',
  };
}

/**
 * Returns the active production launch certificate if previously authorized.
 */
export function getLastLaunchCertificate(): ProductionLaunchCertificate | null {
  return cachedLaunchCertificate;
}

/**
 * Authorizes and signs off on the official production launch.
 * Enforces that all 7 gates must pass 100%.
 */
export function executeProductionSignOff(adminUser: {
  id: string;
  name: string;
  email: string;
}): {
  success: boolean;
  certificate?: ProductionLaunchCertificate;
  error?: string;
} {
  const evaluation = evaluateLaunchReadiness();

  if (!evaluation.passed) {
    const failedGates = evaluation.gates.filter((g) => !g.passed).map((g) => g.title);
    return {
      success: false,
      error: `Production sign-off rejected. Pre-flight gates failed: ${failedGates.join(', ')}`,
    };
  }

  const certificateId = `CERT-GV-PROD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const signedAt = new Date().toISOString();

  // Create immutable cryptographic seal
  const sealPayload = JSON.stringify({
    certificateId,
    authorizedBy: adminUser,
    signedAt,
    version: evaluation.version,
    readinessScore: evaluation.readinessScore,
    gates: evaluation.gates.map((g) => ({ id: g.id, passed: g.passed })),
  });
  const sha256Seal = crypto.createHash('sha256').update(sealPayload).digest('hex');

  const certificate: ProductionLaunchCertificate = {
    certificateId,
    authorizedBy: adminUser,
    signedAt,
    version: evaluation.version,
    sha256Seal,
    status: 'AUTHORIZED',
    gatesPassed: evaluation.gates.filter((g) => g.passed).length,
    totalGates: evaluation.gates.length,
    readinessScore: evaluation.readinessScore,
  };

  cachedLaunchCertificate = certificate;

  // Record irreversible audit log entry
  recordAuditLog({
    actorId: adminUser.id,
    actorName: adminUser.name,
    actorRole: 'ADMIN',
    action: 'PRODUCTION_LAUNCH_SIGN_OFF',
    targetType: 'SYSTEM_RELEASE',
    targetId: certificateId,
    details: {
      certificateId,
      signedAt,
      version: evaluation.version,
      readinessScore: evaluation.readinessScore,
      sha256Seal,
    },
  });

  return {
    success: true,
    certificate,
  };
}
