import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { gvDb } from '../src/lib/database';
import { generateToken, hashPassword } from '../src/lib/auth';
import { calculateAdRevenue, isInGameAdFormat } from '../src/lib/ads';
import { POST as submitGame } from '../src/app/api/developer/submit/route';
import { GET as getNotifications } from '../src/app/api/developer/notifications/route';
import { GET as getDeveloperGames } from '../src/app/api/developer/games/route';
import { PATCH as patchGameSettings } from '../src/app/api/developer/games/[id]/route';

describe('Developer Homepage Rebuild, In-Game Ad Revenue Split & Studio Streams', () => {
  const devPagePath = path.join(process.cwd(), 'src/app/developer/page.tsx');
  const payoutsPagePath = path.join(process.cwd(), 'src/app/developer/payouts/page.tsx');
  const gamesPagePath = path.join(process.cwd(), 'src/app/developer/games/page.tsx');
  const submitPagePath = path.join(process.cwd(), 'src/app/developer/submit/page.tsx');
  const notifRoutePath = path.join(process.cwd(), 'src/app/api/developer/notifications/route.ts');

  const devContent = fs.readFileSync(devPagePath, 'utf8');
  const payoutsContent = fs.readFileSync(payoutsPagePath, 'utf8');
  const gamesContent = fs.readFileSync(gamesPagePath, 'utf8');
  const submitContent = fs.readFileSync(submitPagePath, 'utf8');
  const notifContent = fs.readFileSync(notifRoutePath, 'utf8');

  it('1. renders 3 compact top KPI metric boxes as specified', () => {
    expect(devContent).toContain('Total Published Games');
    expect(devContent).toContain('( Live on GameVerse )');

    expect(devContent).toContain('Total Games Playtime');
    expect(devContent).toContain('Across');
    expect(devContent).toContain('verified player sessions');

    expect(devContent).toContain('Total Revenue');
    expect(devContent).toContain('In-Game Ads Share Only (50% Organic / 70% Referral)');
    expect(devContent).toContain('Website banners are excluded.');
  });

  it('2. grants developer revenue share strictly on in-game ad formats and 0% on website outer ads', () => {
    // Eligible In-Game Ads
    expect(isInGameAdFormat('PREROLL')).toBe(true);
    expect(isInGameAdFormat('INTERSTITIAL')).toBe(true);
    expect(isInGameAdFormat('REWARDED')).toBe(true);
    expect(isInGameAdFormat('BONUS_REWARD')).toBe(true);
    expect(isInGameAdFormat('BANNER')).toBe(true);

    // Website Outer Ads (0% creator earnings)
    expect(isInGameAdFormat('NATIVE')).toBe(false);
    expect(isInGameAdFormat('DISPLAY')).toBe(false);
    expect(isInGameAdFormat('SPONSORED_LISTING')).toBe(false);

    const inGameRev = calculateAdRevenue('REWARDED', true, false);
    expect(inGameRev.creatorShareRate).toBe(0.7);
    expect(inGameRev.creatorShareAmount).toBeGreaterThan(0);

    const displayRev = calculateAdRevenue('DISPLAY', true, false);
    expect(displayRev.creatorShareRate).toBe(0);
    expect(displayRev.creatorShareAmount).toBe(0);

    const nativeRev = calculateAdRevenue('NATIVE', false, false);
    expect(nativeRev.creatorShareRate).toBe(0);
    expect(nativeRev.creatorShareAmount).toBe(0);

    // Payouts UI shows only in-game ad breakdown
    expect(payoutsContent).toContain('In-Game Ads Share Only');
    expect(payoutsContent).toContain('Website Banners Excluded');
    expect(payoutsContent).not.toContain('Player Subscriptions:');
  });

  it('3. renders readable Notice cards & full notice reading modal, Change Request form actions, and Growth Notifications', () => {
    // Readable notice experience + full modal
    expect(devContent).toContain('Official Admin Notice');
    expect(devContent).toContain('Read Full Notice');
    expect(devContent).toContain('Official Admin Notice (Read-Only)');

    // Change / Update Request action opens that specific game form
    expect(devContent).toContain('Change / Update Request');
    expect(devContent).toContain('Admin Review Feedback & Action Required:');
    expect(devContent).toContain('/developer/submit?edit=${cr.gameId}&requestRef=${cr.id}');

    // Growth notifications stream
    expect(devContent).toContain('Growth Notifications');
    expect(notifContent).toContain('PLAYTIME_SPIKE');
    expect(notifContent).toContain('REVENUE_SPIKE');
    expect(notifContent).toContain('UPDATE_IMPACT');
  });

  it('4. provides interactive tab filters for the 3 streams', () => {
    expect(devContent).toContain("setActiveTab('ALL')");
    expect(devContent).toContain("setActiveTab('NOTICES')");
    expect(devContent).toContain("setActiveTab('CHANGE_REQUESTS')");
    expect(devContent).toContain("setActiveTab('GROWTH')");
  });

  it('5. ensures live published games in Your Studio Games & My Games have editable update form actions', () => {
    expect(devContent).toContain('Live on Website • Editable anytime');
    expect(devContent).toContain('Change / Update Info');
    expect(devContent).toContain('/developer/submit?edit=${g.id}');

    expect(gamesContent).toContain('In-Game Ad Revenue');
    expect(gamesContent).toContain('Average Revenue of a Game');
    expect(gamesContent).toContain('Average Revenue of a Game — Per-Game Player Earnings');
    expect(gamesContent).not.toContain('Total Catalog Revenue');
    expect(gamesContent).toContain('Change / Update Info');
    expect(gamesContent).toContain('/developer/submit?edit=${game.id}');

    expect(submitContent).toContain('Game Update Mode');
    expect(submitContent).toContain('Save Changes & Submit to Admin for Review');
  });

  it('6. ensures complete portal isolation with no direct player links or cookie settings', () => {
    expect(devContent).not.toMatch(/href=\{`\/game\/\$\{/);
    expect(devContent).toContain('/sandbox/');
    expect(devContent).not.toContain('Cookie Settings');
    expect(devContent).not.toContain('Cookie Preferences');
  });

  describe('7. Live Game Info Update & Change Request Resubmission Flow (E2E)', () => {
    let devId: string;
    let authHeader: string;
    const uniqueSuffix = Date.now();

    beforeEach(async () => {
      devId = `usr-dev-e2e-${uniqueSuffix}-${Math.random().toString(36).slice(2, 6)}`;
      const passHash = await hashPassword('Password123!');
      const user = gvDb.createUser({
        id: devId,
        name: 'Summit Studio',
        email: `summit-${uniqueSuffix}@studio.dev`,
        passwordHash: passHash,
        role: 'DEVELOPER',
        emailVerified: true,
      });

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
      authHeader = `Bearer ${token}`;
    });

    it('keeps a live published game available while routing submitted updates to Admin, and resolves change requests upon resubmission', async () => {
      // 1. Seed a published live game owned by this developer
      const slug = `live-arena-${uniqueSuffix}`;
      const liveGame = gvDb.createGame({
        id: `game-${slug}`,
        developerId: devId,
        developerName: 'Summit Studio',
        categoryId: 'cat-action',
        categoryName: 'Action',
        mainCategory: 'VEG',
        subCategory: 'action',
        slug,
        title: 'Live Arena Clash',
        shortDescription: 'Initial live description.',
        fullDescription: 'Initial live full description.',
        controlsGuide: 'WASD',
        engine: 'HTML5 Canvas',
        orientation: 'LANDSCAPE',
        thumbnailUrl: '/images/test-thumb.jpg',
        bannerUrl: '/images/test-banner.jpg',
        screenshots: [],
        currentVersionId: `ver-${slug}-1_0_0`,
        status: 'PUBLISHED',
        playerMode: 'SINGLEPLAYER',
      });

      // Seed custom HTML5 bundle on disk so updating info preserves real game files
      const liveVersionId = liveGame.currentVersionId || `ver-${slug}-1_0_0`;
      const liveDir = path.join(process.cwd(), '.data', 'games', liveGame.id, liveVersionId);
      fs.mkdirSync(liveDir, { recursive: true });
      const customHtml = '<!DOCTYPE html><html><body><canvas id="real-game"></canvas></body></html>';
      fs.writeFileSync(path.join(liveDir, 'index.html'), customHtml);

      // 2. Quick PATCH update on live published game succeeds (playerMode + gameplayVideoUrl)
      const patchReq = new NextRequest(`http://localhost:3000/api/developer/games/${liveGame.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          title: 'Live Arena Clash Remastered',
          playerMode: 'BOTH',
          gameplayVideoUrl: '/videos/preview-action.mp4',
        }),
      });
      const patchRes = await patchGameSettings(patchReq, { params: { id: liveGame.id } });
      expect(patchRes.status).toBe(200);
      const patchData = await patchRes.json();
      expect(patchData.game.title).toBe('Live Arena Clash Remastered');
      expect(patchData.game.playerMode).toBe('BOTH');
      expect(patchData.game.status).toBe('PUBLISHED');

      // 3. Seed an Admin Change Request submission against another game of the same developer
      const crSlug = `cr-puzzle-${uniqueSuffix}`;
      const crGame = gvDb.createGame({
        id: `game-${crSlug}`,
        developerId: devId,
        developerName: 'Summit Studio',
        categoryId: 'cat-puzzle',
        categoryName: 'Puzzle',
        mainCategory: 'VEG',
        subCategory: 'puzzle',
        slug: crSlug,
        title: 'Quantum Logic Boxes',
        shortDescription: 'Puzzle game awaiting fix.',
        fullDescription: 'Puzzle details.',
        controlsGuide: 'Mouse',
        engine: 'HTML5 Canvas',
        orientation: 'LANDSCAPE',
        thumbnailUrl: '/images/test-thumb.jpg',
        bannerUrl: '/images/test-banner.jpg',
        screenshots: [],
        currentVersionId: `ver-${crSlug}-1_0_0`,
        status: 'CHANGES_REQUESTED',
        playerMode: 'SINGLEPLAYER',
      });
      const crSub = gvDb.createSubmission({
        versionId: crGame.currentVersionId || `ver-${crSlug}-1_0_0`,
        gameId: crGame.id,
        gameTitle: crGame.title,
        developerName: 'Summit Studio',
        manualNotes: 'Please add touch controls guide.',
      });
      gvDb.updateSubmissionStatus(crSub.id, 'CHANGES_REQUESTED', {
        reviewedBy: 'Platform Admin',
        manualNotes: 'Add touch controls description and update playerMode.',
      });

      // Verify notifications endpoint shows the active change request with open-form actionUrl
      const notifReq1 = new NextRequest('http://localhost:3000/api/developer/notifications', {
        headers: { Authorization: authHeader },
      });
      const notifRes1 = await getNotifications(notifReq1);
      const notifJson1 = await notifRes1.json();
      const crItem = notifJson1.changeRequests.find((c: any) => c.gameId === crGame.id);
      expect(crItem).toBeDefined();
      expect(crItem.type).toBe('CHANGE_REQUESTED');
      expect(crItem.actionUrl).toContain(`/developer/submit?edit=${crGame.id}&requestRef=${crSub.id}`);

      // 4. Submit updated form for the change-requested game + updated info on the live game
      const resubmitReq = new NextRequest('http://localhost:3000/api/developer/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          title: 'Quantum Logic Boxes',
          slug: crSlug,
          shortDescription: 'Updated with full touch & keyboard support.',
          controlsGuide: 'Mouse / Touch Drag',
          playerMode: 'SINGLEPLAYER',
          versionNumber: '1.0.1',
          rightsConfirmed: true,
          prohibitedContentConfirmed: true,
          requestRef: crSub.id,
        }),
      });
      const resubmitRes = await submitGame(resubmitReq);
      expect(resubmitRes.status).toBe(201);
      const resubmitData = await resubmitRes.json();
      expect(resubmitData.submission.status).toBe('SUBMITTED');
      expect(resubmitData.game.status).toBe('SUBMITTED');

      // Notifications should now show PENDING_ADMIN_REVIEW ("Sent to Admin") instead of stale CHANGE_REQUESTED
      const notifReq2 = new NextRequest('http://localhost:3000/api/developer/notifications', {
        headers: { Authorization: authHeader },
      });
      const notifRes2 = await getNotifications(notifReq2);
      const notifJson2 = await notifRes2.json();
      const updatedCrItem = notifJson2.changeRequests.find((c: any) => c.gameId === crGame.id);
      expect(updatedCrItem).toBeDefined();
      expect(updatedCrItem.type).toBe('PENDING_ADMIN_REVIEW');

      // 5. Submit update on the LIVE published game without uploading a new ZIP -> preserves bundle and keeps game live while queuing update to Admin!
      const liveUpdateReq = new NextRequest('http://localhost:3000/api/developer/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          title: 'Live Arena Clash Remastered',
          slug,
          shortDescription: 'Updated live game description cleanly.',
          playerMode: 'BOTH',
          versionNumber: '1.0.0',
          rightsConfirmed: true,
          prohibitedContentConfirmed: true,
        }),
      });
      const liveUpdateRes = await submitGame(liveUpdateReq);
      expect(liveUpdateRes.status).toBe(201);
      const liveUpdateData = await liveUpdateRes.json();
      expect(liveUpdateData.game.status).toBe('PUBLISHED');
      expect(liveUpdateData.submission.status).toBe('SUBMITTED');
      // Custom game bundle index.html was NOT overwritten by mock stub!
      expect(fs.readFileSync(path.join(liveDir, 'index.html'), 'utf8')).toBe(customHtml);

      // Cleanup seeded files on disk
      fs.rmSync(path.join(process.cwd(), '.data', 'games', liveGame.id), { recursive: true, force: true });
      fs.rmSync(path.join(process.cwd(), '.data', 'games', crGame.id), { recursive: true, force: true });
    });

    it('computes accurate averageRevenueOfGame and per-game avgEarningPerPlay across developer titles', async () => {
      const slugA = `avg-alpha-${Date.now()}`;
      const slugB = `avg-beta-${Date.now()}`;

      const gameA = gvDb.createGame({
        id: `game-${slugA}`,
        developerId: devId,
        developerName: 'Summit Studio',
        categoryId: 'cat-action',
        categoryName: 'Action',
        mainCategory: 'VEG',
        subCategory: 'action',
        slug: slugA,
        title: 'Alpha Flyer',
        shortDescription: 'Desc A',
        fullDescription: 'Full A',
        controlsGuide: 'Space',
        engine: 'HTML5 Canvas',
        orientation: 'LANDSCAPE',
        thumbnailUrl: '/images/test-thumb.jpg',
        bannerUrl: '/images/test-banner.jpg',
        screenshots: [],
        currentVersionId: `ver-${slugA}-1_0_0`,
        status: 'PUBLISHED',
      });
      gvDb.updateGame(gameA.id, { totalPlays: 1000 });

      const gameB = gvDb.createGame({
        id: `game-${slugB}`,
        developerId: devId,
        developerName: 'Summit Studio',
        categoryId: 'cat-arcade',
        categoryName: 'Arcade',
        mainCategory: 'VEG',
        subCategory: 'arcade',
        slug: slugB,
        title: 'Beta Runner',
        shortDescription: 'Desc B',
        fullDescription: 'Full B',
        controlsGuide: 'WASD',
        engine: 'HTML5 Canvas',
        orientation: 'LANDSCAPE',
        thumbnailUrl: '/images/test-thumb.jpg',
        bannerUrl: '/images/test-banner.jpg',
        screenshots: [],
        currentVersionId: `ver-${slugB}-1_0_0`,
        status: 'PUBLISHED',
      });
      gvDb.updateGame(gameB.id, { totalPlays: 500 });

      gvDb.createFinancialRecord({
        creatorId: devId,
        gameId: gameA.id,
        gameTitle: gameA.title,
        grossRevenue: 1000,
        deductions: 100,
        netRevenue: 900,
        creatorShare: 300,
        status: 'FINALIZED',
        period: '2026-11',
      });
      gvDb.createFinancialRecord({
        creatorId: devId,
        gameId: gameB.id,
        gameTitle: gameB.title,
        grossRevenue: 400,
        deductions: 40,
        netRevenue: 360,
        creatorShare: 100,
        status: 'FINALIZED',
        period: '2026-11',
      });

      const req = new NextRequest('http://localhost:3000/api/developer/games', {
        headers: { Authorization: authHeader },
      });
      const res = await getDeveloperGames(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.count).toBe(2);
      expect(data.totalCatalogEarnings).toBe(400);
      expect(data.averageRevenueOfGame).toBe(200);

      const retA = data.games.find((g: any) => g.id === gameA.id);
      const retB = data.games.find((g: any) => g.id === gameB.id);
      expect(retA.earnings).toBe(300);
      expect(retA.avgEarningPerPlay).toBe(0.3);
      expect(retB.earnings).toBe(100);
      expect(retB.avgEarningPerPlay).toBe(0.2);
    });
  });
});
