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
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 group">
      {/* Banner Backdrop */}
      <div className="relative h-[360px] sm:h-[420px] md:h-[460px] w-full overflow-hidden">
        <img
          src={current.bannerUrl || current.thumbnailUrl}
          alt={current.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-[#090D16]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090D16] via-[#090D16]/50 to-transparent" />

        {/* Content Overlay */}
        <div className="absolute inset-0 p-6 sm:p-10 md:p-12 flex flex-col justify-end max-w-2xl z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-indigo-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-full shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              Featured Spotlight
            </span>
            <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-gray-200 text-xs px-2.5 py-1 rounded-full border border-white/10">
              {current.categoryName}
            </span>
            <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-amber-300 font-semibold text-xs px-2.5 py-1 rounded-full border border-white/10">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {current.rating.toFixed(1)}
            </span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight drop-shadow-md">
            {current.title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-gray-300 line-clamp-2 leading-relaxed max-w-xl">
            {current.shortDescription}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <Link
              href={`/game/${current.slug}`}
              className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Play Now Free</span>
            </Link>

            <div className="hidden sm:flex flex-col text-xs text-gray-400">
              <span className="text-gray-200 font-medium">{current.developerName}</span>
              <span>{(current.totalPlays / 1000).toFixed(1)}k players joined</span>
            </div>
          </div>
        </div>

        {/* Desktop Side Thumbnails Switcher (Steam / CrazyGames Style) */}
        {games.length > 1 && (
          <div className="hidden lg:flex flex-col gap-2.5 absolute right-6 bottom-6 top-6 justify-center z-10 w-64">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
              Top Featured Games
            </div>
            {games.map((g, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={g.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex items-center gap-3 p-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border border-indigo-500 shadow-md backdrop-blur-md'
                      : 'bg-black/40 hover:bg-black/60 border border-white/5 opacity-70 hover:opacity-100 backdrop-blur-sm'
                  }`}
                >
                  <img
                    src={g.thumbnailUrl}
                    alt={g.title}
                    className="w-14 h-10 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{g.title}</div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <span>{g.categoryName}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-medium">★ {g.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile Navigation Arrows */}
        {games.length > 1 && (
          <div className="flex lg:hidden items-center gap-2 absolute right-4 bottom-4 z-10">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + games.length) % games.length)}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10"
              aria-label="Previous game"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % games.length)}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10"
              aria-label="Next game"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
