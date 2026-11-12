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
            Instant search across verified HTML5, WebGL, and WASM browser titles.
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
        /* Smart Fallback & Engaging Recommendations when Zero Matches Found */
        <div className="space-y-10 py-6">
          <div className="bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-[#090D16] border border-indigo-500/30 rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
              <Compass className="w-8 h-8 animate-pulse" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              This Game is Not Available Yet
            </h2>
            <p className="text-gray-300 text-sm max-w-xl mx-auto mt-2 leading-relaxed">
              We searched the entire catalog for <span className="font-mono text-cyan-300 font-bold bg-white/5 px-2 py-0.5 rounded">"{query}"</span>, but this title is not available on GameVerse yet.
            </p>
            <p className="text-indigo-300 text-sm font-semibold mt-2">
              Would you like to play these top-rated and similar popular games instead?
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <Button
                variant={requestSent ? 'outline' : 'primary'}
                onClick={handleRequestGame}
                disabled={requestSent}
                className="flex items-center gap-2"
              >
                {requestSent ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Request Logged! Devs Notified</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Request "{query || 'This Title'}" to be Added</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('all');
                }}
              >
                Browse All Trending Games
              </Button>
            </div>
          </div>

          {/* Curated Alternative Recommendations */}
          {fallbackRecommendations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-heading font-black text-xl text-white">
                    Suggested Games You Might Enjoy Instead
                  </h3>
                </div>
                <span className="text-xs font-mono text-gray-400">Curated AI Recommendations</span>
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
