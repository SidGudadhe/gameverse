import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginRoute } from '../src/app/api/auth/login/route';
import { POST as signupRoute } from '../src/app/api/auth/signup/route';
import { POST as onboardRoute } from '../src/app/api/developer/onboard/route';
import { GET as meRoute } from '../src/app/api/auth/me/route';
import { middleware } from '../src/middleware';
import { gvDb } from '../src/lib/database';
import { hashPassword, generateToken } from '../src/lib/auth';

describe('Same-Email Multi-Role Separation & Zero Cross-Portal Redirects', () => {
  const commonPassword = 'SecretPassword123!';
  const multiEmail = `same_email_creator_${Date.now()}@gamestudio.com`;

  it('1. should allow user to register as PLAYER first, then register as DEVELOPER with the exact same email', async () => {
    // Step A: Register as PLAYER on Player Portal
    const playerSignupReq = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: multiEmail,
        name: 'Alex Gamer',
        password: commonPassword,
        portal: 'PLAYER',
      }),
    });
    const playerSignupRes = await signupRoute(playerSignupReq);
    const playerData = await playerSignupRes.json();

    expect(playerSignupRes.status).toBe(201);
    expect(playerData.success).toBe(true);
    expect(playerData.user.email).toBe(multiEmail);
    expect(playerData.user.role).toBe('PLAYER');

    // Step B: Register as DEVELOPER on Developer Portal with SAME email & details
    const devSignupReq = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: multiEmail,
        name: 'Alex Game Studio',
        password: commonPassword,
        portal: 'DEVELOPER',
        role: 'DEVELOPER',
      }),
    });
    const devSignupRes = await signupRoute(devSignupReq);
    const devData = await devSignupRes.json();

    expect(devSignupRes.status).toBe(201);
    expect(devData.success).toBe(true);
    expect(devData.user.email).toBe(multiEmail);
    expect(devData.user.role).toBe('DEVELOPER');

    // Verify both accounts exist in database under the same email
    const playerRecord = gvDb.findUserByEmail(multiEmail, 'PLAYER');
    const devRecord = gvDb.findUserByEmail(multiEmail, 'DEVELOPER');
    expect(playerRecord).toBeDefined();
    expect(playerRecord?.role).toBe('PLAYER');
    expect(devRecord).toBeDefined();
    expect(devRecord?.role).toBe('DEVELOPER');
  });

  it('2. should reject duplicate registration of the SAME role for the same email', async () => {
    const dupDevReq = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: multiEmail,
        name: 'Duplicate Studio',
        password: commonPassword,
        portal: 'DEVELOPER',
        role: 'DEVELOPER',
      }),
    });
    const res = await signupRoute(dupDevReq);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toContain('developer account with this email address already exists');
  });

  it('3. should authenticate player on Player Portal and developer on Developer Portal independently with same email', async () => {
    // Login on Player Portal
    const playerLoginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: multiEmail,
        password: commonPassword,
        portal: 'PLAYER',
      }),
    });
    const playerLoginRes = await loginRoute(playerLoginReq);
    const playerLoginData = await playerLoginRes.json();

    expect(playerLoginRes.status).toBe(200);
    expect(playerLoginData.user.role).toBe('PLAYER');
    expect(playerLoginData.user.email).toBe(multiEmail);

    // Login on Developer Portal
    const devLoginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: multiEmail,
        password: commonPassword,
        portal: 'DEVELOPER',
      }),
    });
    const devLoginRes = await loginRoute(devLoginReq);
    const devLoginData = await devLoginRes.json();

    expect(devLoginRes.status).toBe(200);
    expect(devLoginData.user.role).toBe('DEVELOPER');
    expect(devLoginData.user.email).toBe(multiEmail);
    // Developer portal sets developer session cookie
    expect(devLoginRes.cookies.get('gameverse_developer_session')).toBeDefined();
  });

  it('4. should allow an existing player account to register as developer with the same email and login to developer portal', async () => {
    const singlePlayerEmail = `player_auto_${Date.now()}@example.com`;
    const passwordHash = await hashPassword(commonPassword);

    gvDb.createUser({
      email: singlePlayerEmail,
      name: 'Single Player',
      passwordHash,
      role: 'PLAYER',
    });

    // Developer signup with SAME email
    const devSignupReq = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: singlePlayerEmail,
        name: 'Single Player Studio',
        password: commonPassword,
        portal: 'DEVELOPER',
        role: 'DEVELOPER',
      }),
    });
    const devSignupRes = await signupRoute(devSignupReq);
    expect(devSignupRes.status).toBe(201);

    // Developer login with same email
    const devLoginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: singlePlayerEmail,
        password: commonPassword,
        portal: 'DEVELOPER',
      }),
    });
    const devLoginRes = await loginRoute(devLoginReq);
    const devLoginData = await devLoginRes.json();

    expect(devLoginRes.status).toBe(200);
    expect(devLoginData.user.role).toBe('DEVELOPER');
    expect(devLoginData.user.email).toBe(singlePlayerEmail);
  });

  it('5. should allow authenticated player to complete creator onboarding and elevate to DEVELOPER', async () => {
    const onboardingEmail = `onboard_user_${Date.now()}@creator.com`;
    const passwordHash = await hashPassword(commonPassword);

    const playerUser = gvDb.createUser({
      email: onboardingEmail,
      name: 'Onboarding Creator',
      passwordHash,
      role: 'PLAYER',
    });

    const playerToken = generateToken({
      userId: playerUser.id,
      email: playerUser.email,
      role: 'PLAYER',
      name: playerUser.name,
    });

    const req = new NextRequest('http://localhost:3000/api/developer/onboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${playerToken}`,
      },
      body: JSON.stringify({
        agreementVersion: 'v1.0-2026',
        studioName: 'Solar Flare Games',
      }),
    });

    const res = await onboardRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('DEVELOPER');
    expect(res.cookies.get('gameverse_developer_session')).toBeDefined();
  });

  it('6. should return DEVELOPER profile from /api/auth/me when called from developer portal context', async () => {
    const devUser = gvDb.findUserByEmail(multiEmail, 'DEVELOPER');
    expect(devUser).toBeDefined();

    const devToken = generateToken({
      userId: devUser!.id,
      email: devUser!.email,
      role: 'DEVELOPER',
      name: devUser!.name,
    });

    const req = new NextRequest('http://localhost:3000/api/auth/me?portal=DEVELOPER', {
      headers: {
        Authorization: `Bearer ${devToken}`,
        cookie: `gameverse_developer_session=${devToken}`,
      },
    });

    const res = await meRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.role).toBe('DEVELOPER');
  });

  it('7. should never cross-redirect from developer portal to player site', () => {
    // Public developer routes should never redirect to /
    const homeDevReq = new NextRequest('http://localhost:3000/developer');
    const homeDevRes = middleware(homeDevReq);
    expect(homeDevRes.status).toBe(200);

    const docsDevReq = new NextRequest('http://localhost:3000/developer/docs');
    const docsDevRes = middleware(docsDevReq);
    expect(docsDevRes.status).toBe(200);

    // Unauthenticated developer sub-page routes redirect to developer login, NEVER to /
    const gamesReq = new NextRequest('http://localhost:3000/developer/games');
    const gamesRes = middleware(gamesReq);
    expect(gamesRes.status).toBe(307);
    const location = gamesRes.headers.get('location');
    expect(location).toContain('/developer/auth/login');
    expect(location).not.toBe('http://localhost:3000/');
  });
});
