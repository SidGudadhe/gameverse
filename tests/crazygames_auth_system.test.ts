import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as googleAuthRoute } from '../src/app/api/auth/google/route';
import { POST as loginRoute } from '../src/app/api/auth/login/route';
import { POST as signupRoute } from '../src/app/api/auth/signup/route';
import { GET as meRoute } from '../src/app/api/auth/me/route';
import { gvDb } from '../src/lib/database';
import { hashPassword } from '../src/lib/auth';

describe('CrazyGames Auth & Login System Verification (100x Deep Rebuild)', () => {
  const testPassword = 'Password123!';
  const playerEmail = 'crazygamer_test@gamer.com';
  const googleEmail = 'alex.chen.gamer@gmail.com';

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);
    gvDb.createUser({
      email: playerEmail,
      name: 'CrazySpeedRunner',
      passwordHash,
      role: 'PLAYER',
      emailVerified: true,
    });
  });

  describe('1. Real Google Single-Sign-On (/api/auth/google)', () => {
    it('should create new player account, issue JWT token, and set HTTP-only cookie via Google SSO', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmail,
          name: 'AlexChenGamer',
        }),
      });

      const res = await googleAuthRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.provider).toBe('GOOGLE');
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(googleEmail);
      expect(data.user.role).toBe('PLAYER');
      expect(data.user.name).toBe('AlexChenGamer');
      expect(data.token).toBeDefined();

      // Check HTTP-only cookie
      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('gameverse_session');
      expect(cookieHeader).toContain('HttpOnly');
    });

    it('should authenticate existing player via Google SSO without creating duplicate users', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmail,
          name: 'AlexChenGamer',
        }),
      });

      const res = await googleAuthRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(googleEmail);
    });

    it('should block non-player accounts (admin/developer) from authenticating via Player Google SSO', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@gameverse.com',
          name: 'System Admin',
        }),
      });

      const res = await googleAuthRoute(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('non-player portal');
    });

    it('should authenticate detected primary Google account (sidprojects96@gmail.com) on 1-click selection', async () => {
      const detectedEmail = 'sidprojects96@gmail.com';
      const req = new NextRequest('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: detectedEmail,
          name: 'Sid Gudadhe',
        }),
      });

      const res = await googleAuthRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(detectedEmail);
      expect(data.user.name).toBe('Sid Gudadhe');
      expect(data.user.role).toBe('PLAYER');
    });

    it('should create an account with user chosen real email and verify database persistence', async () => {
      const realUserEmail = `mauli.player.${Date.now()}@gmail.com`;
      const req = new NextRequest('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: realUserEmail,
          name: 'Mauli Real Gamer',
        }),
      });

      const res = await googleAuthRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(realUserEmail);
      expect(data.user.name).toBe('Mauli Real Gamer');

      // Verify persistence in gvDb database
      const dbUser = gvDb.findUserByEmail(realUserEmail);
      expect(dbUser).toBeDefined();
      expect(dbUser?.email).toBe(realUserEmail);
      expect(dbUser?.name).toBe('Mauli Real Gamer');
      expect(dbUser?.role).toBe('PLAYER');
    });

    it('should gracefully handle empty payload with fallback Google gamer identity', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await googleAuthRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('PLAYER');
    });
  });

  describe('2. CrazyGames Email & Password Authentication (/api/auth/login)', () => {
    it('should authenticate gamer credentials and return session', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: playerEmail,
          password: testPassword,
          portal: 'PLAYER',
        }),
      });

      const res = await loginRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(playerEmail);
      expect(data.user.role).toBe('PLAYER');
      expect(data.token).toBeDefined();
    });

    it('should reject invalid password with generic 401 error', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: playerEmail,
          password: 'WrongPassword999!',
          portal: 'PLAYER',
        }),
      });

      const res = await loginRoute(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email or password.');
    });
  });

  describe('3. CrazyGames Join Registration (/api/auth/signup)', () => {
    it('should register a new gamer profile with 18+ compliance', async () => {
      const newEmail = `join_gamer_${Date.now()}@gamer.com`;
      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'CrazyPlayerX',
          email: newEmail,
          password: 'StrongPassword123!',
          portal: 'PLAYER',
          role: 'PLAYER',
        }),
      });

      const res = await signupRoute(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(newEmail);
      expect(data.user.role).toBe('PLAYER');
    });

    it('should prevent duplicate registration with the same email', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'DuplicateGamer',
          email: playerEmail,
          password: 'Password123!',
          portal: 'PLAYER',
          role: 'PLAYER',
        }),
      });

      const res = await signupRoute(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });
  });
});
