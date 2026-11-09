'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Flame, Star, Sparkles } from 'lucide-react';
import { Game } from '@/types';

interface HeroCarouselProps {
  featuredGames: Game[];
}

export default function HeroCarousel({ featuredGames }: HeroCarouselProps) {
  const featured = featuredGames[0] || null;
  if (!featured) return null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-surface group">
      {/* Banner Background */}
      <div className="relative h-[340px] sm:h-[400px] md:h-[460px] w-full overflow-hidden">
        <img
          src={featured.bannerUrl}
          alt={featured.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-[#090D16]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090D16] via-[#090D16]/40 to-transparent" />

        {/* Content Overlay */}
        <div className="absolute inset-0 p-6 sm:p-10 md:p-12 flex flex-col justify-end max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 bg-indigo-600/90 backdrop-blur-md text-white font-bold text-xs uppercase px-3 py-1 rounded-full border border-indigo-400/30 shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-3.5 h-3.5" />
              Game of the Week
            </span>
            <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md text-amber-300 font-semibold text-xs px-2.5 py-1 rounded-full border border-amber-400/30">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {featured.rating.toFixed(1)} / 5.0
            </span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight drop-shadow-md">
            {featured.title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-gray-300 line-clamp-2 leading-relaxed drop-shadow">
            {featured.shortDescription}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <Link
              href={`/game/${featured.slug}`}
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Instant Play Free</span>
            </Link>

            <div className="hidden sm:flex flex-col text-xs text-gray-400">
              <span className="text-gray-200 font-semibold">{featured.developerName}</span>
              <span>{featured.engine}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
