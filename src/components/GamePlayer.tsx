'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, Play, ArrowLeft, Share2, Flag, RotateCcw, Volume2 } from 'lucide-react';
import { Game } from '@/types';

interface GamePlayerProps {
  game: Game;
  sandboxUrl?: string;
}

export default function GamePlayer({ game, sandboxUrl }: GamePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Default fallback sandbox game runner if no external build URL
  const resolvedUrl = sandboxUrl || `/sandbox/${game.id}/${game.currentVersionId || 'v1'}`;

  // Handle Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  };

  // Listen for fullscreen change events (e.g. user pressed Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-black transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen flex flex-col justify-center' : 'rounded-3xl border border-white/10 shadow-2xl'
      }`}
    >
      {/* Floating Parent-level HUD Overlay (Outside iframe canvas) */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/10 shadow-lg transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </button>
          )}
          <span className="hidden sm:inline-flex bg-black/60 backdrop-blur-md text-gray-300 text-xs px-2.5 py-1 rounded-lg border border-white/10">
            {game.title}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="w-9 h-9 rounded-xl bg-black/75 hover:bg-indigo-600/90 backdrop-blur-md text-white flex items-center justify-center border border-white/10 shadow-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 16:9 Viewport Player Container */}
      <div className={`relative w-full ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
        {!isPlaying ? (
          /* Pre-Boot Thumbnail State (Zero bandwidth used until play click) */
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden bg-[#090D16]">
            <img
              src={game.bannerUrl || game.thumbnailUrl}
              alt={game.title}
              className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-md">
              <button
                onClick={() => setIsPlaying(true)}
                className="group relative w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 p-1 flex items-center justify-center shadow-2xl shadow-indigo-600/50 hover:scale-110 active:scale-95 transition-all duration-300"
              >
                <div className="w-full h-full rounded-full bg-[#090D16] flex items-center justify-center group-hover:bg-transparent transition-colors">
                  <Play className="w-8 h-8 fill-white text-white ml-1 group-hover:scale-110 transition-transform" />
                </div>
              </button>

              <h2 className="mt-5 font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                {game.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-400">
                Click to load game in instant sandboxed player
              </p>

              <div className="mt-4 flex items-center gap-2">
                <span className="bg-white/10 text-gray-300 text-[11px] px-2.5 py-1 rounded-md">
                  {game.orientation} Viewport
                </span>
                <span className="bg-white/10 text-gray-300 text-[11px] px-2.5 py-1 rounded-md">
                  {game.engine}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Sandboxed Iframe (Strict origin isolation and sandbox policy) */
          <iframe
            ref={iframeRef}
            src={resolvedUrl}
            title={game.title}
            className="w-full h-full border-0 bg-black"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            allow="fullscreen; autoplay; gamepad; focus-without-user-activation"
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}
