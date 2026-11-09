import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken, verifyToken, hasRequiredRole } from '../src/lib/auth';

describe('Authentication & RBAC Permissions', () => {
  it('should hash and verify passwords securely', async () => {
    const raw = 'SuperSecretGamingPassword2026!';
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(await verifyPassword(raw, hash)).toBe(true);
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('should generate and verify JWT tokens', () => {
    const payload = {
      userId: 'usr-123',
      email: 'dev@studio.com',
      role: 'DEVELOPER' as const,
      name: 'Studio Master',
    };

    const token = generateToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('usr-123');
    expect(decoded?.role).toBe('DEVELOPER');
  });

  it('should reject invalid or tampered JWT tokens', () => {
    const tampered = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.tampered';
    const decoded = verifyToken(tampered);
    expect(decoded).toBeNull();
  });

  it('should enforce hierarchical RBAC roles', () => {
    // Player cannot access developer or admin operations
    expect(hasRequiredRole('PLAYER', 'DEVELOPER')).toBe(false);
    expect(hasRequiredRole('PLAYER', 'ADMIN')).toBe(false);

    // Developer can access player operations, but not admin operations
    expect(hasRequiredRole('DEVELOPER', 'PLAYER')).toBe(true);
    expect(hasRequiredRole('DEVELOPER', 'ADMIN')).toBe(false);

    // Admin has access to developer and player operations
    expect(hasRequiredRole('ADMIN', 'PLAYER')).toBe(true);
    expect(hasRequiredRole('ADMIN', 'DEVELOPER')).toBe(true);
    expect(hasRequiredRole('ADMIN', 'SUPER_ADMIN')).toBe(false);

    // Super Admin has universal access
    expect(hasRequiredRole('SUPER_ADMIN', 'ADMIN')).toBe(true);
  });
});
