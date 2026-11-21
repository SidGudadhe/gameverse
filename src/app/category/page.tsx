'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  SlidersHorizontal,
  Flame,
  Star,
  Clock,
} from 'lucide-react';
import CategoryNavChips from '@/components/CategoryNavChips';
import GameCard from '@/components/GameCard';
import WebAdBanner from '@/components/ads/WebAdBanner';
import { Badge } from '@/components/ui/Badge';

export default function AllCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [allGames, setAllGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'top_rated' | 'newest'>('popular');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catRes, gamesRes] = await Promise.all([
          fetch('/api/categories'),
          fetch(`/api/games?sort=${sortBy}&limit=60`),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          setAllGames(gamesData.games || []);
        }
      } catch (err) {
        console.error('Failed to load categories catalog:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Categories</span>
      </div>

      {/* Compact Category Directory Header Banner */}
      <div className="relative rounded-2xl p-4 sm:p-5 border border-slate-200 overflow-hidden bg-gradient-to-r from-indigo-50/80 via-slate-50 to-blue-50/80 shadow-xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="cyan" size="sm">GAME CATALOG</Badge>
              <span className="text-[11px] text-indigo-700 font-mono font-medium">
                {categories.length} Genres &bull; {allGames.length} Playable Titles
              </span>
            </div>
            <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
              All Game Categories
            </h1>
            <p className="text-slate-600 text-xs max-w-2xl leading-normal">
              Find instant browser games by your favorite genre. Pick any category below to filter games, or explore popular picks.
            </p>
          </div>
        </div>
      </div>

      {/* Category Navigation (Browse by Category) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900">
              Browse by Category
            </h2>
            <p className="text-xs text-slate-500">
              Select a genre to filter and explore games
            </p>
          </div>
          <span className="text-xs text-indigo-700 font-mono font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
            {categories.length} Categories
          </span>
        </div>
        <CategoryNavChips activeSlug="all" />
      </div>

      {/* Banner Ad directly below Category selection */}
      <div className="w-full">
        <WebAdBanner placement="CATEGORY_BANNER" />
      </div>

      {/* All Playable Games Directory */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h2 className="font-heading font-black text-2xl text-slate-900">
              All Available Games
            </h2>
            <p className="text-slate-500 text-xs">
              Every verified game across all categories on GameVerse
            </p>
          </div>

          {/* Sort Toolbar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            {[
              { id: 'popular', label: 'Most Popular', icon: Flame },
              { id: 'top_rated', label: 'Highest Rated', icon: Star },
              { id: 'newest', label: 'Newest', icon: Clock },
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
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Loading game catalog...
          </div>
        ) : allGames.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No published games found at this moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {allGames.map((game) => (
              <GameCard key={`all-cat-${game.id}`} game={game} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
