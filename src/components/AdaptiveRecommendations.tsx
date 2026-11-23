'use client';

import React, { useState, useEffect, useCallback } from 'react';
import GameCard from '@/components/GameCard';
import { RecommendationsSkeleton } from '@/components/ui/Skeleton';
import { MOOD_DEFINITIONS, GameMood } from '@/types/recommendations';

interface AdaptiveRecommendationsProps {
  initialMood?: GameMood;
  title?: string;
  subtitle?: string;
  excludeGameId?: string;
  limit?: number;
  mainCategory?: 'VEG' | 'NON_VEG';
}

// All possible mood button definitions (label + icon, ordered by affinity dynamically)
const MOOD_META: Record<GameMood, { label: string; icon: string }> = {
  ALL:              { label: 'All Picks',       icon: '✨' },
  ADRENALINE:       { label: 'Action & Speed',  icon: '⚡' },
  RELAX_PUZZLE:     { label: 'Puzzle & Casual', icon: '🧩' },
  EXPLORATION:      { label: 'Adventure',       icon: '🗺️' },
  RETRO_NOSTALGIA:  { label: 'Arcade Classic',  icon: '🕹️' },
};

// Cache: keyed by mood+excludeGameId+limit+mainCategory → { games, topMoods }
const recCache = new Map<string, { games: any[]; topMoods: { mood: GameMood; affinityScore: number }[] }>();

export default function AdaptiveRecommendations({
  initialMood = 'ALL',
  title = 'Recommended For You',
  subtitle = 'Games picked based on your playtime and favorites.',
  excludeGameId,
  limit = 8,
  mainCategory,
}: AdaptiveRecommendationsProps) {
  const [activeMood, setActiveMood] = useState<GameMood>(initialMood);

  // Affinity-ordered mood buttons — initially default order
  const defaultMoodOrder: GameMood[] = ['ALL', 'ADRENALINE', 'RELAX_PUZZLE', 'EXPLORATION', 'RETRO_NOSTALGIA'];
  const [moodOrder, setMoodOrder] = useState<GameMood[]>(defaultMoodOrder);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async (mood: GameMood) => {
    const key = `${mood}_${excludeGameId || ''}_${limit}_${mainCategory || 'ALL'}`;
    const cached = recCache.get(key);

    if (cached) {
      setRecommendations(cached.games);
      // Always update mood order from latest cached response
      if (cached.topMoods?.length > 0) {
        setMoodOrder(cached.topMoods.map((m) => m.mood));
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('mood', mood);
      params.set('limit', limit.toString());
      if (excludeGameId) params.set('exclude', excludeGameId);
      if (mainCategory) params.set('mainCategory', mainCategory);

      const res = await fetch(`/api/recommendations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const games = data.recommendations || [];
        // topMoods: affinity-sorted mood order returned by server
        const topMoods: { mood: GameMood; affinityScore: number }[] = data.topMoods || [];

        recCache.set(key, { games, topMoods });
        setRecommendations(games);

        // Update mood button order if server returned affinity data
        if (topMoods.length > 0) {
          setMoodOrder(topMoods.map((m) => m.mood));
        }
      }
    } catch (err) {
      console.error('Failed to load personalized recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [excludeGameId, limit, mainCategory]);

  useEffect(() => {
    fetchRecommendations(activeMood);
  }, [activeMood, fetchRecommendations]);

  // Build ordered mood buttons from moodOrder (affinity-sorted)
  const orderedMoodButtons = moodOrder
    .filter((key) => MOOD_META[key])
    .map((key) => ({ key, ...MOOD_META[key] }));

  return (
    <section className="space-y-6 pt-4 pb-2">
      {/* Header & Quick Mood Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600" />
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Picks For You
            </span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
            {title}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
            {subtitle}
          </p>
        </div>

        {/* Affinity-Sorted Mood Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {orderedMoodButtons.map((btn, idx) => {
            const isSelected = activeMood === btn.key;
            // First non-ALL button with high affinity gets a subtle "top pick" ring
            const isTopPick = idx === 1 && btn.key !== 'ALL';

            return (
              <button
                key={btn.key}
                onClick={() => setActiveMood(btn.key)}
                title={
                  isTopPick
                    ? `Your most-played category — ${MOOD_DEFINITIONS[btn.key]?.tagline || ''}`
                    : MOOD_DEFINITIONS[btn.key]?.tagline || ''
                }
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isTopPick
                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{btn.icon}</span>
                <span>{btn.label}</span>
                {/* "Top Pick" indicator dot for the highest-affinity mood */}
                {isTopPick && !isSelected && (
                  <span
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 border border-white"
                    aria-label="Your top category"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommendations Grid */}
      {loading ? (
        <RecommendationsSkeleton />
      ) : recommendations.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
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
