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
      className="group relative flex flex-col bg-slate-900/80 hover:bg-slate-800/90 rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/15 hover:-translate-y-1 transition-all duration-200"
    >
      {/* 16:9 Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <img
          src={game.thumbnailUrl}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

        {/* Clean Category / Featured Pill */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {game.isFeatured ? (
            <span className="bg-indigo-600 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm">
              Featured
            </span>
          ) : (
            <span className="bg-black/70 backdrop-blur-sm text-gray-200 text-[10px] font-medium px-2 py-0.5 rounded-md border border-white/10">
              {game.categoryName}
            </span>
          )}
        </div>

        {/* Hover Play Button Overlay - Poki / CrazyGames Style */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-950/40 backdrop-blur-[1px] transition-all duration-200">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3 className="font-heading font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {game.title}
          </h3>
          <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">
            {game.developerName}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-gray-200">{game.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Users className="w-3.5 h-3.5 text-gray-500" />
            <span>{(game.totalPlays / 1000).toFixed(1)}k plays</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
