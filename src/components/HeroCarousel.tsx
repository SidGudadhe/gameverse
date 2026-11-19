'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Star, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Game } from '@/types';

interface HeroCarouselProps {
  featuredGames: Game[];
}

export default function HeroCarousel({ featuredGames }: HeroCarouselProps) {
  const games = featuredGames.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance every 7 seconds
  useEffect(() => {
    if (games.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [games.length]);

  if (!games || games.length === 0) return null;

  const current = games[currentIndex] || games[0];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 bg-white group">
      {/* Banner Backdrop */}
      <div className="relative h-[360px] sm:h-[420px] md:h-[460px] w-full overflow-hidden">
        <img
          src={current.bannerUrl || current.thumbnailUrl}
          alt={current.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />

        {/* Content Overlay */}
        <div className="absolute inset-0 p-6 sm:p-10 md:p-12 flex flex-col justify-end max-w-2xl z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-indigo-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-full shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              Featured Spotlight
            </span>
            <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-slate-900 font-semibold text-xs px-2.5 py-1 rounded-full border border-slate-200 shadow-xs">
              {current.categoryName}
            </span>
            <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-slate-900 font-bold text-xs px-2.5 py-1 rounded-full border border-slate-200 shadow-xs">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span className="text-amber-700 font-bold">{current.rating.toFixed(1)}</span>
            </span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight drop-shadow-md">
            {current.title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-200 line-clamp-2 leading-relaxed max-w-xl drop-shadow-xs">
            {current.shortDescription}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <Link
              href={`/game/${current.slug}`}
              className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Play Now Free</span>
            </Link>

            <div className="hidden sm:flex flex-col text-xs text-slate-300">
              <span className="text-white font-semibold">{current.developerName}</span>
              <span>{(current.totalPlays / 1000).toFixed(1)}k players joined</span>
            </div>
          </div>
        </div>

        {/* Desktop Side Thumbnails Switcher (Steam / CrazyGames Style) */}
        {games.length > 1 && (
          <div className="hidden lg:flex flex-col gap-2.5 absolute right-6 bottom-6 top-6 justify-center z-10 w-64">
            <div className="text-[11px] font-bold text-white uppercase tracking-wider px-1 drop-shadow-sm">
              Top Featured Games
            </div>
            {games.map((g, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={g.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-2 border-indigo-600 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-100 scale-102'
                      : 'bg-white/90 hover:bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs backdrop-blur-md'
                  }`}
                >
                  <img
                    src={g.thumbnailUrl}
                    alt={g.title}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-100"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {g.title}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium truncate">
                      {g.categoryName}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
