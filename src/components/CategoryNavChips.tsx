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
}

interface CategoryNavChipsProps {
  activeSlug?: string;
  className?: string;
  initialCategories?: CategoryNavItem[];
}

export default function CategoryNavChips({
  activeSlug,
  className = '',
  initialCategories,
}: CategoryNavChipsProps) {
  const [categories, setCategories] = useState<CategoryNavItem[]>(initialCategories || []);
  const [totalGames, setTotalGames] = useState(
    initialCategories ? initialCategories.reduce((sum, c) => sum + (c.count || 0), 0) : 0
  );

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          const cats: CategoryNavItem[] = data.categories || [];
          setCategories(cats);
          const total = cats.reduce((sum, c) => sum + (c.count || 0), 0);
          setTotalGames(total);
        }
      } catch (err) {
        console.error('Failed to load categories in nav chips:', err);
      }
    }

    if (!initialCategories || initialCategories.length === 0) {
      loadCategories();
    }
  }, [initialCategories]);

  const normalizedActive = (activeSlug || '').toLowerCase();
  const isAllActive = !normalizedActive || normalizedActive === 'all';

  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none ${className}`}>
      <Link
        href="/category"
        className={`flex-shrink-0 flex items-center gap-2 font-semibold text-xs px-4 py-2 rounded-xl transition-all ${
          isAllActive
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
            : 'bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white border border-white/5 hover:border-white/15'
        }`}
      >
        <span>🎮</span>
        <span>All Games</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            isAllActive ? 'bg-white/20 text-white' : 'text-gray-400 bg-slate-800'
          }`}
        >
          {totalGames}
        </span>
      </Link>

      {categories.map((cat) => {
        const isCatActive =
          normalizedActive === cat.slug.toLowerCase() ||
          normalizedActive === cat.id.toLowerCase() ||
          normalizedActive === cat.name.toLowerCase();

        return (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className={`flex-shrink-0 flex items-center gap-2 font-medium text-xs px-4 py-2 rounded-xl transition-all border ${
              isCatActive
                ? 'bg-indigo-600 text-white font-semibold border-indigo-500 shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white border-white/5 hover:border-white/15'
            }`}
          >
            <span>{CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS[cat.id] || '🎯'}</span>
            <span>{cat.name}</span>
            <span
              className={`text-[10px] font-mono ${
                isCatActive ? 'text-white/80' : 'text-gray-500'
              }`}
            >
              ({cat.count})
            </span>
          </Link>
        );
      })}
    </div>
  );
}
