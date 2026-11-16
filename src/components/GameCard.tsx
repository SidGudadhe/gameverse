import React from 'react';
import Link from 'next/link';
import { Play, Star, Users } from 'lucide-react';
import { Game } from '@/types';

interface GameCardProps {
  game: Game;
  aspect?: '16/9' | '4/3';
}

export default function GameCard({ game, aspect = '16/9' }: GameCardProps) {
  return (
    <Link
      href={`/game/${game.slug}`}
      className="group relative flex flex-col bg-white hover:bg-slate-50/80 rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-200 shadow-xs"
    >
      {/* 16:9 Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={game.thumbnailUrl}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/10" />

        {/* Clean Category / Featured Pill */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {game.isFeatured ? (
            <span className="bg-indigo-600 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm">
              Featured
            </span>
          ) : (
            <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
              {game.categoryName}
            </span>
          )}
        </div>

        {/* Hover Play Button Overlay - Poki / CrazyGames Style */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-900/30 backdrop-blur-[1px] transition-all duration-200">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>
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
