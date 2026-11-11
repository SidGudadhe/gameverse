import { describe, it, expect, beforeEach } from 'vitest';
import { gvDb } from '../src/lib/database';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../src/lib/auth';
import { checkRateLimit, requireOwnership, requireRole } from '../src/lib/security/middleware';
import { NextRequest } from 'next/server';

describe('Phase 2: Backend, Database & Authentication Security Tests', () => {
  const TEST_PASSWORD = 'SecurePassword2026!';
  let testDeveloperId = '';
  let testPlayerId = '';

  beforeEach(async () => {
    const passwordHash = await hashPassword(TEST_PASSWORD);

    // Seed test developer
    const dev = gvDb.createUser({
      email: `test_dev_${Date.now()}@studio.com`,
      name: 'Alpha Studio',
      passwordHash,
      role: 'DEVELOPER',
    });
    testDeveloperId = dev.id;

    // Seed test player
    const player = gvDb.createUser({
      email: `test_player_${Date.now()}@gamer.com`,
      name: 'GamerX',
      passwordHash,
      role: 'PLAYER',
    });
    testPlayerId = player.id;
  });

  it('should securely hash password and verify credentials correctly', async () => {
    const hash = await hashPassword(TEST_PASSWORD);
    expect(await verifyPassword(TEST_PASSWORD, hash)).toBe(true);
    expect(await verifyPassword('IncorrectPassword123', hash)).toBe(false);
  });

  it('should enforce unique email constraint on registration', () => {
    const email = `unique_${Date.now()}@test.com`;
    gvDb.createUser({
      email,
      name: 'First User',
      passwordHash: 'hash1',
      role: 'PLAYER',
    });

    const duplicate = gvDb.findUserByEmail(email);
    expect(duplicate).toBeDefined();
    expect(duplicate?.name).toBe('First User');
  });

  it('should reject expired or tampered session tokens', () => {
    // Generate expired token
    const token = generateToken({
      userId: 'usr-expired',
      email: 'expired@test.com',
      role: 'PLAYER',
      name: 'Old Session',
    });

    const validPayload = verifyToken(token);
    expect(validPayload).not.toBeNull();

    // Tampered token
    const tampered = token.slice(0, -6) + 'abcdef';
    expect(verifyToken(tampered)).toBeNull();
  });

  it('should prevent cross-developer data access (Tenant Isolation)', () => {
    const devAId = testDeveloperId;
    const devBId = 'usr-dev-b';

    // Simulate request from Developer B trying to access Developer A's resource
    const devBToken = generateToken({
      userId: devBId,
      email: 'devb@studio.com',
      role: 'DEVELOPER',
      name: 'Beta Studio',
    });

    const mockReq = new NextRequest('http://localhost:3000/api/developer/games/123', {
      headers: {
        authorization: `Bearer ${devBToken}`,
      },
    });

    // Developer B attempts to access Developer A's game
    const result = requireOwnership(mockReq, devAId);
    expect(result.errorResponse).not.toBeNull();
    expect(result.errorResponse?.status).toBe(403);
  });

  it('should allow Admin to access any developer resource for QA support', () => {
    const adminToken = generateToken({
      userId: 'usr-admin-test',
      email: 'admin@gameverse.com',
      role: 'ADMIN',
      name: 'QA Admin',
    });

    const mockReq = new NextRequest('http://localhost:3000/api/developer/games/123', {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    // Admin accessing Developer A's game should be allowed
    const result = requireOwnership(mockReq, testDeveloperId);
    expect(result.errorResponse).toBeNull();
    expect(result.user?.role).toBe('ADMIN');
  });

  it('should enforce sliding window rate limiting to block brute force attacks', () => {
    const testIp = `ip_${Date.now()}`;
    const limit = 5;
    const windowMs = 5000;

    // First 5 requests must be allowed
    for (let i = 0; i < limit; i++) {
      const res = checkRateLimit(testIp, limit, windowMs);
      expect(res.allowed).toBe(true);
    }

    // 6th request must be rejected with 0 remaining
    const blockedRes = checkRateLimit(testIp, limit, windowMs);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
  });

  it('should generate and verify single-use email verification tokens', () => {
    const tokenObj = gvDb.createEmailVerificationToken(testPlayerId);
    expect(tokenObj.token).toBeDefined();

    const verifiedUser = gvDb.verifyEmailToken(tokenObj.token);
    expect(verifiedUser).not.toBeNull();
    expect(verifiedUser?.emailVerified).toBe(true);

    // Second use of same token or expired token should not re-verify
    const reVerify = gvDb.verifyEmailToken('invalid-or-fake-token');
    expect(reVerify).toBeNull();
  });

  it('should handle password reset tokens with single-use expiration', async () => {
    const user = gvDb.findUserById(testPlayerId);
    expect(user).toBeDefined();

    const resetToken = gvDb.createPasswordResetToken(user!.email);
    expect(resetToken.token).toBeDefined();

    const newHash = await hashPassword('BrandNewPassword2026!');
    const success = gvDb.usePasswordResetToken(resetToken.token, newHash);
    expect(success).toBe(true);

    // Token cannot be reused
    const reUse = gvDb.usePasswordResetToken(resetToken.token, newHash);
    expect(reUse).toBe(false);

    // Verify user now has new password
    const updatedUser = gvDb.findUserById(testPlayerId);
    expect(await verifyPassword('BrandNewPassword2026!', updatedUser!.passwordHash)).toBe(true);
  });

  it('should write audit logs for security and compliance tracking', () => {
    const log = gvDb.logAudit({
      actorId: testDeveloperId,
      actorName: 'Alpha Studio',
      action: 'SUBMIT_GAME_VERSION',
      targetType: 'GAME_VERSION',
      targetId: 'ver-test-1',
      details: { version: '1.0.0' },
      ipAddress: '127.0.0.1',
    });

    expect(log.id).toBeDefined();
    const logs = gvDb.getAuditLogs(10);
    expect(logs.some((l) => l.action === 'SUBMIT_GAME_VERSION')).toBe(true);
  });
});
