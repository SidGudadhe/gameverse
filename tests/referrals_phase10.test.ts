import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { gvDb } from '../src/lib/database';
import { generateToken } from '../src/lib/auth';
import {
  generateReferralToken,
  validateReferralAttribution,
  calculateCreatorRevenueShare,
  generateSocialShareLinks,
} from '../src/lib/referrals';
import {
  GET as getDeveloperReferrals,
  POST as createDeveloperReferral,
} from '../src/app/api/developer/referrals/route';
import { GET as resolveReferralToken } from '../src/app/api/referrals/[token]/route';
import { POST as pingTelemetry } from '../src/app/api/analytics/ping/route';

describe('Phase 10: Social Promotion, Opaque Referral Engine & Anti-Fraud', () => {
  let devId: string;
  let otherDevId: string;
  let devAuthHeader: string;
  let otherDevAuthHeader: string;
  let testGameId: string;
  let otherGameId: string;

  beforeEach(() => {
    devId = `usr-dev-p10-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    otherDevId = `usr-dev-other-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const devToken = generateToken({
      userId: devId,
      email: 'dev@referralstudio.com',
      role: 'DEVELOPER',
    });
    devAuthHeader = `Bearer ${devToken}`;

    const otherToken = generateToken({
      userId: otherDevId,
      email: 'other@studio.com',
      role: 'DEVELOPER',
    });
    otherDevAuthHeader = `Bearer ${otherToken}`;

    // Seed games
    testGameId = `game-p10-${Date.now()}`;
    gvDb.createGame({
      id: testGameId,
      developerId: devId,
      developerName: 'Referral Studio',
      categoryId: 'cat-arcade',
      categoryName: 'Arcade',
      slug: `referral-rush-${Date.now()}`,
      title: 'Referral Rush 2026',
      shortDescription: 'Social promotion test title.',
      status: 'PUBLISHED',
      totalPlays: 0,
      totalPlayMinutes: 0,
    });

    otherGameId = `game-other-p10-${Date.now()}`;
    gvDb.createGame({
      id: otherGameId,
      developerId: otherDevId,
      developerName: 'Other Studio',
      categoryId: 'cat-action',
      categoryName: 'Action',
      slug: `other-rush-${Date.now()}`,
      title: 'Other Rush',
      shortDescription: 'Other studio title.',
      status: 'PUBLISHED',
      totalPlays: 0,
      totalPlayMinutes: 0,
    });
  });

  it('1. should generate opaque, tamper-proof referral tokens without exposing sensitive developer identities', () => {
    const token1 = generateReferralToken('rush');
    const token2 = generateReferralToken();

    expect(token1.startsWith('cr_rush_')).toBe(true);
    expect(token2.startsWith('cr_')).toBe(true);

    // Verify randomness and privacy (never leak raw developer ID or email)
    expect(token1).not.toContain(devId);
    expect(token1).not.toContain('@');
    expect(token1).not.toBe(token2);
  });

  it('2. should enforce anti-fraud checks, strictly prohibiting self-referral bonus farming', () => {
    const validToken = generateReferralToken();

    // 1. Creator attempts to play through their own referral link
    const selfCheck = validateReferralAttribution({
      referralToken: validToken,
      creatorId: devId,
      playerId: devId, // Identical ID (self-referral)
    });

    expect(selfCheck.isValid).toBe(false);
    expect(selfCheck.bonusPercent).toBe(0);
    expect(selfCheck.reason).toContain('Self-referral prohibited');

    // 2. Legitimate independent player
    const legitCheck = validateReferralAttribution({
      referralToken: validToken,
      creatorId: devId,
      playerId: 'usr-different-player',
    });

    expect(legitCheck.isValid).toBe(true);
    expect(legitCheck.bonusPercent).toBe(20);

    // 3. Malformed token format
    const badCheck = validateReferralAttribution({
      referralToken: 'malicious_token_without_prefix',
      creatorId: devId,
      playerId: 'usr-player-2',
    });
    expect(badCheck.isValid).toBe(false);
  });

  it('3. should calculate revenue share with tiered bonus (+20% direct promotion bonus up to 70%)', () => {
    // Standard organic play without referral
    const organic = calculateCreatorRevenueShare(0.50, false);
    expect(organic.shareRate).toBe(0.50);
    expect(organic.bonusRate).toBe(0);

    // Direct promotion referral play (+20% bonus boost)
    const referral = calculateCreatorRevenueShare(0.50, true, 20);
    expect(referral.shareRate).toBe(0.70); // 50% base + 20% bonus = 70% net
    expect(referral.bonusRate).toBe(0.20);
  });

  it('4. should construct social sharing links for Twitter, Reddit, WhatsApp, and Discord with attribution parameters', () => {
    const token = 'cr_promo123';
    const links = generateSocialShareLinks('Referral Rush', 'referral-rush', token, 'https://gameverse.com');

    expect(links.fullUrl).toBe('https://gameverse.com/game/referral-rush?ref=cr_promo123');
    expect(links.twitter).toContain('twitter.com/intent/tweet');
    expect(links.twitter).toContain(encodeURIComponent('https://gameverse.com/game/referral-rush?ref=cr_promo123'));
    expect(links.reddit).toContain('reddit.com/submit');
    expect(links.whatsapp).toContain('api.whatsapp.com/send');
    expect(links.discordCopyText).toContain('🎮');
    expect(links.discordCopyText).toContain(links.fullUrl);
  });

  it('5. should create new referral campaigns via POST /api/developer/referrals with tenant isolation', async () => {
    const req = new NextRequest('http://localhost:3000/api/developer/referrals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: devAuthHeader,
      },
      body: JSON.stringify({
        gameId: testGameId,
        campaignName: 'YouTube Launch Demo',
        bonusPercent: 20,
      }),
    });

    const res = await createDeveloperReferral(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.link.campaignName).toBe('YouTube Launch Demo');
    expect(body.link.token.startsWith('cr_')).toBe(true);
    expect(body.link.bonusPercent).toBe(20);
    expect(body.link.shareUrls.fullUrl).toContain(`?ref=${body.link.token}`);

    // Verify rejection if developer tries to create link for another developer's game
    const reqForbidden = new NextRequest('http://localhost:3000/api/developer/referrals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: devAuthHeader,
      },
      body: JSON.stringify({
        gameId: otherGameId,
        campaignName: 'Hacker Campaign',
      }),
    });

    const resForbidden = await createDeveloperReferral(reqForbidden);
    expect(resForbidden.status).toBe(403);
  });

  it('6. should list all active referral campaigns for the authenticated studio via GET /api/developer/referrals', async () => {
    // Seed 2 referral links
    gvDb.createReferralLink({
      gameId: testGameId,
      creatorId: devId,
      campaignName: 'Discord Drop',
      customToken: `cr_discord_${Date.now()}`,
    });
    gvDb.createReferralLink({
      gameId: testGameId,
      creatorId: devId,
      campaignName: 'Twitter Announcement',
      customToken: `cr_twitter_${Date.now()}`,
    });

    const req = new NextRequest('http://localhost:3000/api/developer/referrals', {
      headers: { Authorization: devAuthHeader },
    });

    const res = await getDeveloperReferrals(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.count).toBeGreaterThanOrEqual(2);
    expect(body.data.some((c: any) => c.campaignName === 'Discord Drop')).toBe(true);
    expect(body.data.some((c: any) => c.campaignName === 'Twitter Announcement')).toBe(true);
  });

  it('7. should resolve public referral tokens via GET /api/referrals/[token], recording click telemetry', async () => {
    const token = `cr_resolve_${Date.now()}`;
    const link = gvDb.createReferralLink({
      gameId: testGameId,
      creatorId: devId,
      campaignName: 'Reddit Feature',
      customToken: token,
    });

    const req = new NextRequest(`http://localhost:3000/api/referrals/${token}`);
    const res = await resolveReferralToken(req, { params: { token } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.valid).toBe(true);
    expect(body.token).toBe(token);
    expect(body.game.id).toBe(testGameId);
    expect(body.game.title).toBe('Referral Rush 2026');

    // Verify click count incremented in database
    const updatedLink = gvDb.getReferralLinkByToken(token);
    expect(updatedLink!.clicks).toBe(1);

    // Verify 404 for invalid token
    const reqMissing = new NextRequest('http://localhost:3000/api/referrals/cr_non_existent');
    const resMissing = await resolveReferralToken(reqMissing, { params: { token: 'cr_non_existent' } });
    expect(resMissing.status).toBe(404);
  });

  it('8. should attribute player gameplay sessions to referral campaigns and update metrics', async () => {
    const token = `cr_attr_${Date.now()}`;
    gvDb.createReferralLink({
      gameId: testGameId,
      creatorId: devId,
      campaignName: 'Influencer Stream',
      customToken: token,
    });

    const sessionToken = `sess-ref-flow-${Date.now()}`;

    // Send SESSION_START with referralToken
    const pingRes = await pingTelemetry(
      new NextRequest('http://localhost:3000/api/analytics/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          gameId: testGameId,
          sessionToken,
          eventType: 'SESSION_START',
          referralToken: token,
          playerId: 'usr-referred-player-1',
        }),
      })
    );

    expect(pingRes.status).toBe(200);

    // Verify database session attribution
    const session = gvDb.getSessionByToken(sessionToken);
    expect(session!.referralToken).toBe(token);

    // Verify link received the attributed click and unique player
    const link = gvDb.getReferralLinkByToken(token);
    expect(link!.clicks).toBeGreaterThanOrEqual(1);
    expect(link!.uniquePlayers).toBeGreaterThanOrEqual(1);
  });
});
