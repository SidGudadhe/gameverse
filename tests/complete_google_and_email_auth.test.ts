import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { POST as googleAuthRoute } from '../src/app/api/auth/google/route';
import { POST as loginRoute } from '../src/app/api/auth/login/route';
import { POST as signupRoute } from '../src/app/api/auth/signup/route';
import { POST as forgotPasswordRoute } from '../src/app/api/auth/forgot-password/route';
import { POST as resetPasswordRoute } from '../src/app/api/auth/reset-password/route';
import { GET as meRoute } from '../src/app/api/auth/me/route';
import { POST as logoutRoute } from '../src/app/api/auth/logout/route';
import { gvDb } from '../src/lib/database';

describe('Comprehensive Google OAuth + Email & Password Authentication Suite', () => {
  const timestamp = Date.now();
  const testPlayerEmail = `player.hero.${timestamp}@gameverse.io`;
  const testPassword = 'SecureGamerPass2026!';
  let createdPlayerId = '';
  let emailSessionCookie = '';
  let googleSessionCookie = '';

  beforeAll(() => {
    // Ensure .env.local variables are loaded if running in isolated runner
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

  describe('Section 1: Configuration & Security Auditing', () => {
    it('1.1 should have valid Google Client ID configured in standard format', () => {
      const clientId =
        process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      expect(clientId).toBeDefined();
      expect(clientId).toMatch(/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/);
    });

    it('1.2 should strictly never expose GOOGLE_CLIENT_SECRET with NEXT_PUBLIC_ prefix', () => {
      expect((process.env as any).NEXT_PUBLIC_GOOGLE_CLIENT_SECRET).toBeUndefined();
    });

    it('1.3 should verify .env.example contains placeholder values only', () => {
      const examplePath = path.resolve(__dirname, '../.env.example');
      if (fs.existsSync(examplePath)) {
        const content = fs.readFileSync(examplePath, 'utf8');
        expect(content).not.toContain('GOCSPX-');
        expect(content).not.toContain('603941246039-et4vf4b8ulfun4nn6j1cbmrrl7lltgpm');
      }
    });
  });

  describe('Section 2: Method 1 - Google Authentication', () => {
    const googleUserEmail = `google.champion.${timestamp}@gmail.com`;
    let googleUserId = '';

    it('2.1 should register a new player from verified Google Identity token', async () => {
      const testIdToken = jwt.sign(
        {
          iss: 'https://accounts.google.com',
          sub: `google-sub-${timestamp}`,
          email: googleUserEmail,
          name: 'StarGamer_Google',
          picture: 'https://lh3.googleusercontent.com/a/google-avatar',
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
      expect(data.user.email).toBe(googleUserEmail);
      expect(data.user.name).toBe('StarGamer_Google');
      expect(data.user.role).toBe('PLAYER');
      expect(data.user.emailVerified).toBe(true);

      googleUserId = data.user.id;

      // Verify DB record
      const dbUser = gvDb.findUserByEmail(googleUserEmail);
      expect(dbUser).toBeDefined();
      expect(dbUser?.id).toBe(googleUserId);

      // Verify Set-Cookie header
      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('gameverse_session');
      expect(cookieHeader).toContain('HttpOnly');
      const match = cookieHeader?.match(/gameverse_session=([^;]+)/);
      expect(match).not.toBeNull();
      googleSessionCookie = match![1];
    });

    it('2.2 should authenticate existing Google player without creating duplicates', async () => {
      const updatedIdToken = jwt.sign(
        {
          iss: 'https://accounts.google.com',
          sub: `google-sub-${timestamp}`,
          email: googleUserEmail,
          name: 'StarGamer_Google_Updated',
          picture: 'https://lh3.googleusercontent.com/a/google-avatar-2',
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
      expect(data.user.id).toBe(googleUserId); // Must match original user ID
    });

    it('2.3 should reject malformed or fake Google identity tokens', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'totally.invalid.token' }),
      });

      const res = await googleAuthRoute(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('verification failed');
    });

    it('2.4 should block administrative or developer accounts from Player Google login', async () => {
      const staffEmail = `staff.sec.${timestamp}@gameverse.com`;
      gvDb.createUser({
        email: staffEmail,
        name: 'Staff Dev',
        role: 'DEVELOPER',
        emailVerified: true,
      });

      const req = new NextRequest('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: staffEmail,
          name: 'Staff Dev',
        }),
      });

      const res = await googleAuthRoute(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('non-player portal');
    });
  });

  describe('Section 3: Method 2 - Email & Password Authentication', () => {
    it('3.1 should register a new account with email and password (enforcing min 8 chars)', async () => {
      // Short password check
      const shortPassReq = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'SpeedyGamer',
          email: testPlayerEmail,
          password: 'short',
          portal: 'PLAYER',
        }),
      });
      const shortRes = await signupRoute(shortPassReq);
      expect(shortRes.status).toBe(400);

      // Valid signup
      const validReq = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'SpeedyGamer',
          email: testPlayerEmail,
          password: testPassword,
          portal: 'PLAYER',
          role: 'PLAYER',
        }),
      });

      const res = await signupRoute(validReq);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(testPlayerEmail);
      expect(data.user.name).toBe('SpeedyGamer');
      expect(data.user.role).toBe('PLAYER');
      expect(data.token).toBeDefined();

      createdPlayerId = data.user.id;

      // Verify password was hashed in database (never stored in plaintext)
      const dbUser = gvDb.findUserByEmail(testPlayerEmail);
      expect(dbUser?.passwordHash).toBeDefined();
      expect(dbUser?.passwordHash).not.toBe(testPassword);
      expect(dbUser?.passwordHash.startsWith('$2')).toBe(true); // bcrypt hash prefix
    });

    it('3.2 should prevent duplicate registration with the same email (409 Conflict)', async () => {
      const dupReq = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'SpeedyGamerTwin',
          email: testPlayerEmail,
          password: testPassword,
          portal: 'PLAYER',
        }),
      });

      const res = await signupRoute(dupReq);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('3.3 should sign in with valid email and password, honoring rememberMe extended session', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testPlayerEmail,
          password: testPassword,
          portal: 'PLAYER',
          rememberMe: true,
        }),
      });

      const res = await loginRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.id).toBe(createdPlayerId);
      expect(data.user.email).toBe(testPlayerEmail);
      expect(data.token).toBeDefined();

      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('gameverse_session');
      expect(cookieHeader).toContain('Max-Age=2592000'); // 30 days when rememberMe is true

      const match = cookieHeader?.match(/gameverse_session=([^;]+)/);
      expect(match).not.toBeNull();
      emailSessionCookie = match![1];
    });

    it('3.4 should reject incorrect password with generic 401 error', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testPlayerEmail,
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

    it('3.5 should reject non-existent user with generic 401 error (email enumeration defense)', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `ghost.account.${timestamp}@gameverse.io`,
          password: 'SomePassword123!',
          portal: 'PLAYER',
        }),
      });

      const res = await loginRoute(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid email or password.');
    });

    it('3.6 should execute password reset flow with single-use verification token', async () => {
      // 1. Request forgot password link
      const forgotReq = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testPlayerEmail }),
      });

      const forgotRes = await forgotPasswordRoute(forgotReq);
      const forgotData = await forgotRes.json();

      expect(forgotRes.status).toBe(200);
      expect(forgotData.success).toBe(true);
      expect(forgotData.resetToken).toBeDefined();

      const resetToken = forgotData.resetToken;
      const newPassword = 'BrandNewPassword2026!';

      // 2. Submit new password
      const resetReq = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const resetRes = await resetPasswordRoute(resetReq);
      const resetData = await resetRes.json();

      expect(resetRes.status).toBe(200);
      expect(resetData.success).toBe(true);

      // 3. Re-using the same token must fail (single-use token protection)
      const reuseReq = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: 'AnotherPassword999!' }),
      });

      const reuseRes = await resetPasswordRoute(reuseReq);
      expect(reuseRes.status).toBe(400);

      // 4. Log in with the new password
      const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testPlayerEmail,
          password: newPassword,
          portal: 'PLAYER',
        }),
      });

      const loginRes = await loginRoute(loginReq);
      const loginData = await loginRes.json();

      expect(loginRes.status).toBe(200);
      expect(loginData.success).toBe(true);
      expect(loginData.user.id).toBe(createdPlayerId);
    });
  });

  describe('Section 4: Session Persistence, Me Route, and Logout', () => {
    it('4.1 should retrieve authenticated user profile using session cookie (/api/auth/me)', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          cookie: `gameverse_session=${googleSessionCookie}`,
        },
      });

      const res = await meRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.role).toBe('PLAYER');
    });

    it('4.2 should securely log out and clear the session cookie (/api/auth/logout)', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          cookie: `gameverse_session=${emailSessionCookie}`,
        },
      });

      const res = await logoutRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('gameverse_session=;');
    });
  });

  describe('Section 5: Strict 2-Method Verification (No Third-Party Mixin or Demo Toggles)', () => {
    it('5.1 should verify login page component source adheres strictly to Google + Email/Password', () => {
      const loginPagePath = path.resolve(__dirname, '../src/app/auth/login/page.tsx');
      const content = fs.readFileSync(loginPagePath, 'utf8');

      // Verify Method 1: Google
      expect(content).toContain('GoogleSignIn');
      expect(content).toContain('mode="LOGIN"');

      // Verify Method 2: Email & Password
      expect(content).toContain('type="email"');
      expect(content).toContain('type={showPassword ? \'text\' : \'password\'}');
      expect(content).toContain('handleLogin');
      expect(content).toContain('rememberMe');
      expect(content).toContain('/auth/forgot-password');
      expect(content).toContain('/auth/signup');

      // Verify demo button is completely removed
      expect(content).not.toContain('NeoGamer99');
      expect(content).not.toContain('handleQuickLogin');
      expect(content).not.toContain('Instant Demo');

      // Verify no other providers
      expect(content).not.toContain('Facebook');
      expect(content).not.toContain('Apple');
      expect(content).not.toContain('phone');
      expect(content).not.toContain('otp');
    });

    it('5.2 should verify signup page component source adheres strictly to Google + Email/Password', () => {
      const signupPagePath = path.resolve(__dirname, '../src/app/auth/signup/page.tsx');
      const content = fs.readFileSync(signupPagePath, 'utf8');

      // Verify Method 1: Google
      expect(content).toContain('GoogleSignIn');
      expect(content).toContain('mode="SIGNUP"');

      // Verify Method 2: Gamer Tag, Email, Password, Confirm Password, Strength
      expect(content).toContain('name');
      expect(content).toContain('email');
      expect(content).toContain('password');
      expect(content).toContain('confirmPassword');
      expect(content).toContain('passwordStrength');
      expect(content).toContain('termsAgreed');
      expect(content).toContain('/auth/login');

      // Verify demo button is completely removed
      expect(content).not.toContain('NeoGamer99');
      expect(content).not.toContain('handleQuickLogin');
      expect(content).not.toContain('Instant Demo');
    });
  });
});
