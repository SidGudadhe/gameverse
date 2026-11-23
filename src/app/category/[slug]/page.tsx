'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import CategoryNavChips from '@/components/CategoryNavChips';
import WebAdBanner from '@/components/ads/WebAdBanner';
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
    gradient: 'from-indigo-50 via-slate-50 to-indigo-100/60',
  },
  action: {
    name: 'Action',
    description: 'Fast-paced reflexes, combat, aerial duels, and shooters.',
    icon: Swords,
    gradient: 'from-rose-50 via-slate-50 to-rose-100/60',
  },
  puzzle: {
    name: 'Puzzle',
    description: 'Brain teasers, physics puzzles, logic mazes, and match-3 games.',
    icon: Puzzle,
    gradient: 'from-amber-50 via-slate-50 to-amber-100/60',
  },
  strategy: {
    name: 'Strategy',
    description: 'Tactical tower defense, resource planning, and conquest simulations.',
    icon: Crown,
    gradient: 'from-emerald-50 via-slate-50 to-emerald-100/60',
  },
  rpg: {
    name: 'RPG',
    description: 'Character progression, isometric dungeon crawlers, and adventures.',
    icon: Shield,
    gradient: 'from-purple-50 via-slate-50 to-purple-100/60',
  },
  sports: {
    name: 'Sports',
    description: 'High-octane racing, soccer, basketball, and trick physics.',
    icon: Trophy,
    gradient: 'from-cyan-50 via-slate-50 to-cyan-100/60',
  },
  casual: {
    name: 'Casual',
    description: 'Relaxing instant clickers, hypercasual games, and zen simulations.',
    icon: Sparkles,
    gradient: 'from-pink-50 via-slate-50 to-pink-100/60',
  },
};

function CategorySlugContent({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const mainParam = searchParams.get('mainCategory');
  const lockedMainCategory: 'VEG' | 'NON_VEG' =
    mainParam === 'NON_VEG' ? 'NON_VEG' : 'VEG';

  const meta = CATEGORIES_METADATA[params.slug.toLowerCase()] || {
    name: params.slug.toUpperCase(),
    description: 'Explore instant playable browser games.',
    icon: Gamepad2,
    gradient: 'from-indigo-50 via-slate-50 to-slate-100',
  };

  const Icon = meta.icon;

  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'top_rated' | 'newest'>('popular');

  useEffect(() => {
    async function loadGames() {
      try {
        setLoading(true);
        const res = await fetch(`/api/games?category=${params.slug}&sort=${sortBy}&limit=60&mainCategory=${lockedMainCategory}`);
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
  }, [params.slug, sortBy, lockedMainCategory]);

  // Strict isolation: only games belonging to the locked category are returned
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const gMain = g.mainCategory || 'VEG';
      return gMain === lockedMainCategory;
    });
  }, [games, lockedMainCategory]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-2 pb-6 space-y-2.5">
      {/* Hero Category Banner (Compact Bar) */}
      <div className={`relative rounded-xl px-3.5 py-2 border border-slate-200 overflow-hidden bg-gradient-to-r ${meta.gradient} shadow-2xs`}>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shadow-2xs shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-base sm:text-lg text-slate-900 truncate">
                  {meta.name} Games
                </h1>
                <Badge variant="cyan" size="sm">SUB-CATEGORY</Badge>
              </div>
              <p className="text-slate-500 text-xs truncate max-w-lg hidden sm:block">
                {meta.description}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-600 font-mono font-medium shrink-0">
            {filteredGames.length} {lockedMainCategory === 'NON_VEG' ? 'Non-Veg' : 'Veg'} Titles Available
          </span>
        </div>
      </div>

      {/* Locked Category Indicator & Back to Change Category Button */}
      <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs ${
        lockedMainCategory === 'NON_VEG'
          ? 'bg-rose-50/60 border-rose-200'
          : 'bg-emerald-50/80 border-emerald-300'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl shrink-0">
            {lockedMainCategory === 'NON_VEG' ? '🔴' : '🟢'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Active Category (Locked):
              </span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                lockedMainCategory === 'NON_VEG'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-emerald-600 text-white shadow-xs'
              }`}>
                {lockedMainCategory === 'NON_VEG' ? '2 = Non-Veg Category (16+)' : '1 = Veg Category (All Ages)'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono">
                🔒 LOCKED
              </span>
            </div>
            <p className="text-xs text-slate-800 mt-1">
              {lockedMainCategory === 'NON_VEG'
                ? `Viewing Non-Veg ${meta.name} games. May contain uncensored expressions or mature developer language (play at your own discretion). To switch category, click Back.`
                : `Viewing Pure Veg ${meta.name} games. 100% family-friendly with zero abusive language or profanity. To switch category, click Back.`}
            </p>
          </div>
        </div>

        {/* User cannot change category here; must click Back to return to /category */}
        <Link
          href={`/category?mainCategory=${lockedMainCategory}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Change Category</span>
        </Link>
      </div>

      {/* Category Navigation Quick Chips (Browse Sub-Categories within the same locked category) */}
      <CategoryNavChips activeSlug={params.slug} mainCategory={lockedMainCategory} />

      {/* Banner Ad directly below Category selection */}
      <div className="w-full">
        <WebAdBanner placement="CATEGORY_BANNER" />
      </div>

      {/* Filter and Sorting Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <ItemIcon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing {filteredGames.length} titles in {lockedMainCategory === 'NON_VEG' ? 'Non-Veg' : 'Veg'} {meta.name}
        </div>
      </div>

      {/* Game Grid */}
      {filteredGames.length === 0 ? (
        <div className="p-16">
          <EmptyState
            icon={Gamepad2}
            title={`No ${lockedMainCategory === 'NON_VEG' ? 'Non-Veg' : 'Veg'} Games in ${meta.name}`}
            description={`Developers have not submitted any ${lockedMainCategory === 'NON_VEG' ? 'Non-Veg' : 'Veg'} games under ${meta.name} yet.`}
            actionLabel="← Back to Change Category"
            onAction={() => {
              window.location.href = `/category?mainCategory=${lockedMainCategory}`;
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGames.slice(0, 2).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}

          {/* CATEGORY PAGE NATIVE AD */}
          <WebAdBanner placement="CATEGORY_NATIVE" />

          {filteredGames.slice(2).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-center text-xs text-slate-400">Loading category...</div>}>
      <CategorySlugContent params={params} />
    </Suspense>
  );
}
