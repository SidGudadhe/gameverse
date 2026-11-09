'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/db';
import GameCard from '@/components/GameCard';
import { Search as SearchIcon, Filter, Frown } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allGames = db.getGames({ status: 'PUBLISHED' });
  const categories = db.categories;

  const filteredGames = allGames.filter((g) => {
    const matchesQuery =
      query.trim() === '' ||
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      g.shortDescription.toLowerCase().includes(query.toLowerCase()) ||
      g.developerName.toLowerCase().includes(query.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || g.categoryId === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header & Filter Controls */}
      <div className="space-y-4 border-b border-white/10 pb-6">
        <h1 className="font-heading font-black text-3xl text-white">
          Discover Games
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by game name, creator, or mechanics..."
              className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGames.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-4 bg-surface/30 rounded-3xl border border-white/5 p-8 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-gray-400 flex items-center justify-center mx-auto">
            <Frown className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-white">No games found</h3>
          <p className="text-gray-400 text-xs leading-relaxed">
            We couldn't find any games matching &quot;<span className="text-white">{query}</span>&quot;. Try searching for &quot;runner&quot;, &quot;space&quot;, or &quot;puzzle&quot;.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div className="text-xs text-gray-400">Loading catalog search...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
