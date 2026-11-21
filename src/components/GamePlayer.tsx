'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Maximize2,
  Minimize2,
  Play,
  ArrowLeft,
  Share2,
  Flag,
  RotateCcw,
  Volume2,
  VolumeX,
  Tv,
  HelpCircle,
  Sparkles,
  Loader2,
  Tag,
  Award,
  Heart,
  Coins,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Game, AdFormat } from '@/types';
import AdOverlay from './AdOverlay';
import { MockAdCreative } from '../lib/ads';
import { useAuth } from '@/context/AuthContext';

interface GamePlayerProps {
  game: Game;
  sandboxUrl?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export default function GamePlayer({ game, sandboxUrl, onFullscreenChange }: GamePlayerProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showHud, setShowHud] = useState(true);
  const [activeAd, setActiveAd] = useState<{
    ad: MockAdCreative;
    format: AdFormat;
  } | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const [showInGameBanner, setShowInGameBanner] = useState(true);
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hudTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Telemetry session tracking refs
  const sessionTokenRef = useRef<string | null>(null);
  const activeSecondsRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);

  isPlayingRef.current = isPlaying;
  isPausedRef.current = isPaused;

  // Resolved sandbox runner route with optional isolated origin support
  const sandboxOrigin = process.env.NEXT_PUBLIC_SANDBOX_ORIGIN || '';
  const resolvedUrl =
    sandboxUrl || `${sandboxOrigin}/api/sandbox/files/${game.id}/${game.currentVersionId || 'v1'}/index.html`;

  // ================= TELEMETRY PING PIPELINE =================
  const sendTelemetryPing = useCallback(
    async (
      eventType: 'SESSION_START' | 'HEARTBEAT' | 'SESSION_PAUSE' | 'SESSION_RESUME' | 'SESSION_END'
    ) => {
      if (!sessionTokenRef.current) return;

      const deviceType =
        typeof window !== 'undefined'
          ? /tablet|ipad/i.test(navigator.userAgent)
            ? 'TABLET'
            : /mobile|android|iphone/i.test(navigator.userAgent)
            ? 'MOBILE'
            : 'DESKTOP'
          : 'DESKTOP';

      const referralToken =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('ref') || undefined
          : undefined;

      try {
        const payload = {
          gameId: game.id,
          sessionToken: sessionTokenRef.current,
          playerId: user?.id,
          eventType,
          activeSeconds: activeSecondsRef.current,
          deviceType,
          referralToken,
        };

        if (eventType === 'SESSION_END' && typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/ping', JSON.stringify(payload));
        } else {
          await fetch('/api/analytics/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: eventType === 'SESSION_END',
          });
        }
      } catch (err) {
        // Non-blocking telemetry
      }
    },
    [game.id]
  );

  const handleStartPlay = async () => {
    const newToken = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    sessionTokenRef.current = newToken;
    activeSecondsRef.current = 0;
    sendTelemetryPing('SESSION_START');

    setAdLoading(true);
    try {
      const res = await fetch(`/api/ads/slot?gameId=${game.id}&sessionToken=${newToken}&format=PREROLL`);
      if (res.ok) {
        const data = await res.json();
        if (data.eligible && data.ad) {
          setActiveAd({ ad: data.ad, format: 'PREROLL' });
          setAdLoading(false);
          return;
        }
      }
    } catch (e) {
      // Non-blocking fallback directly into gameplay
    }
    setAdLoading(false);
    setIsPlaying(true);
  };

  const handleAdComplete = async (durationSeconds: number, skipped: boolean, rewardClaimed?: string) => {
    const format = activeAd?.format || 'PREROLL';
    const currentSession = sessionTokenRef.current;
    setActiveAd(null);
    setIsPlaying(true);

    if (rewardClaimed) {
      const msg =
        rewardClaimed === 'COINS'
          ? '🪙 Reward Unlocked: +100 Coins credited to player account!'
          : rewardClaimed === 'DOUBLE_REWARD'
          ? '✨ Reward Unlocked: 2x XP Multiplier & Bonus Reward Activated!'
          : '💖 Reward Unlocked: Extra Life / Revive Activated!';
      setRewardToast(msg);
      setTimeout(() => setRewardToast(null), 5000);
    }

    if (currentSession) {
      const referralToken =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('ref') || undefined
          : undefined;

      try {
        await fetch('/api/ads/impression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: game.id,
            sessionToken: currentSession,
            format,
            durationSeconds,
            completed: !skipped || durationSeconds >= 3,
            referralToken,
          }),
        });
      } catch (e) {
        // Non-blocking
      }
    }

    sendToRunner('GV_AD_COMPLETED', { format, durationSeconds, skipped, rewardClaimed });
    if (rewardClaimed) {
      sendToRunner('GV_REWARD_GRANTED', {
        reward: rewardClaimed,
        amount: rewardClaimed === 'COINS' ? 100 : 1,
      });
    }
    sendToRunner('GV_RESUME');
  };

  // Helper for developers / QA / testing to simulate any in-game ad format immediately
  const triggerManualAd = async (format: AdFormat, simActiveSeconds?: number) => {
    let sessionToken = sessionTokenRef.current;
    if (!sessionToken) {
      sessionToken = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      sessionTokenRef.current = sessionToken;
    }
    const secs = simActiveSeconds !== undefined ? simActiveSeconds : activeSecondsRef.current;
    sendToRunner('GV_PAUSE');
    try {
      const res = await fetch(
        `/api/ads/slot?gameId=${game.id}&sessionToken=${sessionToken}&format=${format}&activeSeconds=${secs}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.eligible && data.ad) {
          setActiveAd({ ad: data.ad, format });
          return;
        }
      }
    } catch {}
    sendToRunner('GV_RESUME');
  };

  // ================= POSTMESSAGE COMMUNICATION TO RUNNER =================
  const sendToRunner = useCallback((action: string, payload?: any) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: action, ...payload }, '*');
    }
  }, []);

  // Handle Fullscreen Toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
        onFullscreenChange?.(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
        onFullscreenChange?.(false);
      }
    } catch (err) {
      console.warn('Fullscreen API request prevented or unsupported:', err);
      // Fallback: emulate CSS fullscreen
      setIsFullscreen(!isFullscreen);
      onFullscreenChange?.(!isFullscreen);
    }
  };

  // Handle Mute Toggle
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    sendToRunner(newMuted ? 'GV_MUTE' : 'GV_UNMUTE');
  };

  // Handle Restart
  const handleRestart = () => {
    sendToRunner('GV_RESTART');
  };

  // Auto-hide HUD in fullscreen after 3 seconds of inactivity
  const handleMouseMove = () => {
    setShowHud(true);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);

    if (isFullscreen) {
      hudTimerRef.current = setTimeout(() => {
        setShowHud(false);
      }, 3000);
    }
  };

  // Native Fullscreen Event Listener & Escape Key Sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      onFullscreenChange?.(active);
      if (!active) {
        setShowHud(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [onFullscreenChange]);

  // Window Focus & Tab Visibility Change (Pauses runner when tab backgrounded)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
        sendToRunner('GV_PAUSE');
        if (isPlayingRef.current) {
          sendTelemetryPing('SESSION_PAUSE');
        }
      } else {
        setIsPaused(false);
        sendToRunner('GV_RESUME');
        if (isPlayingRef.current) {
          sendTelemetryPing('SESSION_RESUME');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendToRunner, sendTelemetryPing]);

  // Periodic Telemetry Heartbeat (15s) and Active Playtime Accumulator
  useEffect(() => {
    if (!isPlaying) return;

    // 1-second active ticker (only counts if game is not paused and tab is visible)
    const tickInterval = setInterval(() => {
      if (!isPausedRef.current && !document.hidden) {
        activeSecondsRef.current += 1;
      }
    }, 1000);

    // 15-second heartbeat ping to backend telemetry ingestion
    const heartbeatInterval = setInterval(() => {
      if (!document.hidden) {
        sendTelemetryPing('HEARTBEAT');
      }
    }, 15000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(heartbeatInterval);
      sendTelemetryPing('SESSION_END');
    };
  }, [isPlaying, sendTelemetryPing]);

  // Keyboard Shortcuts (F for fullscreen, M for mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if ((e.key === 'f' || e.key === 'F') && isPlaying) {
        e.preventDefault();
        toggleFullscreen();
      } else if ((e.key === 'm' || e.key === 'M') && isPlaying) {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isFullscreen, isMuted]);

  // In-Game Ad Requests via postMessage from sandbox runner
  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'GV_REQUEST_AD') {
        const format = (e.data.format as AdFormat) || 'INTERSTITIAL';
        const sessionToken = sessionTokenRef.current;
        if (!sessionToken) return;

        sendToRunner('GV_PAUSE');
        try {
          const res = await fetch(
            `/api/ads/slot?gameId=${game.id}&sessionToken=${sessionToken}&format=${format}&activeSeconds=${activeSecondsRef.current}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.eligible && data.ad) {
              setActiveAd({ ad: data.ad, format });
              return;
            }
          }
        } catch (err) {}
        // Fallback: resume game if ad not available
        sendToRunner('GV_AD_UNAVAILABLE', { format });
        sendToRunner('GV_RESUME');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [game.id, sendToRunner]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full overflow-hidden bg-black transition-all select-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen flex flex-col justify-center'
          : isTheater
          ? 'max-w-none rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50'
          : 'rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50'
      }`}
    >
      {/* ================= PARENT-LEVEL FLOATING HUD OVERLAY ================= */}
      {isPlaying && (
        <div
          className={`absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
            showHud ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Left HUD Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {isFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 bg-black/80 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/20 shadow-lg backdrop-blur-md transition-all active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </button>
            )}

            <span className="hidden sm:inline-flex items-center gap-1.5 bg-black/70 backdrop-blur-md text-gray-200 text-xs px-3 py-1.5 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{game.title}</span>
            </span>

            {isPaused && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md">
                PAUSED
              </span>
            )}
          </div>

          {/* Right HUD Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Audio Mute / Unmute */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
              className={`w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center border transition-all active:scale-95 ${
                isMuted
                  ? 'bg-rose-500/30 text-rose-300 border-rose-500/40'
                  : 'bg-black/80 hover:bg-white/10 text-white border-white/20'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Restart Game */}
            <button
              onClick={handleRestart}
              title="Restart Game"
              className="w-9 h-9 rounded-xl bg-black/80 hover:bg-white/10 text-white flex items-center justify-center border border-white/20 backdrop-blur-md shadow-lg transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Theater Mode (Only in non-fullscreen) */}
            {!isFullscreen && (
              <button
                onClick={() => setIsTheater(!isTheater)}
                title={isTheater ? 'Exit Theater Mode' : 'Theater Mode'}
                className={`w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center border transition-all active:scale-95 ${
                  isTheater
                    ? 'bg-indigo-600/40 text-indigo-300 border-indigo-500/50'
                    : 'bg-black/80 hover:bg-white/10 text-white border-white/20'
                }`}
              >
                <Tv className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen (Esc / F)' : 'Fullscreen (F)'}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center border border-indigo-400/40 shadow-lg shadow-indigo-600/40 backdrop-blur-md transition-all active:scale-95"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* ================= 16:9 VIEWPORT CONTAINER ================= */}
      <div
        className={`relative w-full ${
          isFullscreen ? 'h-full flex items-center justify-center' : 'aspect-video'
        }`}
      >
        {/* Ad Overlay when active */}
        {activeAd && (
          <AdOverlay
            ad={activeAd.ad}
            format={activeAd.format}
            onAdComplete={handleAdComplete}
          />
        )}

        {!isPlaying ? (
          /* ================= PRE-BOOT POSTER STATE ================= */
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden bg-[#090D16]">
            {/* Blurred Backdrop Artwork */}
            <img
              src={game.bannerUrl || game.thumbnailUrl}
              alt={game.title}
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-105 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Center Play Button & Metadata */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-md space-y-4">
              <button
                onClick={handleStartPlay}
                disabled={adLoading}
                className="group relative w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-1 flex items-center justify-center shadow-2xl shadow-indigo-600/60 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-75"
              >
                <div className="w-full h-full rounded-full bg-[#090D16] flex items-center justify-center group-hover:bg-transparent transition-colors">
                  {adLoading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Play className="w-8 h-8 fill-white text-white ml-1 group-hover:scale-110 transition-transform" />
                  )}
                </div>
              </button>

              <div>
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                  {game.title}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-300">
                  Click to play instantly &bull; No downloads or install required
                </p>
              </div>

              {/* Player Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                  Instant Play
                </span>
                <span className="bg-black/60 border border-white/10 text-gray-300 text-[11px] px-2.5 py-1 rounded-lg">
                  Free Online
                </span>
                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                  ★ {game.rating.toFixed(1)} Rating
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ================= HARDENED MULTI-ORIGIN SANDBOX IFRAME ================= */
          <div className="relative w-full h-full">
            <iframe
              ref={iframeRef}
              src={resolvedUrl}
              title={game.title}
              className="w-full h-full border-0 bg-black"
              sandbox="allow-scripts allow-same-origin allow-pointer-lock"
              allow="fullscreen; autoplay; gamepad; focus-without-user-activation"
              loading="lazy"
            />

            {/* Placement C: In-game Banner Ad (Main Menu / Lobby / Shop / Level Selection - 728x90) */}
            {showInGameBanner && isPlaying && !activeAd && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-25 w-[94%] max-w-2xl bg-slate-950/95 border-2 border-dashed border-amber-400 rounded-xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-white animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2.5 truncate">
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                    [ IN-GAME BANNER AD ]
                  </span>
                  <div className="truncate text-left">
                    <span className="text-xs font-bold text-white block truncate">
                      HyperDrive Ultra X10 Wireless Gaming Headset — Zero Latency
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono block truncate">
                      Placement: Main menu, lobby, shop aur level selection screen par banner (728x90)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="https://example.com/hyperdrive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] rounded-lg transition-all"
                  >
                    View Gear
                  </a>
                  <button
                    onClick={() => setShowInGameBanner(false)}
                    title="Close In-Game Banner"
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rewarded Ad Claimed Notification Toast */}
        {rewardToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border-2 border-white animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
            <span>{rewardToast}</span>
          </div>
        )}
      </div>

      {/* ================= IN-GAME ADS INTERACTIVE TEST BAR ================= */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-3 text-xs text-slate-300 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm font-mono">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px] uppercase tracking-wide">
          <Tag className="w-4 h-4 text-amber-400 shrink-0" />
          <span>In-Game Ad Testing Triggers (100x Deep Placements):</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={() => triggerManualAd('PREROLL')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            1. Pre-roll Ad (4-Step)
          </button>
          <button
            onClick={() => triggerManualAd('INTERSTITIAL', 60)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            2. Midgame Skippable (10s)
          </button>
          <button
            onClick={() => triggerManualAd('INTERSTITIAL', 200)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            3. Midgame Unskippable (3+ Min)
          </button>
          <button
            onClick={() => triggerManualAd('REWARDED')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            4. Rewarded Ad (Life/Coins)
          </button>
          <button
            onClick={() => triggerManualAd('BONUS_REWARD')}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            5. Bonus Reward Ad (2x)
          </button>
          <button
            onClick={() => setShowInGameBanner(!showInGameBanner)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            {showInGameBanner ? 'Hide In-Game Banner' : 'Show In-Game Banner'}
          </button>
        </div>
      </div>
    </div>
  );
}
