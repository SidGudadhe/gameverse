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
  CheckCircle2,
} from 'lucide-react';
import GameCard from '@/components/GameCard';
import { Badge } from '@/components/ui/Badge';
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
  title = 'Curated For Your Gaming Mood',
  subtitle = 'Adaptive AI engine trains on your playtime, favorite categories, and session choices.',
  excludeGameId,
  limit = 8,
}: AdaptiveRecommendationsProps) {
  const [activeMood, setActiveMood] = useState<GameMood>(initialMood);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedMoodInfo, setAppliedMoodInfo] = useState<any>(null);

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
        setAppliedMoodInfo(data.moodMetadata);
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

  const moods: GameMood[] = ['ALL', 'ADRENALINE', 'EXPLORATION', 'RELAX_PUZZLE', 'RETRO_NOSTALGIA'];

  return (
    <section className="space-y-6 pt-4 pb-2">
      {/* Header & Mood Pills */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <Badge variant="cyan">ADAPTIVE RECOMMENDATION ALGORITHM</Badge>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight mt-1.5 flex items-center gap-2">
            <span>{title}</span>
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Interactive Mood Selector Bar (Instagram/TikTok Feed Filter) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {moods.map((m) => {
            const def = MOOD_DEFINITIONS[m];
            const isSelected = activeMood === m;

            return (
              <button
                key={m}
                onClick={() => setActiveMood(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30 border border-white/20'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                }`}
              >
                <span>{def.icon}</span>
                <span>{def.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mood Tagline Banner */}
      {appliedMoodInfo && activeMood !== 'ALL' && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-cyan-950/20 to-transparent border-l-4 border-cyan-400 px-4 py-2.5 rounded-r-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-cyan-200">
            <span className="text-base">{appliedMoodInfo.icon}</span>
            <span className="font-semibold">{appliedMoodInfo.name}:</span>
            <span className="text-gray-300">{appliedMoodInfo.tagline}</span>
          </div>
          <span className="font-mono text-[11px] text-cyan-400/80 hidden sm:inline">
            Active Feed Tuning
          </span>
        </div>
      )}

      {/* Recommended Games Grid */}
      {loading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
          <p className="text-xs font-mono text-gray-400">
            Training neural affinity weights & ranking games...
          </p>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {recommendations.map((game) => (
            <div key={game.id} className="relative group">
              {/* Match Score Badge (Instagram/Netflix style affinity) */}
              {game.matchScore && (
                <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
                  <span className="bg-black/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{game.matchScore}% Match</span>
                  </span>
                </div>
              )}
              <GameCard game={game} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-white/5 p-6">
          <p className="text-gray-400 text-sm">
            No games found for this mood filter yet. Try another mood!
          </p>
        </div>
      )}
    </section>
  );
}
