import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { gvDb, INITIAL_DATABASE_STATE } from '../src/lib/database';

describe('Player Modes (Single / Multiplayer / Both) & Hover Video Preview', () => {
  const gameCardPath = path.resolve(__dirname, '../src/components/GameCard.tsx');
  const gameSlugPagePath = path.resolve(__dirname, '../src/app/game/[slug]/page.tsx');
  const submitPagePath = path.resolve(__dirname, '../src/app/developer/submit/page.tsx');
  const submitApiPath = path.resolve(__dirname, '../src/app/api/developer/submit/route.ts');
  const videoUploadApiPath = path.resolve(__dirname, '../src/app/api/developer/upload/video/route.ts');
  const layoutPath = path.resolve(__dirname, '../src/app/layout.tsx');
  const googleSignInPath = path.resolve(__dirname, '../src/components/GoogleSignIn.tsx');
  const googleOneTapPath = path.resolve(__dirname, '../src/components/GoogleOneTap.tsx');

  describe('1. Player Mode & Video Preview Data Model & Database Persistence', () => {
    it('1.1 should have playerMode and gameplayVideoUrl defined for all initial catalog games', () => {
      const games = gvDb.getGames();
      expect(games.length).toBeGreaterThan(0);

      const validModes = ['SINGLEPLAYER', 'MULTIPLAYER', 'BOTH'];
      for (const game of games) {
        expect(validModes).toContain(game.playerMode || 'SINGLEPLAYER');
        expect(game.gameplayVideoUrl).toBeDefined();
        expect(typeof game.gameplayVideoUrl).toBe('string');
      }

      // Check specific seeds
      const neonRunner = gvDb.getGameBySlug('neon-runner');
      expect(neonRunner?.playerMode).toBe('SINGLEPLAYER');
      expect(neonRunner?.gameplayVideoUrl).toContain('.mp4');

      const cyberCarnage = gvDb.getGameBySlug('cyber-carnage');
      expect(cyberCarnage?.playerMode).toBe('BOTH');
      expect(cyberCarnage?.gameplayVideoUrl).toContain('.mp4');

      const shadowStrike = gvDb.getGameBySlug('shadow-strike');
      expect(shadowStrike?.playerMode).toBe('MULTIPLAYER');
      expect(shadowStrike?.gameplayVideoUrl).toContain('.mp4');
    });

    it('1.2 should support creating games with playerMode and gameplayVideoUrl via gvDb.createGame', () => {
      const testGame = gvDb.createGame({
        title: 'Super Test Battle 3000',
        developerId: 'usr-dev-1',
        developerName: 'PixelForge Studios',
        playerMode: 'BOTH',
        gameplayVideoUrl: 'https://example.com/videos/battle-3000-preview.mp4',
      });

      expect(testGame.playerMode).toBe('BOTH');
      expect(testGame.gameplayVideoUrl).toBe('https://example.com/videos/battle-3000-preview.mp4');
    });
  });

  describe('2. Developer Submission API & Route Handling', () => {
    it('2.1 should parse, normalize and persist playerMode and gameplayVideoUrl in /api/developer/submit', () => {
      const submitApiCode = fs.readFileSync(submitApiPath, 'utf-8');

      expect(submitApiCode).toContain('playerMode: rawPlayerMode');
      expect(submitApiCode).toContain('gameplayVideoUrl: rawGameplayVideoUrl');
      expect(submitApiCode).toContain("let playerMode: 'SINGLEPLAYER' | 'MULTIPLAYER' | 'BOTH' = 'SINGLEPLAYER'");
      expect(submitApiCode).toContain("playerMode = 'MULTIPLAYER'");
      expect(submitApiCode).toContain("playerMode = 'BOTH'");
      expect(submitApiCode).toContain('playerMode,');
      expect(submitApiCode).toContain('gameplayVideoUrl,');
    });

    it('2.2 should provide dedicated /api/developer/upload/video for 30-50s gameplay video upload', () => {
      expect(fs.existsSync(videoUploadApiPath)).toBe(true);
      const uploadCode = fs.readFileSync(videoUploadApiPath, 'utf-8');

      expect(uploadCode).toContain("requireRole(req, 'DEVELOPER')");
      expect(uploadCode).toContain('uploads');
      expect(uploadCode).toContain('videos');
      expect(uploadCode).toContain('mp4');
      expect(uploadCode).toContain('webm');
    });
  });

  describe('3. Developer Submit UI: Player Mode Under Developed By & 30-50s Gameplay Video', () => {
    it('3.1 should render Player Mode selector directly under Developed By options (human devloper, AI devloped ke niche)', () => {
      const submitPageCode = fs.readFileSync(submitPagePath, 'utf-8');

      // Check Developed By grid appears first
      const developedByIndex = submitPageCode.indexOf('Developed by <span className="text-rose-600">*</span>');
      expect(developedByIndex).toBeGreaterThan(-1);

      // Check Player Mode selector appears after Developed By options
      const playerModeIndex = submitPageCode.indexOf('Player Mode (Single / Multiplayer) <span className="text-rose-600">*</span>');
      expect(playerModeIndex).toBeGreaterThan(-1);
      expect(playerModeIndex).toBeGreaterThan(developedByIndex);

      // Verify all 3 options exist
      expect(submitPageCode).toContain("id: 'SINGLEPLAYER'");
      expect(submitPageCode).toContain("title: 'Single Player'");
      expect(submitPageCode).toContain("id: 'MULTIPLAYER'");
      expect(submitPageCode).toContain("title: 'Multiplayer'");
      expect(submitPageCode).toContain("id: 'BOTH'");
      expect(submitPageCode).toContain("title: 'Single + Multiplayer'");
    });

    it('3.2 should provide 30-50s Gameplay Video Preview input, upload, and live player in Visual Branding section', () => {
      const submitPageCode = fs.readFileSync(submitPagePath, 'utf-8');

      expect(submitPageCode).toContain('30–50 Second Gameplay Preview Video');
      expect(submitPageCode).toContain('Option A: Gameplay Video URL (.mp4 / .webm)');
      expect(submitPageCode).toContain('Option B: Upload 30–50s Video File (MP4, WebM)');
      expect(submitPageCode).toContain('handleVideoFileUpload');
      expect(submitPageCode).toContain('Card Hover Preview Player');
      expect(submitPageCode).toContain('GameVerse Studio Feature');
    });
  });

  describe('4. GameCard: Veg/Non-Veg & Player Mode Badges + Catalog Hover Video Preview', () => {
    it('4.1 should render Player Mode badge alongside Veg/Non-Veg badge on every GameCard', () => {
      const cardCode = fs.readFileSync(gameCardPath, 'utf-8');

      // Veg & Non-Veg badges present
      expect(cardCode).toContain('NON-VEG');
      expect(cardCode).toContain('VEG');

      // Player Mode badges present directly alongside Veg/Non-Veg
      expect(cardCode).toContain("playerMode === 'MULTIPLAYER'");
      expect(cardCode).toContain('MULTIPLAYER');
      expect(cardCode).toContain("playerMode === 'BOTH'");
      expect(cardCode).toContain('SINGLE');
      expect(cardCode).toContain('MULTI');
      expect(cardCode).toContain("playerMode === 'SINGLEPLAYER'");
      expect(cardCode).toContain('SINGLEPLAYER');
    });

    it('4.2 should implement smooth debounced video hover player', () => {
      const cardCode = fs.readFileSync(gameCardPath, 'utf-8');

      // Video element with muted, loop, playsInline
      expect(cardCode).toContain('<video');
      expect(cardCode).toContain('muted');
      expect(cardCode).toContain('loop');
      expect(cardCode).toContain('playsInline');

      // 180ms hover debounce and reset on leave
      expect(cardCode).toContain('180');
      expect(cardCode).toContain('handleMouseEnter');
      expect(cardCode).toContain('handleMouseLeave');
      expect(cardCode).toContain('.play()');
      expect(cardCode).toContain('.pause()');

      // Live preview indicator badge while playing
      expect(cardCode).toContain('PREVIEW');
    });

    it('4.3 should render Player Mode badge alongside Veg/Non-Veg on the Game Details page', () => {
      const slugCode = fs.readFileSync(gameSlugPagePath, 'utf-8');

      expect(slugCode).toContain('Non-Veg (16+)');
      expect(slugCode).toContain('Veg (Family Safe)');
      expect(slugCode).toContain("game.playerMode === 'MULTIPLAYER'");
      expect(slugCode).toContain("game.playerMode === 'BOTH'");
      expect(slugCode).toContain('Singleplayer');
      expect(slugCode).toContain('Multiplayer');
    });
  });

  describe('5. Zero Unprompted Login Pop-ups on Player Website', () => {
    it('5.1 should NOT render GoogleOneTap inside RootLayout', () => {
      const layoutCode = fs.readFileSync(layoutPath, 'utf-8');

      expect(layoutCode).not.toContain('<GoogleOneTap />');
      expect(layoutCode).not.toContain("import GoogleOneTap from '@/components/GoogleOneTap'");
    });

    it('5.2 should disable automatic prompt in GoogleSignIn and GoogleOneTap components', () => {
      const oneTapCode = fs.readFileSync(googleOneTapPath, 'utf-8');
      const signInCode = fs.readFileSync(googleSignInPath, 'utf-8');

      // GoogleOneTap returns null and does not execute prompt
      expect(oneTapCode).toContain('return null');
      expect(oneTapCode).not.toContain('window.google.accounts.id.prompt()');

      // GoogleSignIn defaults enableOneTap to false
      expect(signInCode).toContain('enableOneTap = false');
    });
  });
});
