'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, Clock, ArrowLeft, Play, Gamepad2, Star, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { HistorySkeleton } from '@/components/ui/Skeleton';
import { Game } from '@/types';

interface HistoryItem {
  id: string;
  gameId: string;
  userId: string;
  lastPlayedAt: string;
  playCount: number;
  totalPlaySeconds: number;
  game?: Game;
}

export default function PlayerHistoryPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/player/history');
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const formatPlaytime = (seconds: number) => {
    if (!seconds || seconds < 60) return '< 1 min';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins`;
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hrs`;
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-gray-200 font-medium">History</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <History className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Gameplay Activity
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mt-1">
            Recently Played Games
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Pick up right where you left off. Games you have played on GameVerse.
          </p>
        </div>

        {isAuthenticated && historyItems.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl">
            <Clock className="w-3.5 h-3.5" />
            <span>{historyItems.length} {historyItems.length === 1 ? 'Game' : 'Games'} Played</span>
          </div>
        )}
      </div>

      {/* Unauthenticated State */}
      {!authLoading && !isAuthenticated ? (
        <div className="bg-slate-900/80 rounded-3xl p-8 sm:p-12 border border-white/10 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <History className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-xl text-white">
            Sign In to View Your History
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            Sign in with your Gamer account to automatically record your gaming sessions and resume playing anytime.
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
        <HistorySkeleton />
      ) : historyItems.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="No played games yet"
          description="You haven't played any games in this session yet. Pick any game from the catalog to jump into the action!"
          actionLabel="Explore Games"
          onAction={() => {
            window.location.href = '/';
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {historyItems.map((item) => {
            const game = item.game;
            if (!game) return null;

            return (
              <div
                key={item.id}
                className="bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-xl group"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={game.thumbnailUrl}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-black/70 backdrop-blur-sm text-gray-200 text-[10px] font-medium px-2 py-0.5 rounded-md border border-white/10">
                        {game.categoryName}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span className="bg-black/70 backdrop-blur-sm text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-amber-400/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(item.lastPlayedAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{game.rating.toFixed(1)}</span>
                      </span>
                      <span>{formatPlaytime(item.totalPlaySeconds)} played</span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                      {game.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="p-4 bg-slate-950/40 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-400 text-[11px]">
                    Played {item.playCount || 1} {item.playCount === 1 ? 'time' : 'times'}
                  </span>

                  <Link
                    href={`/game/${game.slug}`}
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Play Again</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
