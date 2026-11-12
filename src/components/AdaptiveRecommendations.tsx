'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  Compass,
  Brain,
  Gamepad,
  Flame,
  ArrowRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import GameCard from '@/components/GameCard';
import { MOOD_DEFINITIONS, GameMood } from '@/types/recommendations';

interface AdaptiveRecommendationsProps {
  initialMood?: GameMood;
  title?: string;
  subtitle?: string;
  excludeGameId?: string;
  limit?: number;
}

export default function AdaptiveRecommendations({
  initialMood = 'ALL',
  title = 'Recommended For You',
  subtitle = 'Games picked based on your playtime and favorites.',
  excludeGameId,
  limit = 8,
}: AdaptiveRecommendationsProps) {
  const [activeMood, setActiveMood] = useState<GameMood>(initialMood);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async (mood: GameMood) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('mood', mood);
      params.set('limit', limit.toString());
      if (excludeGameId) params.set('exclude', excludeGameId);

      const res = await fetch(`/api/recommendations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to load personalized recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(activeMood);
  }, [activeMood]);

  const moodButtons: { key: GameMood; label: string; icon: string }[] = [
    { key: 'ALL', label: 'All Picks', icon: '✨' },
    { key: 'ADRENALINE', label: 'Action & Speed', icon: '⚡' },
    { key: 'RELAX_PUZZLE', label: 'Puzzle & Casual', icon: '🧩' },
    { key: 'EXPLORATION', label: 'Adventure', icon: '🗺️' },
    { key: 'RETRO_NOSTALGIA', label: 'Arcade Classic', icon: '🕹️' },
  ];

  return (
    <section className="space-y-6 pt-4 pb-2">
      {/* Header & Quick Mood Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400" />
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              Picks For You
            </span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight mt-1">
            {title}
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xl">
            {subtitle}
          </p>
        </div>

        {/* Quick Mood Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {moodButtons.map((btn) => {
            const isSelected = activeMood === btn.key;

            return (
              <button
                key={btn.key}
                onClick={() => setActiveMood(btn.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-gray-300 border border-white/5 hover:border-white/15'
                }`}
              >
                <span>{btn.icon}</span>
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommendations Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
          <p className="text-xs text-gray-400">Finding the best games for you...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          No games found in this category right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {recommendations.map((game) => (
            <GameCard key={`rec-${game.id}`} game={game} />
          ))}
        </div>
      )}
    </section>
  );
}
