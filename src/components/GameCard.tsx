'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, Star, Users } from 'lucide-react';
import { Game } from '@/types';

interface GameCardProps {
  game: Game;
  aspect?: '16/9' | '4/3';
}

export default function GameCard({ game, aspect = '16/9' }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const videoSrc = game.gameplayVideoUrl || game.previewVideoUrl;

  const handleMouseEnter = () => {
    setIsHovered(true);

    if (videoSrc && !videoError) {
      // 180ms hover debounce: optimal delay to avoid thrashing on fast mouse traversal
      hoverTimerRef.current = setTimeout(() => {
        setIsVideoPlaying(true);
      }, 180);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsVideoPlaying(false);
  };

  // Synchronize HTML5 video play/pause with isVideoPlaying state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVideoPlaying) {
      video.play().catch(() => {
        // Fallback gracefully if browser policy blocks autoplay
        setIsVideoPlaying(false);
      });
    } else {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {}
    }
  }, [isVideoPlaying]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const isNonVeg = game.mainCategory === 'NON_VEG';
  const playerMode = game.playerMode || 'SINGLEPLAYER';

  return (
    <Link
      href={`/game/${game.slug}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={`game-card-${game.slug}`}
      className="group relative flex flex-col bg-white hover:bg-slate-50/80 rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-200 shadow-xs select-none"
    >
      {/* 16:9 Thumbnail Container with Video Hover Player */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        {/* Base Poster Thumbnail Image */}
        <img
          src={game.thumbnailUrl}
          alt={game.title}
          className={`w-full h-full object-cover transition-all duration-300 ease-out ${
            isVideoPlaying ? 'opacity-0 scale-100' : 'opacity-100 group-hover:scale-105'
          }`}
          loading="lazy"
        />

        {/* 30-50s Gameplay Video Preview (GameVerse Catalog Feature) */}
        {videoSrc && !videoError && (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            loop
            playsInline
            preload="metadata"
            data-testid="gamecard-hover-video"
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 z-1 ${
              isVideoPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Subtle Dark Vignette / Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent pointer-events-none z-2" />

        {/* Top Badges Row: Category/Featured + Veg/Non-Veg + Player Mode (Singleplayer / Multiplayer) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap z-10 pointer-events-none">
          {/* Featured / Category Pill */}
          {game.isFeatured ? (
            <span className="bg-indigo-600 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm">
              Featured
            </span>
          ) : (
            <span className="bg-white/95 backdrop-blur-sm text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200/80 shadow-xs">
              {game.categoryName}
            </span>
          )}

          {/* Veg / Non-Veg Badge */}
          {isNonVeg ? (
            <span className="bg-rose-950/85 backdrop-blur-sm text-rose-200 border border-rose-500/50 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>NON-VEG</span>
            </span>
          ) : (
            <span className="bg-emerald-950/85 backdrop-blur-sm text-emerald-200 border border-emerald-500/50 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>VEG</span>
            </span>
          )}

          {/* Player Mode Badge(s) directly alongside Veg/Non-Veg: Singleplayer, Multiplayer, or Both */}
          {playerMode === 'MULTIPLAYER' && (
            <span
              data-testid="player-mode-badge"
              className="bg-purple-950/85 backdrop-blur-sm text-purple-200 border border-purple-500/50 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>MULTIPLAYER</span>
            </span>
          )}

          {playerMode === 'BOTH' && (
            <>
              <span
                data-testid="player-mode-badge-single"
                className="bg-blue-950/85 backdrop-blur-sm text-blue-200 border border-blue-500/50 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>SINGLE</span>
              </span>
              <span
                data-testid="player-mode-badge-multi"
                className="bg-purple-950/85 backdrop-blur-sm text-purple-200 border border-purple-500/50 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>MULTI</span>
              </span>
            </>
          )}

          {playerMode === 'SINGLEPLAYER' && (
            <span
              data-testid="player-mode-badge"
              className="bg-blue-950/85 backdrop-blur-sm text-blue-200 border border-blue-500/50 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>SINGLEPLAYER</span>
            </span>
          )}
        </div>

        {/* Live Gameplay Preview Badge when video is actively playing on hover */}
        {isVideoPlaying && (
          <div
            data-testid="gamecard-preview-badge"
            className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-black/85 backdrop-blur-md text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/20 shadow-md pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>PREVIEW</span>
          </div>
        )}

        {/* Hover Game Controller Overlay (Shows when not playing video or before video kicks in) */}
        {!isVideoPlaying && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-indigo-950/20 backdrop-blur-[1px] transition-all duration-200 pointer-events-none z-3">
            <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-7 h-7" />
            </div>
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3 className="font-heading font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {game.title}
          </h3>
          <p className="text-slate-500 text-xs line-clamp-1 mt-0.5">
            {game.developerName}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="font-semibold text-slate-700">{game.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{(game.totalPlays / 1000).toFixed(1)}k plays</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
