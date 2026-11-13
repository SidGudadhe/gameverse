'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Search, ArrowLeft, Gamepad2, Sparkles, Trash2, Play } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GameCard from '@/components/GameCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FavoritesSkeleton } from '@/components/ui/Skeleton';
import { Game } from '@/types';

export default function PlayerFavoritesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/player/favorites');
      if (res.ok) {
        const data = await res.json();
        setFavoriteGames(data.games || []);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const handleRemoveFavorite = async (e: React.MouseEvent, gameId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistically update UI
    setFavoriteGames((prev) => prev.filter((g) => g.id !== gameId));

    try {
      await fetch(`/api/player/favorites/${gameId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      // Refetch on error
      fetchFavorites();
    }
  };

  // Categories present in the user's favorites
  const categories = Array.from(
    new Set(favoriteGames.map((g) => g.categoryName).filter(Boolean))
  );

  const filteredGames = favoriteGames.filter((g) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || g.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-gray-200 font-medium">Favorites</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
              Saved Collection
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mt-1">
            My Favorite Games
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Your personal collection of bookmarked games. Play anytime without searching.
          </p>
        </div>

        {isAuthenticated && favoriteGames.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 rounded-xl">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>{favoriteGames.length} {favoriteGames.length === 1 ? 'Game' : 'Games'} Saved</span>
          </div>
        )}
      </div>

      {/* Unauthenticated State */}
      {!authLoading && !isAuthenticated ? (
        <div className="bg-slate-900/80 rounded-3xl p-8 sm:p-12 border border-white/10 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
            <Heart className="w-8 h-8 fill-rose-500" />
          </div>
          <h2 className="font-heading font-bold text-xl text-white">
            Sign In to Access Your Favorites
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            Create a free Gamer account or sign in to save your favorite games and access them across all your devices.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/login"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-semibold px-6 py-2.5 rounded-xl border border-white/10 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      ) : loading ? (
        <FavoritesSkeleton />
      ) : favoriteGames.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorite games yet"
          description="Explore our free games catalog and click the heart icon on any game to save it here for quick access!"
          actionLabel="Browse Games"
          onAction={() => {
            window.location.href = '/';
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-white/10">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                All ({favoriteGames.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Favorites Grid with Quick Remove Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredGames.map((game) => (
              <div key={game.id} className="relative group">
                <GameCard game={game} />
                <button
                  onClick={(e) => handleRemoveFavorite(e, game.id)}
                  title="Remove from favorites"
                  className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-lg bg-black/80 hover:bg-rose-600 text-gray-300 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md backdrop-blur-sm"
                  aria-label="Remove favorite"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
