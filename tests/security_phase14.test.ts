import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateSandboxFlags,
  verifyOriginIsolation,
  getStandardSecurityHeaders,
  getSandboxOriginConfig,
  PROHIBITED_SANDBOX_FLAGS,
  REQUIRED_SANDBOX_FLAGS,
} from '../src/lib/security';
import {
  exportUserData,
  eraseUserData,
  getDefaultConsentPreferences,
} from '../src/lib/privacy';
import {
  recordAuditLog,
  verifyAuditTrailIntegrity,
  computeAuditTamperHash,
  GENESIS_HASH,
} from '../src/lib/audit';
import { gvDb } from '../src/lib/database';

describe('Phase 14: Security Hardening, Privacy & Legal Compliance', () => {
  beforeEach(() => {
    // Reset database state to predictable test fixture
    gvDb.resetToSeed();
  });

  // ================= 1. CSP & HTTP SECURITY HEADERS AUDIT =================
  it('1. should provide complete, hardened HTTP security headers conforming to OWASP & CSP Level 3', () => {
    const headers = getStandardSecurityHeaders();

    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Permissions-Policy']).toContain('microphone=()');
    expect(headers['Permissions-Policy']).toContain('geolocation=()');
    expect(headers['Strict-Transport-Security']).toContain('max-age=63072000');

    // Strict CSP checks
    const csp = headers['Content-Security-Policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  // ================= 2. IFRAME SANDBOX FLAGS VALIDATION =================
  it('2. should strictly validate iframe sandbox attributes and prohibit dangerous breakout flags', () => {
    // Valid GameVerse production sandbox attribute
    const validSandbox = 'allow-scripts allow-same-origin allow-pointer-lock';
    const validResult = validateSandboxFlags(validSandbox);
    expect(validResult.secure).toBe(true);
    expect(validResult.violations.length).toBe(0);

    // Dangerous breakout flags: allow-top-navigation & allow-modals
    const insecureSandbox = 'allow-scripts allow-same-origin allow-top-navigation allow-modals';
    const insecureResult = validateSandboxFlags(insecureSandbox);
    expect(insecureResult.secure).toBe(false);
    expect(insecureResult.violations.some((v) => v.includes('allow-top-navigation'))).toBe(true);
    expect(insecureResult.violations.some((v) => v.includes('allow-modals'))).toBe(true);

    // Missing required flag
    const missingFlags = 'allow-scripts';
    const missingResult = validateSandboxFlags(missingFlags);
    expect(missingResult.secure).toBe(false);
    expect(missingResult.violations.some((v) => v.includes('allow-same-origin'))).toBe(true);
    expect(missingResult.violations.some((v) => v.includes('allow-pointer-lock'))).toBe(true);
  });

  // ================= 3. ORIGIN ISOLATION VERIFICATION =================
  it('3. should enforce strict origin isolation between parent website and untrusted game runtimes', () => {
    // Isolated origins (different ports or subdomains)
    expect(verifyOriginIsolation('http://localhost:3000', 'http://localhost:5001')).toBe(true);
    expect(verifyOriginIsolation('https://app.gameverse.com', 'https://games.gameverse.com')).toBe(
      true
    );
    expect(verifyOriginIsolation('https://gameverse.com', 'https://sandbox.gameverse.com')).toBe(
      true
    );

    // Same origin (violates zero-trust isolation for user-submitted code)
    expect(verifyOriginIsolation('https://app.gameverse.com', 'https://app.gameverse.com')).toBe(
      false
    );
    expect(verifyOriginIsolation('http://localhost:3000', 'http://localhost:3000')).toBe(false);

    // Config helper
    const config = getSandboxOriginConfig();
    expect(config.parentOrigin).toBeDefined();
    expect(config.sandboxOrigin).toBeDefined();
  });

  // ================= 4. GDPR / DPDP DATA SUBJECT ACCESS REQUEST (DSAR) =================
  it('4. should generate complete, verifiable machine-readable data archives for DSAR requests', () => {
    // Setup test user with favorites, history, and review
    const testUser = gvDb.createUser({
      email: 'privacy_player@example.com',
      name: 'Data Subject Player',
      role: 'PLAYER',
      passwordHash: 'dummy-hashed',
    });

    gvDb.updateProfile(testUser.id, {
      username: 'dataplayer99',
      displayName: 'Data Subject Player',
      bio: 'Loves retro indie games.',
      favoriteGenre: 'Arcade',
    });

    gvDb.addFavorite(testUser.id, 'game-cyber-runner');
    gvDb.recordHistory(testUser.id, 'game-cyber-runner', 25);
    gvDb.createReview({
      gameId: 'game-cyber-runner',
      userId: testUser.id,
      username: 'dataplayer99',
      displayName: 'Data Subject Player',
      rating: 5,
      comment: 'Incredible neon graphics and soundtrack!',
      isVerifiedPlayer: true,
    });

    const exportBundle = exportUserData(testUser.id);

    expect(exportBundle).toBeDefined();
    expect(exportBundle.exportMetadata.dataSubjectId).toBe(testUser.id);
    expect(exportBundle.exportMetadata.complianceStandards.length).toBeGreaterThan(0);
    expect(exportBundle.exportMetadata.integrityChecksumSha256).toBeDefined();

    // Verify account data is present but passwords are not leaked
    expect(exportBundle.account.email).toBe('privacy_player@example.com');
    expect((exportBundle.account as any).passwordHash).toBeUndefined();

    // Verify profile & player activity exported
    expect(exportBundle.profile?.username).toBe('dataplayer99');
    expect(exportBundle.playerData.favoritesCount).toBe(1);
    expect(exportBundle.playerData.playHistoryCount).toBe(1);
    expect(exportBundle.playerData.reviewsCount).toBe(1);
    expect(exportBundle.playerData.reviews[0].comment).toContain('Incredible neon graphics');

    // Verify DSAR export action was recorded in audit logs
    const dsarLog = gvDb.state.auditLogs.find(
      (l) => l.action === 'PRIVACY_DATA_EXPORT_DSAR' && l.actorId === testUser.id
    );
    expect(dsarLog).toBeDefined();
  });

  // ================= 5. RIGHT TO ERASURE (ANONYMIZATION) =================
  it('5. should execute GDPR Article 17 / DPDP Section 12 erasure by anonymizing PII and pseudonymizing reviews', () => {
    const eraseUser = gvDb.createUser({
      email: 'delete_me_soon@example.com',
      name: 'Soon Forgotten',
      role: 'PLAYER',
      passwordHash: 'hashed-secret',
    });

    gvDb.updateProfile(eraseUser.id, {
      username: 'to_be_deleted',
      displayName: 'Soon Forgotten',
      bio: 'Temporary profile text.',
    });

    gvDb.addFavorite(eraseUser.id, 'game-cyber-runner');
    gvDb.recordHistory(eraseUser.id, 'game-cyber-runner', 45);

    const review = gvDb.createReview({
      gameId: 'game-cyber-runner',
      userId: eraseUser.id,
      username: 'to_be_deleted',
      displayName: 'Soon Forgotten',
      rating: 4,
      comment: 'Solid gameplay, needs better mobile touch controls.',
      isVerifiedPlayer: true,
    });

    // Execute erasure
    const result = eraseUserData(eraseUser.id, {
      id: eraseUser.id,
      name: eraseUser.name,
      role: eraseUser.role,
    });

    expect(result.success).toBe(true);

    // 1. Verify User record is anonymized
    const anonymizedUser = gvDb.getUserById(eraseUser.id);
    expect(anonymizedUser).toBeDefined();
    expect(anonymizedUser?.name).toBe('Anonymized Player');
    expect(anonymizedUser?.email).toContain('@privacy.gameverse.local');
    expect(anonymizedUser?.passwordHash).toBe('ERASED_ACCOUNT_DEACTIVATED');

    // 2. Verify Profile is wiped/pseudonymized
    const profile = gvDb.getProfileByUserId(eraseUser.id);
    expect(profile?.displayName).toBe('Deleted User');
    expect(profile?.bio).toBeUndefined();

    // 3. Verify personal favorites and play history are cleared
    expect(gvDb.getPlayerFavorites(eraseUser.id).length).toBe(0);
    expect(gvDb.getPlayerHistory(eraseUser.id).length).toBe(0);

    // 4. Verify review is pseudonymized but rating/comment remains for game catalog integrity
    const updatedReview = gvDb.state.reviews.find((r) => r.id === review.id);
    expect(updatedReview).toBeDefined();
    expect(updatedReview?.userId).toBe('ANONYMIZED_USER');
    expect(updatedReview?.displayName).toBe('Anonymous Player');
    expect(updatedReview?.rating).toBe(4);
    expect(updatedReview?.comment).toContain('Solid gameplay');

    // 5. Verify erasure audit log was written
    const erasureLog = gvDb.state.auditLogs.find(
      (l) => l.action === 'PRIVACY_RIGHT_TO_ERASURE' && l.targetId === eraseUser.id
    );
    expect(erasureLog).toBeDefined();
  });

  // ================= 6. CRYPTOGRAPHIC TAMPER-EVIDENT AUDIT TRAIL =================
  it('6. should construct an immutable, SHA-256 chained audit trail and verify chain integrity', () => {
    // Clear initial seed logs for clean chain test
    gvDb.state.auditLogs = [];

    const log1 = recordAuditLog({
      actorId: 'usr-admin-1',
      actorName: 'System Admin',
      actorRole: 'ADMIN',
      action: 'ADMIN_LOGIN',
      targetType: 'SYSTEM',
      targetId: 'auth',
      details: { ip: '127.0.0.1', method: '2FA_TOTP' },
    });

    const log2 = recordAuditLog({
      actorId: 'usr-admin-1',
      actorName: 'System Admin',
      actorRole: 'ADMIN',
      action: 'APPROVE_SUBMISSION',
      targetType: 'SUBMISSION',
      targetId: 'sub-101',
      details: { gameId: 'game-neon', notes: 'Passed QA and scan' },
    });

    const log3 = recordAuditLog({
      actorId: 'usr-admin-1',
      actorName: 'System Admin',
      actorRole: 'ADMIN',
      action: 'DISBURSE_PAYOUT',
      targetType: 'PAYOUT',
      targetId: 'pay-202',
      details: { amount: 150.0, method: 'BANK_WIRE' },
    });

    // Check chain link: log2 should reference log1's tamper hash, log3 references log2
    expect(log1.previousHash).toBe(GENESIS_HASH);
    expect(log2.previousHash).toBe(log1.tamperHash);
    expect(log3.previousHash).toBe(log2.tamperHash);

    // Verify chain integrity
    const integrityCheck = verifyAuditTrailIntegrity(gvDb.state.auditLogs);
    expect(integrityCheck.valid).toBe(true);
    expect(integrityCheck.totalChecked).toBe(3);
  });

  // ================= 7. TAMPER DETECTION IN AUDIT LOGS =================
  it('7. should detect tampering or payload modification in historical audit logs', () => {
    gvDb.state.auditLogs = [];

    recordAuditLog({
      actorId: 'usr-admin-1',
      actorName: 'System Admin',
      action: 'PAYOUT_APPROVAL',
      targetType: 'PAYOUT',
      targetId: 'payout-1',
      details: { amount: 50.0 },
    });

    recordAuditLog({
      actorId: 'usr-admin-1',
      actorName: 'System Admin',
      action: 'PAYOUT_APPROVAL',
      targetType: 'PAYOUT',
      targetId: 'payout-2',
      details: { amount: 100.0 },
    });

    // Verify valid before tampering
    expect(verifyAuditTrailIntegrity(gvDb.state.auditLogs).valid).toBe(true);

    // Maliciously tamper with the payout amount in log 1
    gvDb.state.auditLogs[1].details = { amount: 5000.0 }; // Tampered!

    const tamperedCheck = verifyAuditTrailIntegrity(gvDb.state.auditLogs);
    expect(tamperedCheck.valid).toBe(false);
    expect(tamperedCheck.reason).toContain('tamperHash mismatch');
  });

  // ================= 8. COOKIE & CONSENT PREFERENCE DEFAULTS =================
  it('8. should initialize cookie consent preferences adhering to privacy-by-default', () => {
    const preferences = getDefaultConsentPreferences();

    expect(preferences.necessary).toBe(true); // Essential always required
    expect(preferences.analytics).toBe(false); // Opt-in by default
    expect(preferences.marketing).toBe(false); // Opt-in by default
    expect(preferences.version).toBeDefined();
    expect(preferences.updatedAt).toBeDefined();
  });
});
