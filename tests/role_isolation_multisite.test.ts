import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { generateToken, hasRequiredRole, ROLE_HIERARCHY } from '../src/lib/auth';
import { requireRole, extractAuth } from '../src/lib/security/middleware';
import { GET as getSubmissions } from '../src/app/api/admin/submissions/route';
import { GET as getAuditLogs } from '../src/app/api/admin/audit-logs/route';
import { GET as getFinance } from '../src/app/api/admin/finance/route';
import { middleware } from '../src/middleware';

describe('Multi-Portal Role Isolation & Cross-Role Access Prevention', () => {
  const playerToken = generateToken({
    userId: 'usr-player-iso-1',
    email: 'player@gamer.com',
    role: 'PLAYER',
    name: 'Gamer One',
  });

  const devToken = generateToken({
    userId: 'usr-dev-iso-1',
    email: 'creator@pixelstudio.com',
    role: 'DEVELOPER',
    name: 'Studio Dev',
  });

  const adminToken = generateToken({
    userId: 'usr-admin-iso-1',
    email: 'admin@gameverse.com',
    role: 'ADMIN',
    name: 'Ops Admin',
  });

  // 1. Role Hierarchy Strictness
  it('1. should verify strict role hierarchy and separation', () => {
    expect(ROLE_HIERARCHY.GUEST).toBe(0);
    expect(ROLE_HIERARCHY.PLAYER).toBe(1);
    expect(ROLE_HIERARCHY.DEVELOPER).toBe(2);
    expect(ROLE_HIERARCHY.MODERATOR).toBe(3);
    expect(ROLE_HIERARCHY.ADMIN).toBe(4);
    expect(ROLE_HIERARCHY.SUPER_ADMIN).toBe(5);

    // Player cannot perform Developer or Admin actions
    expect(hasRequiredRole('PLAYER', 'DEVELOPER')).toBe(false);
    expect(hasRequiredRole('PLAYER', 'MODERATOR')).toBe(false);
    expect(hasRequiredRole('PLAYER', 'ADMIN')).toBe(false);

    // Developer cannot perform Admin actions
    expect(hasRequiredRole('DEVELOPER', 'ADMIN')).toBe(false);
    expect(hasRequiredRole('DEVELOPER', 'MODERATOR')).toBe(false);

    // Admin has administrative access
    expect(hasRequiredRole('ADMIN', 'MODERATOR')).toBe(true);
    expect(hasRequiredRole('ADMIN', 'DEVELOPER')).toBe(true);
  });

  // 2. Unauthenticated Guests blocked on Admin APIs with 401
  it('2. should reject unauthenticated guest requests to admin APIs with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/submissions');
    const res = await getSubmissions(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized');
  });

  // 3. Normal Players blocked on Admin Submissions with 403
  it('3. should reject normal Player requests to Admin Submissions API with 403 Forbidden', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/submissions', {
      headers: {
        authorization: `Bearer ${playerToken}`,
      },
    });
    const res = await getSubmissions(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Requires role 'MODERATOR'");
  });

  // 4. Normal Players blocked on Admin Audit Logs with 403
  it('4. should reject normal Player requests to Admin Audit Logs API with 403 Forbidden', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
      headers: {
        authorization: `Bearer ${playerToken}`,
      },
    });
    const res = await getAuditLogs(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Requires role 'ADMIN'");
  });

  // 5. Developers blocked on Admin Finance with 403
  it('5. should reject Developer requests to Admin Finance Overview API with 403 Forbidden', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/finance', {
      headers: {
        authorization: `Bearer ${devToken}`,
      },
    });
    const res = await getFinance(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Requires role 'ADMIN'");
  });

  // 6. Admin authorized to access Admin Submissions API with 200
  it('6. should allow authorized Admin to access Admin Submissions API with 200 OK', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/submissions', {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
    const res = await getSubmissions(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.submissions)).toBe(true);
  });

  // 7. Edge Middleware Role Enforcement for /admin browser navigation
  it('7. should redirect unauthorized players attempting to visit /admin to login', () => {
    const reqGuest = new NextRequest('http://localhost:3000/admin');
    const resGuest = middleware(reqGuest);
    expect(resGuest.status).toBe(307);
    expect(resGuest.headers.get('location')).toContain('/auth/login?redirect=%2Fadmin');

    const reqPlayer = new NextRequest('http://localhost:3000/admin', {
      headers: {
        cookie: `gameverse_session=${playerToken}`,
      },
    });
    const resPlayer = middleware(reqPlayer);
    expect(resPlayer.status).toBe(307);
    expect(resPlayer.headers.get('location')).toContain('/auth/login?redirect=%2Fadmin');
  });

  // 8. Edge Middleware Subdomain Isolation Routing
  it('8. should rewrite admin.* and studio.* subdomains to their respective portals', () => {
    const reqAdminHost = new NextRequest('http://localhost:3000/', {
      headers: {
        host: 'admin.gameverse.com',
        cookie: `gameverse_session=${adminToken}`,
      },
    });
    const resAdminHost = middleware(reqAdminHost);
    // NextResponse.rewrite returns an internal rewrite to /admin
    expect(resAdminHost.headers.get('x-middleware-rewrite')).toContain('/admin');

    const reqStudioHost = new NextRequest('http://localhost:3000/', {
      headers: {
        host: 'studio.gameverse.com',
        cookie: `gameverse_session=${devToken}`,
      },
    });
    const resStudioHost = middleware(reqStudioHost);
    expect(resStudioHost.headers.get('x-middleware-rewrite')).toContain('/developer');
  });
});
