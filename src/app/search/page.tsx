'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import GameCard from '@/components/GameCard';
import {
  Search as SearchIcon,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Gamepad2,
  Flame,
  Star,
  Clock,
  Compass,
  Send,
  CheckCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import WebAdBanner from '@/components/ads/WebAdBanner';

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

  // Fallback recommendations when 0 results found
  const [fallbackRecommendations, setFallbackRecommendations] = useState<any[]>([]);
  const [requestSent, setRequestSent] = useState(false);

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
        const found = data.games || [];
        setGames(found);
        setTotalCount(data.total || 0);

        // If no games found, trigger smart fallback recommendations
        if (found.length === 0 && query.trim()) {
          fetchFallbackRecommendations(query.trim());
        }
      }
    } catch (err) {
      console.error('Search query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFallbackRecommendations = async (searchKeyword: string) => {
    try {
      const res = await fetch(`/api/recommendations?query=${encodeURIComponent(searchKeyword)}&limit=4`);
      if (res.ok) {
        const data = await res.json();
        setFallbackRecommendations(data.recommendations || []);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      executeSearch();
    }, 250);

    return () => clearTimeout(handler);
  }, [query, selectedCategory, sortBy]);

  const handleRequestGame = () => {
    setRequestSent(true);
    setTimeout(() => {
      // Auto-reset button state after 4 seconds
      setRequestSent(false);
    }, 4000);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="space-y-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm">GLOBAL SEARCH</Badge>
            <span className="text-xs text-slate-500 font-mono">
              {totalCount} {totalCount === 1 ? 'game found' : 'games found'}
            </span>
          </div>
          <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900 mt-0.5">
            Discover & Search Games
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Instant search across verified HTML5, WebGL, and WASM browser titles.
          </p>
        </div>

        {/* Search Bar + Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by game title, mechanics, tags, or studio..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
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
              className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
            >
              <option value="trending">Sort: Trending</option>
              <option value="popular">Sort: Most Played</option>
              <option value="top_rated">Sort: Top Rated</option>
              <option value="newest">Sort: Newest</option>
            </select>
          </div>
        </div>

        {/* Quick Tag Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Popular:</span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                query.toLowerCase() === tag.toLowerCase()
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 5. SEARCH RESULTS SPONSORED LISTING (Placement: Search results mein sponsored game) */}
      <WebAdBanner placement="SEARCH_SPONSORED" />

      {/* Results Grid */}
      {games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      ) : (
        /* Ultra-Compact Smart Fallback & Engaging Recommendations when Zero Matches Found */
        <div className="space-y-4 py-1">
          <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white border border-indigo-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                    This Game is Not Available Yet
                  </h2>
                  {query && (
                    <span className="text-[10px] text-indigo-700 font-mono font-semibold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 truncate max-w-[140px]">
                      "{query}"
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] truncate mt-0.5">
                  We searched the entire catalog for "{query || 'this title'}", but it's not available on GameVerse yet. Would you like to play these top-rated and similar popular games instead?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={handleRequestGame}
                disabled={requestSent}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                {requestSent ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Requested!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Request Title</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('all');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                Browse Trending
              </button>
            </div>
          </div>

          {/* Curated Alternative Recommendations */}
          {fallbackRecommendations.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="font-heading font-black text-base sm:text-lg text-slate-900">
                    Suggested Games You Might Enjoy Instead
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500">Popular Alternatives</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {fallbackRecommendations.map((rec) => (
                  <GameCard key={rec.id} game={rec} />
                ))}
              </div>
            </div>
          )}
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
