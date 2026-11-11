'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import GameCard from '@/components/GameCard';
import { Search as SearchIcon, Filter, SlidersHorizontal, Sparkles, Gamepad2, Flame, Star, Clock } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

const POPULAR_TAGS = ['Retro', 'Runner', 'Cyberpunk', 'Dungeon', 'Physics', 'Pixel', 'WebGL'];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';
  const initialSort = (searchParams.get('sort') as any) || 'trending';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'trending' | 'popular' | 'top_rated' | 'newest'>(initialSort);
  const [games, setGames] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch games from /api/games
  const executeSearch = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      params.set('sort', sortBy);
      params.set('limit', '40');

      const res = await fetch(`/api/games?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGames(data.games || []);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error('Search query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      executeSearch();
    }, 250);

    return () => clearTimeout(handler);
  }, [query, selectedCategory, sortBy]);

  return (
    <div className="space-y-8">
      {/* Header & Filter Controls */}
      <div className="space-y-5 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan">GLOBAL SEARCH</Badge>
            <span className="text-xs text-gray-400 font-mono">
              {totalCount} {totalCount === 1 ? 'game found' : 'games found'}
            </span>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-white mt-1">
            Discover & Search Games
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Instant filter across verified HTML5, WebGL, and WASM browser titles.
          </p>
        </div>

        {/* Search Bar + Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by game title, mechanics, tags, or studio..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="cat-arcade">Arcade</option>
              <option value="cat-action">Action</option>
              <option value="cat-puzzle">Puzzle</option>
              <option value="cat-strategy">Strategy</option>
              <option value="cat-rpg">RPG</option>
              <option value="cat-sports">Sports</option>
              <option value="cat-casual">Casual</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="trending">Sort: Trending</option>
              <option value="popular">Sort: Most Played</option>
              <option value="top_rated">Sort: Top Rated</option>
              <option value="newest">Sort: Newest</option>
            </select>
          </div>
        </div>

        {/* Quick Tag Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs text-gray-400">
          <span className="font-semibold text-gray-400">Popular:</span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                query.toLowerCase() === tag.toLowerCase()
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <div className="p-16">
          <EmptyState
            icon={Gamepad2}
            title="No Matching Games"
            description={`We couldn't find any games matching "${query}". Try searching for popular genres like "Runner", "Retro", or "Dungeon".`}
            actionLabel="Clear Search"
            onAction={() => {
              setQuery('');
              setSelectedCategory('all');
              setSortBy('trending');
            }}
          />
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
