import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import { generateToken, hashPassword } from '../src/lib/auth';
import { GET as getDeveloperProfile, PUT as updateDeveloperProfile } from '../src/app/api/developer/profile/route';

describe('Developer Real Studio Profile Verification (No Fake Data)', () => {
  let devId: string;
  let devAuthHeader: string;
  const realDevName = 'HyperNova Interactive';
  const realDevEmail = 'founder@hypernova-games.io';

  beforeEach(async () => {
    devId = `usr-dev-real-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const passHash = await hashPassword('Password123!');

    // 1. Simulate real developer account creation (as happens on signup)
    const newUser = gvDb.createUser({
      id: devId,
      name: realDevName,
      email: realDevEmail,
      passwordHash: passHash,
      role: 'DEVELOPER',
      emailVerified: true,
    });

    const devToken = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });
    devAuthHeader = `Bearer ${devToken}`;

    // Configure developer verification in settings
    gvDb.updateDeveloperSettings(devId, {
      studioVerified: true,
      currency: 'INR',
    });
  });

  it('1. Generates studio profile from real account creation data without fake dummy info', async () => {
    const req = new NextRequest('http://localhost:3000/api/developer/profile', {
      headers: { authorization: devAuthHeader },
    });

    const res = await getDeveloperProfile(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    // Verified real data from account creation
    expect(data.profile.studioName).toBe(realDevName);
    expect(data.profile.displayName).toBe(realDevName);
    expect(data.profile.email).toBe(realDevEmail);
    expect(data.profile.username).toBe('founder');
    expect(data.user.email).toBe(realDevEmail);
    expect(data.user.name).toBe(realDevName);
    expect(data.studioVerified).toBe(true);

    // Verify no fake dummy data is returned
    expect(data.profile.displayName).not.toBe('Alex Rivers');
    expect(data.profile.website).not.toBe('https://pixelforge.games');
    expect(data.profile.portfolioUrl).not.toBe('https://github.com/pixelforge');
    expect(data.profile.bio).not.toContain('synthwave action runners');
  });

  it('2. Saves and updates real studio profile information', async () => {
    const uniqueStudioHandle = `hypernova_${Date.now().toString(36)}`;
    const putReq = new NextRequest('http://localhost:3000/api/developer/profile', {
      method: 'PUT',
      headers: {
        authorization: devAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studioName: 'HyperNova Studios Pvt Ltd',
        displayName: 'Dev Lead Sarah',
        username: uniqueStudioHandle,
        website: 'https://hypernova.in',
        portfolioUrl: 'https://github.com/hypernovaindia',
        bio: 'Building next-generation HTML5 multiplayer arcade experiences in India.',
      }),
    });

    const putRes = await updateDeveloperProfile(putReq);
    expect(putRes.status).toBe(200);
    const putData = await putRes.json();
    expect(putData.success).toBe(true);
    expect(putData.profile.studioName).toBe('HyperNova Studios Pvt Ltd');
    expect(putData.profile.displayName).toBe('Dev Lead Sarah');
    expect(putData.profile.website).toBe('https://hypernova.in');
    expect(putData.profile.portfolioUrl).toBe('https://github.com/hypernovaindia');
    expect(putData.profile.bio).toContain('next-generation HTML5 multiplayer');

    // Fetch again via GET to verify persistence
    const getReq = new NextRequest('http://localhost:3000/api/developer/profile', {
      headers: { authorization: devAuthHeader },
    });
    const getRes = await getDeveloperProfile(getReq);
    const getData = await getRes.json();
    expect(getData.profile.studioName).toBe('HyperNova Studios Pvt Ltd');
    expect(getData.profile.displayName).toBe('Dev Lead Sarah');
    expect(getData.profile.username).toBe(uniqueStudioHandle);
  });

  it('3. Enforces username uniqueness for studio profile handles', async () => {
    // Create another user
    const otherDevId = `usr-other-${Date.now()}`;
    const otherPass = await hashPassword('Password123!');
    gvDb.createUser({
      id: otherDevId,
      name: 'Other Studio',
      email: 'other@studio.com',
      passwordHash: otherPass,
      role: 'DEVELOPER',
    });
    gvDb.updateProfile(otherDevId, { username: 'taken_handle' });

    // Attempt to take existing handle
    const conflictReq = new NextRequest('http://localhost:3000/api/developer/profile', {
      method: 'PUT',
      headers: {
        authorization: devAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'taken_handle',
      }),
    });

    const conflictRes = await updateDeveloperProfile(conflictReq);
    expect(conflictRes.status).toBe(400);
    const conflictData = await conflictRes.json();
    expect(conflictData.error).toContain('already taken');
  });

  it('4. Real signup creates developer profile with zero fake dummy data and real title counts', async () => {
    const freshDevEmail = `creator_${Date.now()}@realgames.com`;
    const freshDevName = 'Apex Game Labs';
    const passHash = await hashPassword('Password123!');

    const freshUser = gvDb.createUser({
      name: freshDevName,
      email: freshDevEmail,
      passwordHash: passHash,
      role: 'DEVELOPER',
      emailVerified: true,
    });

    const token = generateToken({
      userId: freshUser.id,
      email: freshUser.email,
      role: freshUser.role,
      name: freshUser.name,
    });

    // Fresh profile should have 0 titles initially and only real registration data
    const req1 = new NextRequest('http://localhost:3000/api/developer/profile', {
      headers: { authorization: `Bearer ${token}` },
    });
    const res1 = await getDeveloperProfile(req1);
    expect(res1.status).toBe(200);
    const data1 = await res1.json();

    expect(data1.profile.studioName).toBe(freshDevName);
    expect(data1.profile.displayName).toBe(freshDevName);
    expect(data1.profile.email).toBe(freshDevEmail);
    expect(data1.profile.website).toBe('');
    expect(data1.profile.portfolioUrl).toBe('');
    expect(data1.profile.bio).toBe('');
    expect(data1.totalTitles).toBe(0);

    // Publish a real game under this developer
    gvDb.createGame({
      developerId: freshUser.id,
      developerName: freshDevName,
      title: 'Apex Galaxy Quest',
      slug: `apex-galaxy-${Date.now()}`,
      status: 'PUBLISHED',
      developedBy: 'Human Developed',
    });

    // Check that totalTitles updates accurately
    const req2 = new NextRequest('http://localhost:3000/api/developer/profile', {
      headers: { authorization: `Bearer ${token}` },
    });
    const res2 = await getDeveloperProfile(req2);
    const data2 = await res2.json();
    expect(data2.totalTitles).toBe(1);
  });
});
