'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Gamepad2,
  SlidersHorizontal,
  Flame,
  Star,
  Clock,
  Sparkles,
  Swords,
  Puzzle,
  Crown,
  Shield,
  Trophy,
} from 'lucide-react';
import GameCard from '@/components/GameCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

// Pre-defined category definitions matching database
const CATEGORIES_METADATA: Record<
  string,
  { name: string; description: string; icon: any; gradient: string }
> = {
  arcade: {
    name: 'Arcade',
    description: 'Classic 2D retro, platformers, and high-speed endless runners.',
    icon: Gamepad2,
    gradient: 'from-indigo-600/30 via-indigo-900/20 to-transparent',
  },
  action: {
    name: 'Action',
    description: 'Fast-paced reflexes, combat, aerial duels, and shooters.',
    icon: Swords,
    gradient: 'from-rose-600/30 via-rose-900/20 to-transparent',
  },
  puzzle: {
    name: 'Puzzle',
    description: 'Brain teasers, physics puzzles, logic mazes, and match-3 games.',
    icon: Puzzle,
    gradient: 'from-amber-600/30 via-amber-900/20 to-transparent',
  },
  strategy: {
    name: 'Strategy',
    description: 'Tactical tower defense, resource planning, and conquest simulations.',
    icon: Crown,
    gradient: 'from-emerald-600/30 via-emerald-900/20 to-transparent',
  },
  rpg: {
    name: 'RPG',
    description: 'Character progression, isometric dungeon crawlers, and adventures.',
    icon: Shield,
    gradient: 'from-purple-600/30 via-purple-900/20 to-transparent',
  },
  sports: {
    name: 'Sports',
    description: 'High-octane racing, soccer, basketball, and trick physics.',
    icon: Trophy,
    gradient: 'from-cyan-600/30 via-cyan-900/20 to-transparent',
  },
  casual: {
    name: 'Casual',
    description: 'Relaxing instant clickers, hypercasual games, and zen simulations.',
    icon: Sparkles,
    gradient: 'from-pink-600/30 via-pink-900/20 to-transparent',
  },
};

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const meta = CATEGORIES_METADATA[params.slug.toLowerCase()] || {
    name: params.slug.toUpperCase(),
    description: 'Explore instant playable browser games.',
    icon: Gamepad2,
    gradient: 'from-indigo-600/30 via-slate-900/20 to-transparent',
  };

  const Icon = meta.icon;

  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'top_rated' | 'newest'>('popular');
  const [orientationFilter, setOrientationFilter] = useState<'ALL' | 'LANDSCAPE' | 'PORTRAIT'>('ALL');

  React.useEffect(() => {
    async function loadGames() {
      try {
        setLoading(true);
        const res = await fetch(`/api/games?category=${params.slug}&sort=${sortBy}&limit=60`);
        if (res.ok) {
          const data = await res.json();
          setGames(data.games || []);
        }
      } catch (err) {
        console.error('Failed to load category games:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGames();
  }, [params.slug, sortBy]);

  const filteredGames = useMemo(() => {
    if (orientationFilter === 'ALL') return games;
    return games.filter((g) => g.orientation === orientationFilter || g.orientation === 'ANY');
  }, [games, orientationFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Catalog Home</span>
        </Link>
        <span>/</span>
        <span className="text-gray-200">{meta.name}</span>
      </div>

      {/* Hero Category Banner */}
      <div className={`relative rounded-3xl p-6 sm:p-8 border border-white/10 overflow-hidden bg-gradient-to-r ${meta.gradient}`}>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg">
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="cyan">CATEGORY</Badge>
                <span className="text-xs text-gray-300 font-mono">
                  {filteredGames.length} Instant Playable Games
                </span>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-white mt-1">
                {meta.name} Games
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-xl">
                {meta.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sorting Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sort:</span>
          </span>
          {[
            { id: 'popular', label: 'Most Popular', icon: Flame },
            { id: 'top_rated', label: 'Highest Rated', icon: Star },
            { id: 'newest', label: 'Newest Releases', icon: Clock },
          ].map((item) => {
            const ItemIcon = item.icon;
            const isSelected = sortBy === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSortBy(item.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <ItemIcon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Orientation Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 mr-1">Orientation:</span>
          {(['ALL', 'LANDSCAPE', 'PORTRAIT'] as const).map((orient) => (
            <button
              key={orient}
              onClick={() => setOrientationFilter(orient)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                orientationFilter === orient
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {orient}
            </button>
          ))}
        </div>
      </div>

      {/* Game Grid */}
      {filteredGames.length === 0 ? (
        <div className="p-16">
          <EmptyState
            icon={Gamepad2}
            title="No Games Found in this Category"
            description="No published games currently match the selected orientation or category filters."
            actionLabel="Reset Filters"
            onAction={() => {
              setSortBy('popular');
              setOrientationFilter('ALL');
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
