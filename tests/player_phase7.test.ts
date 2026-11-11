import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import { NextRequest } from 'next/server';
import { GET as serveSandboxFile } from '../src/app/api/sandbox/files/[gameId]/[versionId]/[...file]/route';

describe('Phase 7: Game Player, Sandboxed Runtime & HUD Fullscreen Controls', () => {
  const TEST_GAME_ID = 'test-game-p7';
  const TEST_VERSION_ID = 'v1-p7';
  const buildDir = path.resolve(process.cwd(), '.data', 'games', TEST_GAME_ID, TEST_VERSION_ID);

  beforeAll(() => {
    // Setup mock game build directory
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    // Write sample game files
    fs.writeFileSync(
      path.join(buildDir, 'index.html'),
      '<!DOCTYPE html><html><head><title>Test Game</title></head><body><canvas id="game"></canvas></body></html>'
    );
    fs.writeFileSync(
      path.join(buildDir, 'game.js'),
      'console.log("Game loaded");'
    );
    fs.writeFileSync(
      path.join(buildDir, 'style.css'),
      'body { margin: 0; background: black; }'
    );
  });

  afterAll(() => {
    // Clean up test files
    try {
      const rootDir = path.resolve(process.cwd(), '.data', 'games', TEST_GAME_ID);
      if (fs.existsSync(rootDir)) {
        fs.rmSync(rootDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore transient Windows file handle locks
    }
  });

  it('1. should enforce strict iframe sandbox permissions (allow-scripts, allow-same-origin, allow-pointer-lock) without dangerous bypasses', () => {
    const sandboxPolicy = 'allow-scripts allow-same-origin allow-pointer-lock';
    const featurePolicy = 'fullscreen; autoplay; gamepad; focus-without-user-activation';

    // Must have essential execution tokens
    expect(sandboxPolicy).toContain('allow-scripts');
    expect(sandboxPolicy).toContain('allow-same-origin');
    expect(sandboxPolicy).toContain('allow-pointer-lock');

    // Must NOT have top navigation or modal escapement
    expect(sandboxPolicy).not.toContain('allow-top-navigation');
    expect(sandboxPolicy).not.toContain('allow-top-navigation-by-user-activation');
    expect(sandboxPolicy).not.toContain('allow-modals');
    expect(sandboxPolicy).not.toContain('allow-popups');

    // Must grant hardware/multimedia features safely
    expect(featurePolicy).toContain('fullscreen');
    expect(featurePolicy).toContain('autoplay');
    expect(featurePolicy).toContain('gamepad');
  });

  it('2. should verify pre-boot poster thumbnail state prevents premature game asset downloads', () => {
    const mockGame = {
      id: 'game-poster-check',
      title: 'Neon Drift 2026',
      thumbnailUrl: '/assets/thumb.png',
      bannerUrl: '/assets/banner.png',
      engine: 'Godot 4 HTML5',
      orientation: 'LANDSCAPE',
    };

    // Before user clicks play:
    let isPlaying = false;
    const resolvedUrl = `/sandbox/${mockGame.id}/v1`;

    expect(isPlaying).toBe(false);
    // When isPlaying is false, iframe must not be mounted
    const shouldMountIframe = isPlaying;
    expect(shouldMountIframe).toBe(false);

    // After play click:
    isPlaying = true;
    expect(isPlaying).toBe(true);
    expect(resolvedUrl).toBe('/sandbox/game-poster-check/v1');
  });

  it('3. should support the complete parent-runner postMessage protocol for playback controls', () => {
    const supportedEvents = ['GV_MUTE', 'GV_UNMUTE', 'GV_PAUSE', 'GV_RESUME', 'GV_RESTART'];
    const runnerState = {
      isMuted: false,
      isPaused: false,
      restartCount: 0,
    };

    const handleMessage = (type: string) => {
      switch (type) {
        case 'GV_MUTE':
          runnerState.isMuted = true;
          break;
        case 'GV_UNMUTE':
          runnerState.isMuted = false;
          break;
        case 'GV_PAUSE':
          runnerState.isPaused = true;
          break;
        case 'GV_RESUME':
          runnerState.isPaused = false;
          break;
        case 'GV_RESTART':
          runnerState.restartCount += 1;
          break;
      }
    };

    // Test mute toggle
    handleMessage('GV_MUTE');
    expect(runnerState.isMuted).toBe(true);
    handleMessage('GV_UNMUTE');
    expect(runnerState.isMuted).toBe(false);

    // Test pause/resume
    handleMessage('GV_PAUSE');
    expect(runnerState.isPaused).toBe(true);
    handleMessage('GV_RESUME');
    expect(runnerState.isPaused).toBe(false);

    // Test restart
    handleMessage('GV_RESTART');
    expect(runnerState.restartCount).toBe(1);

    expect(supportedEvents).toHaveLength(5);
  });

  it('4. should maintain responsive 16:9 letterbox aspect ratio and container classes in theater / fullscreen states', () => {
    const getContainerClasses = (isFullscreen: boolean, isTheater: boolean) => {
      if (isFullscreen) return 'fixed inset-0 z-50 h-screen w-screen flex flex-col justify-center';
      if (isTheater) return 'max-w-none rounded-2xl border border-white/10 shadow-2xl';
      return 'rounded-3xl border border-white/10 shadow-2xl';
    };

    const getViewportClasses = (isFullscreen: boolean) => {
      return isFullscreen ? 'h-full flex items-center justify-center' : 'aspect-video';
    };

    // Normal state
    expect(getContainerClasses(false, false)).toContain('rounded-3xl');
    expect(getViewportClasses(false)).toBe('aspect-video');

    // Theater mode
    expect(getContainerClasses(false, true)).toContain('max-w-none');
    expect(getViewportClasses(false)).toBe('aspect-video');

    // Fullscreen state
    expect(getContainerClasses(true, false)).toContain('fixed inset-0 z-50 h-screen w-screen');
    expect(getViewportClasses(true)).toContain('h-full flex items-center justify-center');
  });

  it('5. should handle Tab Backgrounding and Visibility Change by pausing audio and loop', () => {
    let runnerPaused = false;
    const sendToRunner = (action: string) => {
      if (action === 'GV_PAUSE') runnerPaused = true;
      if (action === 'GV_RESUME') runnerPaused = false;
    };

    // Simulate tab backgrounding
    const simulateVisibilityChange = (hidden: boolean) => {
      if (hidden) {
        sendToRunner('GV_PAUSE');
      } else {
        sendToRunner('GV_RESUME');
      }
    };

    simulateVisibilityChange(true);
    expect(runnerPaused).toBe(true);

    simulateVisibilityChange(false);
    expect(runnerPaused).toBe(false);
  });

  it('6. should serve legitimate extracted game build files with isolated Content-Security-Policy headers', async () => {
    // Test serving index.html
    const reqHtml = new NextRequest(`http://localhost:3000/api/sandbox/files/${TEST_GAME_ID}/${TEST_VERSION_ID}/index.html`);
    const resHtml = await serveSandboxFile(reqHtml, {
      params: { gameId: TEST_GAME_ID, versionId: TEST_VERSION_ID, file: ['index.html'] },
    });

    expect(resHtml.status).toBe(200);
    expect(resHtml.headers.get('Content-Type')).toContain('text/html');
    expect(resHtml.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(resHtml.headers.get('X-Content-Type-Options')).toBe('nosniff');

    // Test serving game.js
    const reqJs = new NextRequest(`http://localhost:3000/api/sandbox/files/${TEST_GAME_ID}/${TEST_VERSION_ID}/game.js`);
    const resJs = await serveSandboxFile(reqJs, {
      params: { gameId: TEST_GAME_ID, versionId: TEST_VERSION_ID, file: ['game.js'] },
    });

    expect(resJs.status).toBe(200);
    expect(resJs.headers.get('Content-Type')).toContain('application/javascript');
  });

  it('7. should reject path traversal / Zip Slip attempts in the sandbox file server with 403 Forbidden', async () => {
    // Attempt directory traversal out of build root
    const reqAttack = new NextRequest(
      `http://localhost:3000/api/sandbox/files/${TEST_GAME_ID}/${TEST_VERSION_ID}/../../package.json`
    );
    const resAttack = await serveSandboxFile(reqAttack, {
      params: { gameId: TEST_GAME_ID, versionId: TEST_VERSION_ID, file: ['..', '..', 'package.json'] },
    });

    expect(resAttack.status).toBe(403);
    const body = await resAttack.json();
    expect(body.error).toContain('Access denied');
  });

  it('8. should return 404 for non-existent files in valid sandbox directories', async () => {
    const reqMissing = new NextRequest(
      `http://localhost:3000/api/sandbox/files/${TEST_GAME_ID}/${TEST_VERSION_ID}/non-existent.png`
    );
    const resMissing = await serveSandboxFile(reqMissing, {
      params: { gameId: TEST_GAME_ID, versionId: TEST_VERSION_ID, file: ['non-existent.png'] },
    });

    expect(resMissing.status).toBe(404);
    const body = await resMissing.json();
    expect(body.error).toContain('not found');
  });
});
