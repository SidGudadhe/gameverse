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
import { useAuth } from '@/context/AuthContext';

const POPULAR_TAGS = ['Retro', 'Runner', 'Cyberpunk', 'Dungeon', 'Physics', 'Pixel', 'WebGL'];

function SearchContent() {
  const { isAuthenticated, openAuthModal } = useAuth();
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

  const handleRequestGame = async () => {
    // Strictly require gamer authentication: unauthenticated users cannot request titles without an account
    if (!isAuthenticated) {
      openAuthModal('LOGIN');
      return;
    }

    const titleToRequest = query.trim() || 'Requested Game';
    try {
      const res = await fetch('/api/player/request-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleToRequest }),
      });
      if (res.ok) {
        setRequestSent(true);
        setTimeout(() => {
          // Auto-reset button state after 4 seconds
          setRequestSent(false);
        }, 4000);
      }
    } catch {
      // Non-blocking
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Search Bar + Sort Control */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by game title, mechanics, tags, or studio..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          aria-label="Sort games"
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs shrink-0 cursor-pointer"
        >
          <option value="trending">Sort: Trending</option>
          <option value="popular">Sort: Most Played</option>
          <option value="top_rated">Sort: Top Rated</option>
          <option value="newest">Sort: Newest</option>
        </select>
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
                title={!isAuthenticated ? 'Sign in or register to request game titles' : 'Submit request for this title'}
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
