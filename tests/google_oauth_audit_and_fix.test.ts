import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { POST as googleAuthRoute } from '../src/app/api/auth/google/route';
import { GET as meRoute } from '../src/app/api/auth/me/route';
import { POST as logoutRoute } from '../src/app/api/auth/logout/route';
import { gvDb } from '../src/lib/database';

describe('Google OAuth Audit & Requirements Verification', () => {
  const googleUserEmail = `verified.gamer.${Date.now()}@gmail.com`;
  let issuedSessionCookie = '';
  let createdUserId = '';

  beforeAll(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      try {
        const envFile = fs.existsSync(path.resolve(__dirname, '../.env.local'))
          ? path.resolve(__dirname, '../.env.local')
          : path.resolve(__dirname, '../.env');
        const envContent = fs.readFileSync(envFile, 'utf8');
        for (const line of envContent.split('\n')) {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            process.env[key] = value;
          }
        }
      } catch {}
    }
  });

  it('Requirement 1 & 6: Configures Google OAuth Client ID and environment parameters', () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).toContain('googleusercontent.com');
  });

  it('Requirement 7 & 8: Verifies Google ID Token on backend and creates user record in DB', async () => {
    // Generate valid test token
    const testIdToken = jwt.sign(
      {
        iss: 'https://accounts.google.com',
        sub: 'google-sub-123456789',
        email: googleUserEmail,
        name: 'Verified Gamer Pro',
        picture: 'https://lh3.googleusercontent.com/a/custom-avatar-url',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      'test-secret'
    );

    const req = new NextRequest('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: testIdToken }),
    });

    const res = await googleAuthRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.provider).toBe('GOOGLE');
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(googleUserEmail);
    expect(data.user.name).toBe('Verified Gamer Pro');
    expect(data.user.role).toBe('PLAYER');
    expect(data.user.avatarUrl).toContain('custom-avatar-url');

    createdUserId = data.user.id;

    // Verify database persistence in gvDb
    const dbUser = gvDb.findUserByEmail(googleUserEmail);
    expect(dbUser).toBeDefined();
    expect(dbUser?.emailVerified).toBe(true);
    expect(dbUser?.role).toBe('PLAYER');

    // Requirement 9: Verify persistent session cookie
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('gameverse_session');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Max-Age=604800'); // 7 days

    // Extract cookie value for subsequent session checks
    const match = setCookie?.match(/gameverse_session=([^;]+)/);
    expect(match).not.toBeNull();
    issuedSessionCookie = match![1];
  });

  it('Requirement 8: Updates existing user record on re-authentication with Google', async () => {
    // Simulate user updating profile details via Google SSO
    const updatedIdToken = jwt.sign(
      {
        iss: 'https://accounts.google.com',
        sub: 'google-sub-123456789',
        email: googleUserEmail,
        name: 'Verified Gamer Pro (Updated)',
        picture: 'https://lh3.googleusercontent.com/a/new-avatar-url',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      'test-secret'
    );

    const req = new NextRequest('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: updatedIdToken }),
    });

    const res = await googleAuthRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.id).toBe(createdUserId); // Same user ID, no duplicates

    const dbUser = gvDb.findUserByEmail(googleUserEmail);
    expect(dbUser?.id).toBe(createdUserId);
  });

  it('Requirement 9: Restores persistent session using HTTP-only cookie (/api/auth/me)', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        cookie: `gameverse_session=${issuedSessionCookie}`,
      },
    });

    const res = await meRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.id).toBe(createdUserId);
    expect(data.user.email).toBe(googleUserEmail);
    expect(data.user.role).toBe('PLAYER');
  });

  it('Requirement 9: Secure logout invalidates session cookie (/api/auth/logout)', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        cookie: `gameverse_session=${issuedSessionCookie}`,
      },
    });

    const res = await logoutRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify deletion of session cookie
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('gameverse_session=;');
  });

  it('Requirement 10: Handles invalid Google ID tokens gracefully with meaningful errors', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'invalid.malformed.token' }),
    });

    const res = await googleAuthRoute(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error).toContain('verification failed');
  });

  it('Strict Security: Blocks administrative accounts from logging in via Player Google SSO', async () => {
    const adminEmail = `admin.security.${Date.now()}@gameverse.com`;
    gvDb.createUser({
      email: adminEmail,
      name: 'Platform Ops Admin',
      role: 'ADMIN',
      emailVerified: true,
    });

    const req = new NextRequest('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        name: 'Platform Ops Admin',
      }),
    });

    const res = await googleAuthRoute(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('non-player portal');
  });
});
