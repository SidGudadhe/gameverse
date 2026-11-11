import { describe, it, expect, beforeEach } from 'vitest';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';
import { requireOwnership, requireRole } from '../src/lib/security/middleware';
import { NextRequest } from 'next/server';

describe('Phase 3: Developer Portal, Onboarding & Studio Management Tests', () => {
  let devAId = '';
  let devBId = '';

  beforeEach(() => {
    // Seed Developer A
    const devA = gvDb.createUser({
      email: `deva_${Date.now()}@studio.com`,
      name: 'PixelForge Studios',
      passwordHash: 'dummyhash',
      role: 'DEVELOPER',
    });
    devAId = devA.id;

    // Seed Developer B
    const devB = gvDb.createUser({
      email: `devb_${Date.now()}@voxel.com`,
      name: 'Voxel Games',
      passwordHash: 'dummyhash',
      role: 'DEVELOPER',
    });
    devBId = devB.id;
  });

  it('should record Creator Agreement with immutable version, timestamp, and IP address', () => {
    const ip = '192.168.1.100';
    const agreement = gvDb.saveAgreement({
      userId: devAId,
      agreementVersion: 'v1.0-2026',
      ipAddress: ip,
      accountStatus: 'ACTIVE',
    });

    expect(agreement.id).toBeDefined();
    expect(agreement.agreementVersion).toBe('v1.0-2026');
    expect(agreement.ipAddress).toBe(ip);
    expect(agreement.accountStatus).toBe('ACTIVE');
    expect(agreement.acceptedAt).toBeDefined();

    // Verify agreement can be retrieved
    const fetched = gvDb.getAgreementByUserId(devAId);
    expect(fetched?.agreementVersion).toBe('v1.0-2026');
    expect(fetched?.accountStatus).toBe('ACTIVE');
  });

  it('should update and retrieve studio profile metadata', () => {
    const updated = gvDb.updateProfile(devAId, {
      studioName: 'PixelForge Super Studios',
      website: 'https://pixelforge.games',
      bio: 'Leading developer of high-speed synthwave games.',
      portfolioUrl: 'https://github.com/pixelforge',
    });

    expect(updated.studioName).toBe('PixelForge Super Studios');
    expect(updated.website).toBe('https://pixelforge.games');

    const fetched = gvDb.getProfileByUserId(devAId);
    expect(fetched?.studioName).toBe('PixelForge Super Studios');
    expect(fetched?.bio).toContain('synthwave');
  });

  it('should configure and persist developer payout settings and notification toggles', () => {
    const settings = gvDb.updateDeveloperSettings(devAId, {
      payoutMethod: 'UPI',
      payoutDetails: { upiId: 'pixelforge@okhdfcbank' },
      notifyOnQaUpdate: true,
      notifyOnPayout: true,
      notifyOnPlayerReport: true,
    });

    expect(settings.payoutMethod).toBe('UPI');
    expect(settings.payoutDetails.upiId).toBe('pixelforge@okhdfcbank');
    expect(settings.notifyOnPlayerReport).toBe(true);

    const fetched = gvDb.getDeveloperSettings(devAId);
    expect(fetched.payoutMethod).toBe('UPI');
    expect(fetched.payoutDetails.upiId).toBe('pixelforge@okhdfcbank');
  });

  it('should submit and retrieve developer support tickets', () => {
    const ticket = gvDb.createSupportTicket({
      creatorId: devAId,
      subject: 'Custom WebGL Shader support',
      category: 'TECHNICAL',
      message: 'Are custom GLSL fragment shaders allowed in the sandboxed iframe?',
    });

    expect(ticket.id).toBeDefined();
    expect(ticket.status).toBe('OPEN');

    const tickets = gvDb.getSupportTicketsByCreator(devAId);
    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets.some((t) => t.subject === 'Custom WebGL Shader support')).toBe(true);
  });

  it('should enforce tenant isolation between Developer A and Developer B', () => {
    // Developer B tries to access Developer A's private resource
    const devBToken = generateToken({
      userId: devBId,
      email: 'devb@voxel.com',
      role: 'DEVELOPER',
      name: 'Voxel Games',
    });

    const mockReq = new NextRequest('http://localhost:3000/api/developer/settings', {
      headers: {
        authorization: `Bearer ${devBToken}`,
      },
    });

    const isolationCheck = requireOwnership(mockReq, devAId);
    expect(isolationCheck.errorResponse).not.toBeNull();
    expect(isolationCheck.errorResponse?.status).toBe(403);
  });

  it('should prevent non-developers from accessing developer endpoints', () => {
    const playerToken = generateToken({
      userId: 'usr-player-x',
      email: 'player@gamer.com',
      role: 'PLAYER',
      name: 'GamerX',
    });

    const mockReq = new NextRequest('http://localhost:3000/api/developer/onboard', {
      headers: {
        authorization: `Bearer ${playerToken}`,
      },
    });

    const roleCheck = requireRole(mockReq, 'DEVELOPER');
    expect(roleCheck.errorResponse).not.toBeNull();
    expect(roleCheck.errorResponse?.status).toBe(403);
  });
});
