import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginRoute } from '../src/app/api/auth/login/route';
import { POST as signupRoute } from '../src/app/api/auth/signup/route';
import { middleware } from '../src/middleware';
import { gvDb } from '../src/lib/database';
import { hashPassword } from '../src/lib/auth';

describe('Three Separate Role Websites & Dedicated Auth Portals Isolation', () => {
  const testPassword = 'Password123!';
  const playerEmail = `isolated_player_${Date.now()}@gamer.com`;
  const devEmail = `isolated_dev_${Date.now()}@studio.com`;
  const adminEmail = `isolated_admin_${Date.now()}@gameverse.com`;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // Seed test player
    gvDb.createUser({
      email: playerEmail,
      name: 'Isolated Player',
      passwordHash,
      role: 'PLAYER',
    });

    // Seed test developer
    gvDb.createUser({
      email: devEmail,
      name: 'Isolated Developer',
      passwordHash,
      role: 'DEVELOPER',
    });

    // Seed test admin (without 2FA for direct login testing)
    gvDb.createUser({
      email: adminEmail,
      name: 'Isolated Admin',
      passwordHash,
      role: 'ADMIN',
      twoFactorEnabled: false,
    });
  });

  // =========================================================================
  // 1. PLAYER / GAMER PORTAL AUTH ISOLATION
  // =========================================================================
  it('1. should allow gamer signup on Player Portal and strictly force PLAYER role', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `new_gamer_${Date.now()}@test.com`,
        name: 'GamerX',
        password: testPassword,
        portal: 'PLAYER',
        role: 'ADMIN', // Tampering attempt: tries to claim ADMIN role from player portal
      }),
    });

    const res = await signupRoute(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('PLAYER'); // Must be forced to PLAYER
  });

  it('2. should authenticate gamers on Player Portal, but reject Developer accounts', async () => {
    // A. Gamer login on Player Portal -> SUCCESS
    const gamerReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: playerEmail,
        password: testPassword,
        portal: 'PLAYER',
      }),
    });
    const gamerRes = await loginRoute(gamerReq);
    const gamerData = await gamerRes.json();
    expect(gamerRes.status).toBe(200);
    expect(gamerData.user.role).toBe('PLAYER');

    // B. Developer login on Player Portal -> REJECTED with portal redirect guidance
    const devReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: devEmail,
        password: testPassword,
        portal: 'PLAYER',
      }),
    });
    const devRes = await loginRoute(devReq);
    const devData = await devRes.json();
    expect(devRes.status).toBe(403);
    expect(devData.portalMismatch).toBe('DEVELOPER');
    expect(devData.redirectUrl).toBe('/developer/auth/login');
  });

  it('3. should reject Admin accounts trying to login on Player Portal', async () => {
    const adminReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: testPassword,
        portal: 'PLAYER',
      }),
    });
    const adminRes = await loginRoute(adminReq);
    const adminData = await adminRes.json();

    expect(adminRes.status).toBe(403);
    expect(adminData.portalMismatch).toBe('ADMIN');
    expect(adminData.redirectUrl).toBe('/admin/auth/login');
  });

  // =========================================================================
  // 2. DEVELOPER STUDIO PORTAL AUTH ISOLATION
  // =========================================================================
  it('4. should register game creators on Developer Portal with DEVELOPER role', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `new_dev_${Date.now()}@studio.com`,
        name: 'Pixel Studio',
        password: testPassword,
        portal: 'DEVELOPER',
      }),
    });

    const res = await signupRoute(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('DEVELOPER');
  });

  it('5. should authenticate developers on Developer Portal, but reject Player accounts', async () => {
    // A. Developer login on Developer Portal -> SUCCESS
    const devReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: devEmail,
        password: testPassword,
        portal: 'DEVELOPER',
      }),
    });
    const devRes = await loginRoute(devReq);
    const devData = await devRes.json();
    expect(devRes.status).toBe(200);
    expect(devData.user.role).toBe('DEVELOPER');

    // B. Player login on Developer Portal -> REJECTED
    const playerReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: playerEmail,
        password: testPassword,
        portal: 'DEVELOPER',
      }),
    });
    const playerRes = await loginRoute(playerReq);
    const playerData = await playerRes.json();
    expect(playerRes.status).toBe(403);
    expect(playerData.portalMismatch).toBe('PLAYER');
    expect(playerData.redirectUrl).toBe('/auth/login');
  });

  // =========================================================================
  // 3. ADMIN OPERATIONS PORTAL AUTH ISOLATION
  // =========================================================================
  it('6. should reject admin registration without valid Admin Security Passkey', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `fake_admin_${Date.now()}@gameverse.com`,
        name: 'Fake Admin',
        password: testPassword,
        portal: 'ADMIN',
        adminSecurityKey: 'wrong-key-1234',
      }),
    });

    const res = await signupRoute(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Admin Authorization Security Key');
  });

  it('7. should register admin staff on Admin Portal when valid Security Passkey is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `staff_admin_${Date.now()}@gameverse.com`,
        name: 'Staff Operator',
        password: testPassword,
        portal: 'ADMIN',
        adminSecurityKey: 'gv-admin-ops-2026',
      }),
    });

    const res = await signupRoute(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('ADMIN');
  });

  it('8. should authenticate admin on Admin Portal, but strictly block Players and Developers', async () => {
    // A. Admin login on Admin Portal -> SUCCESS
    const adminReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: testPassword,
        portal: 'ADMIN',
      }),
    });
    const adminRes = await loginRoute(adminReq);
    const adminData = await adminRes.json();
    expect(adminRes.status).toBe(200);
    expect(adminData.user.role).toBe('ADMIN');

    // B. Player login on Admin Portal -> 403 Forbidden
    const playerReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: playerEmail,
        password: testPassword,
        portal: 'ADMIN',
      }),
    });
    const playerRes = await loginRoute(playerReq);
    expect(playerRes.status).toBe(403);

    // C. Developer login on Admin Portal -> 403 Forbidden
    const devReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: devEmail,
        password: testPassword,
        portal: 'ADMIN',
      }),
    });
    const devRes = await loginRoute(devReq);
    expect(devRes.status).toBe(403);
  });

  // =========================================================================
  // 4. MIDDLEWARE SUBDOMAIN & ROUTE ISOLATION
  // =========================================================================
  it('9. should allow open access to /admin/auth/login and /developer/auth/login without redirecting to player login', () => {
    // Unauthenticated request to /admin/auth/login
    const adminAuthReq = new NextRequest('http://localhost:3000/admin/auth/login');
    const adminAuthRes = middleware(adminAuthReq);
    // Should NOT redirect (status should be 200 / next)
    expect(adminAuthRes.status).toBe(200);

    // Unauthenticated request to /developer/auth/login
    const devAuthReq = new NextRequest('http://localhost:3000/developer/auth/login');
    const devAuthRes = middleware(devAuthReq);
    expect(devAuthRes.status).toBe(200);
  });

  it('10. should rewrite subdomain /auth/login to dedicated portal login', () => {
    // Request to admin.gameverse.com/auth/login
    const adminSubReq = new NextRequest('http://admin.gameverse.com/auth/login', {
      headers: { host: 'admin.gameverse.com' },
    });
    const adminSubRes = middleware(adminSubReq);
    const adminRewrite = adminSubRes.headers.get('x-middleware-rewrite');
    expect(adminRewrite).toContain('/admin/auth/login');

    // Request to studio.gameverse.com/auth/login
    const devSubReq = new NextRequest('http://studio.gameverse.com/auth/login', {
      headers: { host: 'studio.gameverse.com' },
    });
    const devSubRes = middleware(devSubReq);
    const devRewrite = devSubRes.headers.get('x-middleware-rewrite');
    expect(devRewrite).toContain('/developer/auth/login');
  });
});
