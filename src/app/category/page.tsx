'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

function AllCategoriesContent() {
  const searchParams = useSearchParams();
  const initialMainParam = searchParams.get('mainCategory') || searchParams.get('type');
  const initialMainCategory: 'ALL' | 'VEG' | 'NON_VEG' =
    initialMainParam?.toUpperCase() === 'VEG'
      ? 'VEG'
      : initialMainParam?.toUpperCase() === 'NON_VEG' || initialMainParam?.toLowerCase() === 'non-veg'
      ? 'NON_VEG'
      : 'ALL';

  const [categories, setCategories] = useState<any[]>([]);
  const [allGames, setAllGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'top_rated' | 'newest'>('popular');
  const [selectedMainCategory, setSelectedMainCategory] = useState<'ALL' | 'VEG' | 'NON_VEG'>(initialMainCategory);

  useEffect(() => {
    if (initialMainParam) {
      if (initialMainParam.toUpperCase() === 'VEG') {
        setSelectedMainCategory('VEG');
      } else if (
        initialMainParam.toUpperCase() === 'NON_VEG' ||
        initialMainParam.toLowerCase() === 'non-veg'
      ) {
        setSelectedMainCategory('NON_VEG');
      }
    }
  }, [initialMainParam]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const mainParam = selectedMainCategory !== 'ALL' ? `&mainCategory=${selectedMainCategory}` : '';
        const [catRes, gamesRes] = await Promise.all([
          fetch('/api/categories'),
          fetch(`/api/games?sort=${sortBy}&limit=60${mainParam}`),
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
  }, [sortBy, selectedMainCategory]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-2 pb-6 space-y-2.5 animate-fade-in">
      {/* Compact Category Directory Header Bar */}
      <div className="relative rounded-xl px-3.5 py-2 border border-slate-200 overflow-hidden bg-gradient-to-r from-indigo-50/80 via-slate-50 to-blue-50/80 shadow-2xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 truncate">
            <h1 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight shrink-0">
              All Game Categories
            </h1>
            <span className="text-slate-300 hidden md:inline">&bull;</span>
            <p className="text-slate-500 text-xs truncate max-w-xl hidden md:inline">
              Find instant browser games by your favorite genre. Pick any category below to filter games, or explore popular picks.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="cyan" size="sm">GAME CATALOG</Badge>
            <span className="text-[10px] text-indigo-700 font-mono font-medium">
              {categories.length} Genres &bull; {allGames.length} Titles
            </span>
          </div>
        </div>
      </div>

      {/* Category Navigation (Browse by Category) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-heading font-bold text-xs text-slate-800">
            Browse by Category
          </h2>
          <span className="text-[10px] text-indigo-700 font-mono font-medium">
            2 Main Categories &bull; {categories.length} Sub-Categories
          </span>
        </div>

        {/* 2 Main Categories: 1 = Veg Category, 2 = Non-Veg Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedMainCategory('ALL')}
            className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
              selectedMainCategory === 'ALL'
                ? 'bg-indigo-50/90 border-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  🎮
                </span>
                <div>
                  <div className="font-heading font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <span>All Categories</span>
                    {selectedMainCategory === 'ALL' && (
                      <span className="text-[9px] font-mono bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Complete catalog
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                selectedMainCategory === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {categories.reduce((s, c) => s + (c.count || 0), 0)} Titles
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMainCategory(selectedMainCategory === 'VEG' ? 'ALL' : 'VEG')}
            className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
              selectedMainCategory === 'VEG'
                ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-white hover:bg-emerald-50/30 border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  🟢
                </span>
                <div>
                  <div className="font-heading font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <span>1. Veg Category</span>
                    <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">ALL AGES</span>
                    {selectedMainCategory === 'VEG' && (
                      <span className="text-[9px] font-mono bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                        ✓ SELECTED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Family & casual games
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                selectedMainCategory === 'VEG' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {categories.reduce((s, c) => s + (c.vegCount || 0), 0)} Games
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMainCategory(selectedMainCategory === 'NON_VEG' ? 'ALL' : 'NON_VEG')}
            className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
              selectedMainCategory === 'NON_VEG'
                ? 'bg-rose-50/80 border-rose-300 shadow-sm ring-2 ring-rose-300/40'
                : 'bg-white hover:bg-rose-50/30 border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  🔴
                </span>
                <div>
                  <div className="font-heading font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <span>2. Non-Veg Category</span>
                    <span className="text-[9px] font-mono bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">16+</span>
                    {selectedMainCategory === 'NON_VEG' && (
                      <span className="text-[9px] font-mono bg-rose-500 text-white px-1.5 py-0.2 rounded font-bold">
                        ✓ SELECTED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Intense action & combat
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                selectedMainCategory === 'NON_VEG' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {categories.reduce((s, c) => s + (c.nonVegCount || 0), 0)} Games
              </span>
            </div>
          </button>
        </div>

        {/* Selected Main Category Prominent Guidance Banner (In English, Warm & Informative) */}
        {selectedMainCategory === 'VEG' && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-300 flex items-center gap-3 shadow-2xs">
            <span className="text-2xl shrink-0">🟢</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full">
                  SELECTED MENU: 1. VEG CATEGORY
                </span>
                <span className="text-[10px] font-bold text-emerald-700">100% Family Safe & Friendly</span>
              </div>
              <p className="text-xs text-slate-800 font-medium mt-1">
                These games are 100% pure veg and family-friendly. They contain zero abusive language, profanity, or inappropriate words. Enjoy a wholesome gaming experience safe for the whole family!
              </p>
            </div>
          </div>
        )}

        {selectedMainCategory === 'NON_VEG' && (
          <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-center gap-3 shadow-2xs">
            <span className="text-2xl shrink-0">🔴</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                  SELECTED MENU: 2. NON-VEG CATEGORY
                </span>
                <span className="text-[10px] font-bold text-rose-600">16+ / Mature Content</span>
              </div>
              <p className="text-xs text-slate-800 font-medium mt-1">
                These are non-veg games and may contain uncensored expressions, strong language, or mature humor at the developer&apos;s discretion. Please play at your own discretion.
              </p>
            </div>
          </div>
        )}

        {/* Sub-Category Navigation */}
        <CategoryNavChips activeSlug="all" mainCategory={selectedMainCategory} />
      </div>

      {/* Banner Ad directly below Category selection */}
      <div className="w-full">
        <WebAdBanner placement="CATEGORY_BANNER" />
      </div>

      {/* All Playable Games Directory */}
      <section className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div>
            <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900 leading-tight">
              All Available Games
            </h2>
            <p className="text-slate-500 text-[11px]">
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

export default function AllCategoriesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-center text-xs text-slate-400">Loading catalog...</div>}>
      <AllCategoriesContent />
    </Suspense>
  );
}
