import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import AdmZip from 'adm-zip';
import { renderToStaticMarkup } from 'react-dom/server';
import { gvDb } from '../src/lib/database';
import { generateToken, hashPassword } from '../src/lib/auth';
import { POST as submitGame } from '../src/app/api/developer/submit/route';
import { GET as getGameDetails } from '../src/app/api/games/[slug]/route';
import GamePage from '../src/app/game/[slug]/page';
import React from 'react';

describe('Player Website Game Information: Developed by Selection & Badge', () => {
  let devId: string;
  let devAuthHeader: string;
  const devName = 'Quantum Arcade Studio';
  const devEmail = 'quantum@arcadestudio.io';

  beforeEach(async () => {
    devId = `usr-dev-test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const passHash = await hashPassword('Password123!');

    const user = gvDb.createUser({
      id: devId,
      name: devName,
      email: devEmail,
      passwordHash: passHash,
      role: 'DEVELOPER',
      emailVerified: true,
    });

    // Sign developer agreement
    gvDb.saveAgreement({
      userId: devId,
      agreementVersion: 'v1.0-2026',
      ipAddress: '127.0.0.1',
      accountStatus: 'ACTIVE',
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    devAuthHeader = `Bearer ${token}`;
  });

  const createDummyZipBase64 = () => {
    const zip = new AdmZip();
    zip.addFile('index.html', Buffer.from('<!DOCTYPE html><html><body><h1>Game</h1></body></html>'));
    return zip.toBuffer().toString('base64');
  };

  it('1. Developer selects "Human Developed": persists in DB and returns on game object', async () => {
    const uniqueSlug = `human-crafted-${Date.now().toString(36)}`;
    const zipBase64 = createDummyZipBase64();

    const req = new NextRequest('http://localhost:3000/api/developer/submit', {
      method: 'POST',
      headers: {
        authorization: devAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Cyber Blade Odyssey',
        slug: uniqueSlug,
        shortDescription: 'Hand-crafted pixel art adventure.',
        fullDescription: 'Hand-crafted pixel art adventure with custom orchestral music.',
        categoryId: 'cat-action',
        categoryName: 'Action',
        engine: 'Custom Canvas Engine',
        orientation: 'LANDSCAPE',
        controlsGuide: 'Arrow keys: Move\nZ: Attack',
        versionNumber: '1.0.0',
        changelog: 'Initial release',
        thumbnailUrl: '/images/placeholders/thumb.png',
        bannerUrl: '/images/placeholders/banner.png',
        developedBy: 'Human Developed',
        rightsConfirmed: true,
        prohibitedContentConfirmed: true,
        fileBase64: zipBase64,
      }),
    });

    const res = await submitGame(req);
    expect(res.status).toBe(201);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.game.developedBy).toBe('Human Developed');
    expect(data.rights.developedBy).toBe('Human Developed');
    expect(data.rights.aiDisclosure).toBe('NONE_HUMAN_ONLY');

    // Retrieve directly from database
    const saved = gvDb.getGameBySlug(uniqueSlug);
    expect(saved).toBeDefined();
    expect(saved?.developedBy).toBe('Human Developed');
  });

  it('2. Developer selects "AI Developed": persists in DB and returns on game object', async () => {
    const uniqueSlug = `ai-synthesized-${Date.now().toString(36)}`;
    const zipBase64 = createDummyZipBase64();

    const req = new NextRequest('http://localhost:3000/api/developer/submit', {
      method: 'POST',
      headers: {
        authorization: devAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Neural Maze Escape',
        slug: uniqueSlug,
        shortDescription: 'AI-generated puzzles and audio.',
        fullDescription: 'AI-generated labyrinths synthesized by deep neural networks.',
        categoryId: 'cat-puzzle',
        categoryName: 'Puzzle',
        engine: 'Three.js',
        orientation: 'LANDSCAPE',
        controlsGuide: 'WASD to navigate',
        versionNumber: '1.0.0',
        changelog: 'Initial release',
        thumbnailUrl: '/images/placeholders/thumb.png',
        bannerUrl: '/images/placeholders/banner.png',
        developedBy: 'AI Developed',
        rightsConfirmed: true,
        prohibitedContentConfirmed: true,
        fileBase64: zipBase64,
      }),
    });

    const res = await submitGame(req);
    expect(res.status).toBe(201);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.game.developedBy).toBe('AI Developed');
    expect(data.rights.developedBy).toBe('AI Developed');
    expect(data.rights.aiDisclosure).toBe('AI_GENERATED');

    const saved = gvDb.getGameBySlug(uniqueSlug);
    expect(saved?.developedBy).toBe('AI Developed');
  });

  it('3. Developer selects "AI + Human Developed": persists in DB and returns on game object', async () => {
    const uniqueSlug = `hybrid-galaxy-${Date.now().toString(36)}`;
    const zipBase64 = createDummyZipBase64();

    const req = new NextRequest('http://localhost:3000/api/developer/submit', {
      method: 'POST',
      headers: {
        authorization: devAuthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Hybrid Star Fighter',
        slug: uniqueSlug,
        shortDescription: 'AI concept art refined with human mechanics.',
        fullDescription: 'Fast-paced space arcade fighter with human-coded gameplay and AI concepts.',
        categoryId: 'cat-arcade',
        categoryName: 'Arcade',
        engine: 'Phaser 3',
        orientation: 'LANDSCAPE',
        controlsGuide: 'Mouse to aim and shoot',
        versionNumber: '1.0.0',
        changelog: 'Initial release',
        thumbnailUrl: '/images/placeholders/thumb.png',
        bannerUrl: '/images/placeholders/banner.png',
        developedBy: 'AI + Human Developed',
        rightsConfirmed: true,
        prohibitedContentConfirmed: true,
        fileBase64: zipBase64,
      }),
    });

    const res = await submitGame(req);
    expect(res.status).toBe(201);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.game.developedBy).toBe('AI + Human Developed');
    expect(data.rights.developedBy).toBe('AI + Human Developed');
    expect(data.rights.aiDisclosure).toBe('AI_ASSISTED');

    const saved = gvDb.getGameBySlug(uniqueSlug);
    expect(saved?.developedBy).toBe('AI + Human Developed');
  });

  it('4. Public API GET /api/games/[slug] returns developedBy to the player client', async () => {
    const req = new NextRequest('http://localhost:3000/api/games/neon-runner');
    const res = await getGameDetails(req, { params: { slug: 'neon-runner' } });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.game.developedBy).toBe('Human Developed');
  });

  it('5. Player website GamePage renders "Developed by" row in Game Information section', async () => {
    // 5a. Existing seeded game: neon-runner (Human Developed)
    const neonEl = await GamePage({ params: { slug: 'neon-runner' } });
    const neonHtml = renderToStaticMarkup(neonEl);
    expect(neonHtml).toContain('Developed by');
    expect(neonHtml).toContain('Human Developed');

    // 5b. Existing seeded game: voxel-quest (AI + Human Developed)
    const voxelEl = await GamePage({ params: { slug: 'voxel-quest' } });
    const voxelHtml = renderToStaticMarkup(voxelEl);
    expect(voxelHtml).toContain('Developed by');
    expect(voxelHtml).toContain('AI + Human Developed');

    // 5c. Custom published AI Developed game
    const aiGame = gvDb.createGame({
      developerId: devId,
      developerName: devName,
      title: 'SynthMind AI Arena',
      slug: `synthmind-${Date.now().toString(36)}`,
      shortDescription: 'AI-generated tactical battles.',
      fullDescription: 'AI-generated tactical battles.',
      status: 'PUBLISHED',
      developedBy: 'AI Developed',
      categoryName: 'Strategy',
      categoryId: 'cat-strategy',
    });

    const aiEl = await GamePage({ params: { slug: aiGame.slug } });
    const aiHtml = renderToStaticMarkup(aiEl);
    expect(aiHtml).toContain('Developed by');
    expect(aiHtml).toContain('AI Developed');
  });
});
