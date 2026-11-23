'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export const CATEGORY_ICONS: Record<string, string> = {
  'cat-action': '⚡',
  'action': '⚡',
  'cat-puzzle': '🧩',
  'puzzle': '🧩',
  'cat-arcade': '🕹️',
  'arcade': '🕹️',
  'cat-racing': '🏎️',
  'racing': '🏎️',
  'cat-casual': '🎯',
  'casual': '🎯',
  'cat-rpg': '⚔️',
  'rpg': '⚔️',
  'cat-strategy': '🧠',
  'strategy': '🧠',
  'cat-sports': '⚽',
  'sports': '⚽',
};

export interface CategoryNavItem {
  id: string;
  name: string;
  slug: string;
  count: number;
  vegCount?: number;
  nonVegCount?: number;
  affinityScore?: number;
}

interface CategoryNavChipsProps {
  activeSlug?: string;
  className?: string;
  initialCategories?: CategoryNavItem[];
  mainCategory?: 'VEG' | 'NON_VEG' | 'ALL';
}

export default function CategoryNavChips({
  activeSlug,
  className = '',
  initialCategories,
  mainCategory,
}: CategoryNavChipsProps) {
  const [categories, setCategories] = useState<CategoryNavItem[]>(initialCategories || []);
  const [totalGames, setTotalGames] = useState(
    initialCategories ? initialCategories.reduce((sum, c) => sum + (c.count || 0), 0) : 0
  );

  useEffect(() => {
    async function loadCategories() {
      try {
        const queryParam = mainCategory && mainCategory !== 'ALL' ? `?mainCategory=${mainCategory}` : '';
        const res = await fetch(`/api/categories${queryParam}`);
        if (res.ok) {
          const data = await res.json();
          // Categories already affinity-sorted by the server for logged-in users
          const cats: CategoryNavItem[] = data.categories || [];
          setCategories(cats);
          const total = cats.reduce((sum, c) => {
            if (mainCategory === 'VEG') return sum + (c.vegCount ?? c.count ?? 0);
            if (mainCategory === 'NON_VEG') return sum + (c.nonVegCount ?? c.count ?? 0);
            return sum + (c.count || 0);
          }, 0);
          setTotalGames(total);
        }
      } catch (err) {
        console.error('Failed to load categories in nav chips:', err);
      }
    }

    loadCategories();
  }, [initialCategories, mainCategory]);

  const normalizedActive = (activeSlug || '').toLowerCase();
  const isAllActive = !normalizedActive || normalizedActive === 'all';

  // The first category returned with a non-zero affinityScore is the user's #1 favourite
  const topAffinityIdx = categories.findIndex((c) => (c.affinityScore || 0) > 0);

  const allGamesHref = mainCategory && mainCategory !== 'ALL'
    ? `/category?mainCategory=${mainCategory}`
    : '/category';

  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none ${className}`}>
      <Link
        href={allGamesHref}
        className={`flex-shrink-0 flex items-center gap-2 font-semibold text-xs px-4 py-2 rounded-xl transition-all ${
          isAllActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200'
        }`}
      >
        <span>🎮</span>
        <span>
          {mainCategory === 'VEG' ? 'All Veg Games' : mainCategory === 'NON_VEG' ? 'All Non-Veg Games' : 'All Games'}
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            isAllActive ? 'bg-white/20 text-white' : 'text-slate-500 bg-slate-200/80'
          }`}
        >
          {totalGames}
        </span>
      </Link>

      {categories.map((cat, idx) => {
        const isCatActive =
          normalizedActive === cat.slug.toLowerCase() ||
          normalizedActive === cat.id.toLowerCase() ||
          normalizedActive === cat.name.toLowerCase();

        // Mark the first category with positive affinity as the user's favourite
        const isTopAffinity = idx === topAffinityIdx && (cat.affinityScore || 0) > 0;

        const catHref = mainCategory && mainCategory !== 'ALL'
          ? `/category/${cat.slug}?mainCategory=${mainCategory}`
          : `/category/${cat.slug}`;

        const displayCount = mainCategory === 'VEG'
          ? (cat.vegCount ?? cat.count ?? 0)
          : mainCategory === 'NON_VEG'
          ? (cat.nonVegCount ?? cat.count ?? 0)
          : cat.count;

        return (
          <Link
            key={cat.id}
            href={catHref}
            title={isTopAffinity ? 'Your most-played category' : cat.name}
            className={`relative flex-shrink-0 flex items-center gap-2 font-medium text-xs px-4 py-2 rounded-xl transition-all border ${
              isCatActive
                ? 'bg-indigo-600 text-white font-semibold border-indigo-500 shadow-sm'
                : isTopAffinity
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border-indigo-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
            }`}
          >
            <span>{CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS[cat.id] || '🎯'}</span>
            <span>{cat.name}</span>
            <span
              className={`text-[10px] font-mono ${
                isCatActive ? 'text-white/80' : 'text-slate-500'
              }`}
            >
              ({displayCount})
            </span>
            {/* Dot indicator for user's most-played category */}
            {isTopAffinity && !isCatActive && (
              <span
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 border border-white"
                aria-label="Your favourite category"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
