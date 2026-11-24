'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Star, Sparkles } from 'lucide-react';
import { Game } from '@/types';

interface HeroCarouselProps {
  featuredGames: Game[];
}

export default function HeroCarousel({ featuredGames }: HeroCarouselProps) {
  const games = featuredGames.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (games.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % games.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [games.length]);

  if (!games || games.length === 0) return null;

  const current = games[currentIndex] || games[0];
  const isNonVeg = current.mainCategory === 'NON_VEG';

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-md shadow-slate-200/50 bg-slate-950 group">
      {/* Compact Banner Backdrop (Reduced height for immediate below-the-fold game discovery) */}
      <div className="relative h-[180px] sm:h-[200px] md:h-[220px] w-full overflow-hidden">
        <img
          src={current.bannerUrl || current.thumbnailUrl}
          alt={current.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out"
        />
        {/* Gradients for high contrast text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent" />

        {/* Content Overlay */}
        <div className="absolute inset-0 p-4 sm:p-5 md:p-6 flex flex-col justify-center max-w-xl md:max-w-2xl z-10 space-y-1.5 sm:space-y-2">
          {/* Top Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-indigo-600 text-white font-black text-[10px] sm:text-xs uppercase px-2.5 py-0.5 rounded-full shadow-xs">
              <Sparkles className="w-3 h-3" />
              <span>Spotlight</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md text-white font-semibold text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-white/10">
              {current.categoryName}
            </span>
            <span className={`inline-flex items-center gap-1 font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-full border ${
              isNonVeg
                ? 'bg-rose-950/70 text-rose-300 border-rose-700/50'
                : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
            }`}>
              <span>{isNonVeg ? '🔴 16+' : '🟢 Pure Veg'}</span>
            </span>
            <span className="inline-flex items-center gap-0.5 bg-black/60 backdrop-blur-md text-amber-400 font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-white/10">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span>{current.rating.toFixed(1)}</span>
            </span>
          </div>

          {/* Game Title */}
          <h1 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-white tracking-tight drop-shadow-md truncate">
            {current.title}
          </h1>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-slate-200 line-clamp-1 max-w-lg leading-relaxed drop-shadow-xs">
            {current.shortDescription}
          </p>

          {/* Play Button & Meta */}
          <div className="pt-0.5 flex items-center gap-3">
            <Link
              href={`/game/${current.slug}`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play Now Free</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
              <span>
                By <span className="text-white font-semibold">{current.developerName}</span>
              </span>
              <span>•</span>
              <span className="text-slate-300 font-medium">
                {(current.totalPlays / 1000).toFixed(1)}k players joined
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Side Thumbnails Switcher (Compact & Sleek) */}
        {games.length > 1 && (
          <div className="hidden lg:flex flex-col gap-1.5 absolute right-4 top-2.5 bottom-2.5 justify-center z-10 w-56">
            <div className="text-[10px] font-black text-white/90 uppercase tracking-wider px-1 drop-shadow-xs">
              Top Featured
            </div>
            {games.slice(0, 3).map((g, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex items-center gap-2.5 p-1.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-2 border-indigo-600 shadow-md ring-1 ring-indigo-200'
                      : 'bg-black/60 hover:bg-black/80 border border-white/10 backdrop-blur-md'
                  }`}
                >
                  <img
                    src={g.thumbnailUrl}
                    alt={g.title}
                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200/40"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {g.title}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-indigo-600 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      {g.categoryName} &bull; ★ {g.rating.toFixed(1)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile / Tablet Slide Dot Indicators */}
        {games.length > 1 && (
          <div className="flex lg:hidden items-center gap-1.5 absolute right-4 bottom-3 z-10">
            {games.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-5 bg-indigo-500'
                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
