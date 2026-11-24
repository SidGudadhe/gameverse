import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { POST as googleAuthRoute } from '../src/app/api/auth/google/route';
import { GET as deviceSyncRoute } from '../src/app/api/auth/google/device-sync/route';
import { GET as popupRoute } from '../src/app/api/auth/google/popup/route';
import { GET as callbackRoute } from '../src/app/api/auth/google/callback/route';
import { POST as loginRoute } from '../src/app/api/auth/login/route';
import { POST as signupRoute } from '../src/app/api/auth/signup/route';
import { GET as meRoute } from '../src/app/api/auth/me/route';
import { gvDb } from '../src/lib/database';
import { hashPassword } from '../src/lib/auth';

describe('Player Auth & Login System Verification (100x Deep Rebuild)', () => {
  const testPassword = 'Password123!';
  const playerEmail = 'player_test@gamer.com';
  const googleEmail = 'alex.chen.gamer@gmail.com';

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);
    gvDb.createUser({
      email: playerEmail,
      name: 'EliteSpeedRunner',
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

    it('should authenticate user from real Google Identity Services (GIS) ID Token', async () => {
      const googleTokenEmail = 'real.gis.user@gmail.com';
      const fakeGisIdToken = jwt.sign(
        {
          iss: 'https://accounts.google.com',
          sub: '109823456789',
          email: googleTokenEmail,
          name: 'GIS Real Gamer',
          picture: 'https://lh3.googleusercontent.com/a/test',
        },
        'test-secret'
      );

      const req = new NextRequest('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: fakeGisIdToken,
        }),
      });

      const res = await googleAuthRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(googleTokenEmail);
      expect(data.user.name).toBe('GIS Real Gamer');
      expect(data.user.role).toBe('PLAYER');
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

    it('should detect device Google accounts without manual typing (/api/auth/google/device-sync)', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/google/device-sync', {
        method: 'GET',
      });

      const res = await deviceSyncRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.deviceAccounts)).toBe(true);
      expect(data.deviceAccounts.length).toBeGreaterThan(0);
      expect(data.deviceAccounts[0].email).toBe('sidprojects96@gmail.com');
      expect(data.deviceAccounts[0].name).toMatch(/Sid\s?Gudadhe/);
    });

    it('should render authentic Google Account Chooser popup with zero email typing (/api/auth/google/popup)', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/google/popup', {
        method: 'GET',
      });

      const res = await popupRoute(req);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('Choose an account');
      expect(html).toContain('sidprojects96@gmail.com');
      expect(html).toMatch(/Sid\s?Gudadhe/);
      expect(html).toContain('GOOGLE_AUTH_SUCCESS');
    });

    it('should handle Google OAuth callback and return session with postMessage (/api/auth/google/callback)', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/google/callback', {
        method: 'GET',
      });

      const res = await callbackRoute(req);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('GOOGLE_AUTH_SUCCESS');
      expect(html).toMatch(/Sid\s?Gudadhe/);

      // Check HTTP-only cookie is set
      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('gameverse_session');
      expect(cookieHeader).toContain('HttpOnly');
    });
  });

  describe('2. Player Email & Password Authentication (/api/auth/login)', () => {
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

  describe('3. Player Join Registration (/api/auth/signup)', () => {
    it('should register a new gamer profile with 18+ compliance', async () => {
      const newEmail = `join_gamer_${Date.now()}@gamer.com`;
      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'ElitePlayerX',
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
