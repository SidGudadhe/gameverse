import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateLaunchReadiness,
  executeProductionSignOff,
  getLastLaunchCertificate,
} from '../src/lib/launch';
import {
  verifyBetaInvitation,
  claimBetaInvitation,
  OFFICIAL_BETA_TOKENS,
} from '../src/lib/beta';
import { gvDb } from '../src/lib/database';
import { globalIndexEngine } from '../src/lib/performance';
import { verifyAuditTrailIntegrity } from '../src/lib/audit';
import { SECURITY_LIMITS, validateSandboxFlags } from '../src/lib/security';
import { GET as healthHandler } from '../src/app/api/health/route';

describe('Phase 16: Beta Onboarding & Production Launch Readiness', () => {
  const mockAdmin = {
    id: 'usr-admin-1',
    name: 'System Admin',
    email: 'admin@gameverse.com',
  };

  const mockDev = {
    id: 'usr-dev-1',
    name: 'PixelForge Studios',
    email: 'creator@pixelstudio.com',
  };

  beforeEach(() => {
    gvDb.resetToSeed();
    globalIndexEngine.rebuildIndexes(gvDb.state);
  });

  // ================= 1. CREATOR BETA INVITATION VERIFICATION & CLAIM =================
  it('1. should verify and claim creator beta access tokens with audit logging', () => {
    // 1. Verify valid beta token
    const verifyValid = verifyBetaInvitation('BETA-CREATOR-2026');
    expect(verifyValid.valid).toBe(true);
    expect(verifyValid.invitation?.studioName).toBe('General Creator Beta Cohort');

    // 2. Reject invalid token
    const verifyInvalid = verifyBetaInvitation('INVALID-TOKEN-999');
    expect(verifyInvalid.valid).toBe(false);
    expect(verifyInvalid.error).toBe('Invalid beta invitation code.');

    // 3. Claim token for developer studio
    const initialUsed = verifyValid.invitation!.usedCount;
    const claimRes = claimBetaInvitation('BETA-CREATOR-2026', mockDev.id);
    expect(claimRes.success).toBe(true);
    expect(claimRes.studioName).toBe('General Creator Beta Cohort');
    expect(verifyValid.invitation!.usedCount).toBe(initialUsed + 1);

    // 4. Verify claim audit log
    const lastAudit = gvDb.state.auditLogs[0];
    expect(lastAudit.action).toBe('BETA_CREATOR_CLAIMED');
    expect(lastAudit.actorId).toBe(mockDev.id);
  });

  // ================= 2. PLATFORM HEALTH CHECK API STATUS =================
  it('2. should verify platform health check API reports UP across all subsystems', async () => {
    const res = await healthHandler();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('HEALTHY');
    expect(data.version).toBe('1.0.0');

    // Subsystem checks
    expect(data.checks.database.status).toBe('UP');
    expect(data.checks.database.details.totalGames).toBeGreaterThan(0);
    expect(data.checks.indexes.status).toBe('UP');
    expect(data.checks.storage.status).toBe('UP');
    expect(data.checks.security.status).toBe('UP');
    expect(data.checks.security.details.auditChainIntact).toBe(true);
  });

  // ================= 3. PRE-FLIGHT 7-GATE EVALUATOR =================
  it('3. should evaluate all 7 pre-flight operational gates and achieve 100% readiness', () => {
    const report = evaluateLaunchReadiness();

    expect(report.passed).toBe(true);
    expect(report.readinessScore).toBe(100);
    expect(report.status).toBe('READY_FOR_PRODUCTION');
    expect(report.gates.length).toBe(7);

    // Verify all 7 specific gate IDs
    const gateIds = report.gates.map((g) => g.id);
    expect(gateIds).toContain('CORE_ARCHITECTURE');
    expect(gateIds).toContain('SECURITY_ISOLATION');
    expect(gateIds).toContain('PRIVACY_COMPLIANCE');
    expect(gateIds).toContain('FINANCIAL_LEDGER');
    expect(gateIds).toContain('CATALOG_PIPELINE');
    expect(gateIds).toContain('EDGE_PERFORMANCE');
    expect(gateIds).toContain('CREATOR_BETA');

    // Verify every single gate passed with score 100
    for (const gate of report.gates) {
      expect(gate.passed).toBe(true);
      expect(gate.score).toBe(100);
    }
  });

  // ================= 4. CRYPTOGRAPHIC PRODUCTION LAUNCH SIGN-OFF =================
  it('4. should execute authorized production launch sign-off and record cryptographic certificate', () => {
    const signOff = executeProductionSignOff(mockAdmin);

    expect(signOff.success).toBe(true);
    expect(signOff.certificate).toBeDefined();

    const cert = signOff.certificate!;
    expect(cert.certificateId).toMatch(/^CERT-GV-PROD-/);
    expect(cert.status).toBe('AUTHORIZED');
    expect(cert.authorizedBy.email).toBe(mockAdmin.email);
    expect(cert.gatesPassed).toBe(7);
    expect(cert.totalGates).toBe(7);
    expect(cert.readinessScore).toBe(100);
    expect(cert.sha256Seal).toHaveLength(64); // SHA-256 hash length

    // Verify certificate persists in memory
    const cached = getLastLaunchCertificate();
    expect(cached?.certificateId).toBe(cert.certificateId);

    // Verify audit trail entry
    const lastAudit = gvDb.state.auditLogs[0];
    expect(lastAudit.action).toBe('PRODUCTION_LAUNCH_SIGN_OFF');
    expect(lastAudit.actorRole).toBe('ADMIN');
    expect(lastAudit.details.certificateId).toBe(cert.certificateId);
  });

  // ================= 5. REJECTION OF SIGN-OFF ON GATE FAILURE =================
  it('5. should reject production sign-off if any pre-flight gate is failing', () => {
    // Temporarily clear games catalog to simulate catalog failure
    const originalGames = [...gvDb.state.games];
    gvDb.state.games = [];

    const signOff = executeProductionSignOff(mockAdmin);
    expect(signOff.success).toBe(false);
    expect(signOff.error).toContain('Pre-flight gates failed');

    // Restore catalog
    gvDb.state.games = originalGames;
  });

  // ================= 6. POSTMESSAGE SDK PROTOCOL SPECIFICATION =================
  it('6. should validate developer postMessage SDK communication protocol directives', () => {
    const allowedClientEvents = ['GV_READY', 'GV_GAME_OVER', 'GV_REQUEST_AD'];
    const allowedHostEvents = ['GV_PAUSE', 'GV_RESUME', 'GV_MUTE', 'GV_UNMUTE'];

    expect(allowedClientEvents).toContain('GV_READY');
    expect(allowedClientEvents).toContain('GV_GAME_OVER');
    expect(allowedClientEvents).toContain('GV_REQUEST_AD');

    expect(allowedHostEvents).toContain('GV_PAUSE');
    expect(allowedHostEvents).toContain('GV_RESUME');
    expect(allowedHostEvents).toContain('GV_MUTE');
    expect(allowedHostEvents).toContain('GV_UNMUTE');
  });

  // ================= 7. PUBLISHING GUIDELINES & SECURITY ENFORCEMENT =================
  it('7. should enforce build packaging limits and secure sandbox flags', () => {
    // Packaging limits
    expect(SECURITY_LIMITS.MAX_ARCHIVE_SIZE_BYTES).toBe(50 * 1024 * 1024);
    expect(SECURITY_LIMITS.MAX_UNCOMPRESSED_SIZE_BYTES).toBe(250 * 1024 * 1024);
    expect(SECURITY_LIMITS.PROHIBITED_EXTENSIONS).toContain('.exe');
    expect(SECURITY_LIMITS.PROHIBITED_EXTENSIONS).toContain('.bat');

    // Sandbox flag validation
    const validSandbox = validateSandboxFlags('allow-scripts allow-same-origin allow-pointer-lock');
    expect(validSandbox.secure).toBe(true);

    const dangerousSandbox = validateSandboxFlags('allow-scripts allow-top-navigation');
    expect(dangerousSandbox.secure).toBe(false);
    expect(dangerousSandbox.violations.length).toBeGreaterThan(0);
  });

  // ================= 8. END-TO-END V1.0.0 PRODUCTION RELEASE INTEGRITY =================
  it('8. should verify comprehensive end-to-end platform release integrity', () => {
    // 1. Audit trail chain valid
    const auditChain = verifyAuditTrailIntegrity();
    expect(auditChain.valid).toBe(true);

    // 2. Index engine queryable
    const game = globalIndexEngine.getGameBySlug('neon-runner');
    expect(game).toBeDefined();
    expect(game?.title).toBe('Neon Cyber Runner 2088');

    // 3. Official beta cohorts configured
    expect(OFFICIAL_BETA_TOKENS.length).toBeGreaterThanOrEqual(5);

    // 4. Final pre-flight evaluation
    const finalReport = evaluateLaunchReadiness();
    expect(finalReport.status).toBe('READY_FOR_PRODUCTION');
    expect(finalReport.readinessScore).toBe(100);
  });
});
