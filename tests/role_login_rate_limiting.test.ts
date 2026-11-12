import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginRoute } from '../src/app/api/auth/login/route';
import { resetRateLimit, ROLE_LOGIN_RATE_LIMITS } from '../src/lib/security/middleware';
import { gvDb } from '../src/lib/database';

describe('Tiered Role & Portal Login Rate Limiting Tests', () => {
  beforeEach(() => {
    resetRateLimit(); // Clean slate for each rate limiting test
  });

  // 1. Rate Limit Configuration Verification
  it('1. should define distinct tiered rate limits per role portal', () => {
    expect(ROLE_LOGIN_RATE_LIMITS.PLAYER.maxAttempts).toBe(10);
    expect(ROLE_LOGIN_RATE_LIMITS.DEVELOPER.maxAttempts).toBe(5);
    expect(ROLE_LOGIN_RATE_LIMITS.ADMIN.maxAttempts).toBe(5);

    expect(ROLE_LOGIN_RATE_LIMITS.PLAYER.windowMs).toBe(60000);
    expect(ROLE_LOGIN_RATE_LIMITS.DEVELOPER.windowMs).toBe(60000);
    expect(ROLE_LOGIN_RATE_LIMITS.ADMIN.windowMs).toBe(60000);
  });

  // 2. Gamer Portal Rate Limiting (10 allowed, 11th blocked)
  it('2. should enforce 10 attempts limit on Gamer Portal and return 429 on 11th attempt', async () => {
    const ip = '192.168.1.101';
    const email = 'gamer_ratelimit@test.com';

    // Send 10 attempts
    for (let i = 1; i <= 10; i++) {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({
          email,
          password: `WrongPass${i}!`,
          portal: 'PLAYER',
        }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(401); // Credentials failed, but within rate limit
    }

    // 11th attempt should trigger 429 Too Many Requests
    const blockedReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({
        email,
        password: 'AnotherWrongPass!',
        portal: 'PLAYER',
      }),
    });

    const blockedRes = await loginRoute(blockedReq);
    const blockedData = await blockedRes.json();

    expect(blockedRes.status).toBe(429);
    expect(blockedData.success).toBe(false);
    expect(blockedData.error).toContain('Too many login attempts on the Gamer Portal');
    expect(blockedRes.headers.get('Retry-After')).toBeDefined();
    expect(blockedRes.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(blockedRes.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  // 3. Developer Studio Rate Limiting (5 allowed, 6th blocked)
  it('3. should enforce 5 attempts limit on Developer Studio and return 429 on 6th attempt', async () => {
    const ip = '192.168.1.102';
    const email = 'studio_ratelimit@test.com';

    for (let i = 1; i <= 5; i++) {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({
          email,
          password: `WrongPass${i}!`,
          portal: 'DEVELOPER',
        }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(401);
    }

    // 6th attempt should be rate limited
    const blockedReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({
        email,
        password: 'Pass6!',
        portal: 'DEVELOPER',
      }),
    });

    const blockedRes = await loginRoute(blockedReq);
    const blockedData = await blockedRes.json();

    expect(blockedRes.status).toBe(429);
    expect(blockedData.success).toBe(false);
    expect(blockedData.error).toContain('Too many login attempts on the Developer Studio');
    expect(blockedRes.headers.get('Retry-After')).toBeDefined();
    expect(blockedRes.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(blockedRes.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  // 4. Admin Operations Rate Limiting (5 allowed, 6th blocked)
  it('4. should enforce 5 attempts limit on Admin Operations Suite and return 429 on 6th attempt', async () => {
    const ip = '192.168.1.103';
    const email = 'admin_ratelimit@test.com';

    for (let i = 1; i <= 5; i++) {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({
          email,
          password: `WrongPass${i}!`,
          portal: 'ADMIN',
        }),
      });

      const res = await loginRoute(req);
      expect(res.status).toBe(401);
    }

    // 6th attempt should be blocked
    const blockedReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({
        email,
        password: 'Pass6!',
        portal: 'ADMIN',
      }),
    });

    const blockedRes = await loginRoute(blockedReq);
    const blockedData = await blockedRes.json();

    expect(blockedRes.status).toBe(429);
    expect(blockedData.success).toBe(false);
    expect(blockedData.error).toContain('Too many login attempts on the Admin Operations Suite');
    expect(blockedRes.headers.get('Retry-After')).toBeDefined();
    expect(blockedRes.headers.get('X-RateLimit-Limit')).toBe('5');
  });

  // 5. Independent Portal Quotas: Developer attempts do not lock out Gamer Portal
  it('5. should maintain independent rate limit buckets across different portals', async () => {
    const ip = '192.168.1.104';

    // Exhaust Developer Studio rate limit
    for (let i = 1; i <= 5; i++) {
      await loginRoute(
        new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': ip,
          },
          body: JSON.stringify({
            email: `dev_${i}@studio.com`,
            password: 'BadPassword!',
            portal: 'DEVELOPER',
          }),
        })
      );
    }

    // Developer is now blocked
    const devBlocked = await loginRoute(
      new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({
          email: 'dev_test@studio.com',
          password: 'BadPassword!',
          portal: 'DEVELOPER',
        }),
      })
    );
    expect(devBlocked.status).toBe(429);

    // But the Gamer Portal from the same IP should still be allowed!
    const gamerReq = await loginRoute(
      new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({
          email: 'fresh_gamer@play.com',
          password: 'BadPassword!',
          portal: 'PLAYER',
        }),
      })
    );
    // Should be 401 (credentials check), NOT 429
    expect(gamerReq.status).toBe(401);
  });

  // 6. Audit Logging for RATE_LIMIT_EXCEEDED
  it('6. should log a security audit event when rate limit is exceeded', async () => {
    const ip = '192.168.1.105';
    const email = 'audit_victim@test.com';

    // Exhaust limit on Admin Portal
    for (let i = 1; i <= 6; i++) {
      await loginRoute(
        new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': ip,
          },
          body: JSON.stringify({
            email,
            password: `BadPassword${i}`,
            portal: 'ADMIN',
          }),
        })
      );
    }

    const auditLogs = gvDb.getAuditLogs(100, { action: 'RATE_LIMIT_EXCEEDED' });
    expect(auditLogs.length).toBeGreaterThan(0);
    const latest = auditLogs[0];
    expect(latest.action).toBe('RATE_LIMIT_EXCEEDED');
    expect(latest.details.portal).toBe('ADMIN');
    expect(latest.ipAddress).toBe(ip);
  });
});
