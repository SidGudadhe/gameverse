import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as requestGame, GET as getGameRequests } from '../src/app/api/player/request-game/route';
import { generateToken } from '../src/lib/auth';
import { gvDb } from '../src/lib/database';
import fs from 'fs';
import path from 'path';

describe('Game Title Request Authentication Verification (No Guest Requests Allowed)', () => {
  const TEST_PLAYER = {
    userId: 'usr_req_player_1',
    email: 'gamer_request@gameverse.test',
    name: 'Gamer Requester',
    role: 'PLAYER' as const,
  };

  let playerToken: string;

  beforeEach(() => {
    playerToken = generateToken(TEST_PLAYER);
  });

  // =========================================================================
  // 1. BACKEND API ACCESS CONTROL FOR GAME REQUESTS
  // =========================================================================
  it('1. should strictly reject unauthenticated game request attempts with 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/request-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'bgmi' }),
      // No auth token
    });

    const res = await requestGame(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Authentication required/i);
  });

  it('2. should reject unauthenticated GET requests with 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/request-game', {
      method: 'GET',
    });

    const res = await getGameRequests(req);
    expect(res.status).toBe(401);
  });

  it('3. should validate missing game title for authenticated users with 400 Bad Request', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/request-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${playerToken}`,
      },
      body: JSON.stringify({ title: '   ' }),
    });

    const res = await requestGame(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain('Game title is required');
  });

  it('4. should successfully record game request for authenticated player', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/request-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${playerToken}`,
      },
      body: JSON.stringify({ title: 'bgmi' }),
    });

    const res = await requestGame(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('bgmi');
    expect(data.request.userId).toBe(TEST_PLAYER.userId);
    expect(data.request.title).toBe('bgmi');
    expect(data.request.status).toBe('PENDING');

    // Verify stored in gvDb
    const stored = gvDb.getGameRequests(TEST_PLAYER.userId);
    expect(stored.some((r) => r.title === 'bgmi')).toBe(true);
  });

  it('5. should return player game requests via GET /api/player/request-game when authenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/player/request-game', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${playerToken}`,
      },
    });

    const res = await getGameRequests(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.requests)).toBe(true);
    expect(data.requests.length).toBeGreaterThan(0);
  });

  // =========================================================================
  // 2. FRONTEND SEARCH PAGE INTEGRATION
  // =========================================================================
  it('6. SearchPage should gate handleRequestGame behind authentication and open auth modal for guests', () => {
    const searchPagePath = path.resolve(__dirname, '../src/app/search/page.tsx');
    const content = fs.readFileSync(searchPagePath, 'utf-8');

    // Uses Auth Context
    expect(content).toContain("import { useAuth } from '@/context/AuthContext';");
    expect(content).toContain('const { isAuthenticated, openAuthModal } = useAuth();');

    // Enforces auth check on handleRequestGame
    expect(content).toContain('if (!isAuthenticated) {');
    expect(content).toContain("openAuthModal('LOGIN');");

    // Submits to backend API only when authenticated
    expect(content).toContain("fetch('/api/player/request-game'");
  });
});
