import React from 'react';
import Link from 'next/link';
import { gvDb } from '@/lib/database';
import HeroCarousel from '@/components/HeroCarousel';
import GameCard from '@/components/GameCard';
import AdaptiveRecommendations from '@/components/AdaptiveRecommendations';
import { Flame, Trophy, Sparkles, Gamepad2, ArrowRight } from 'lucide-react';

const CATEGORY_ICONS: Record<string, string> = {
  'cat-action': '⚡',
  'cat-puzzle': '🧩',
  'cat-arcade': '🕹️',
  'cat-racing': '🏎️',
  'cat-casual': '🎯',
  'cat-rpg': '⚔️',
  'cat-strategy': '🧠',
  'cat-sports': '⚽',
};

export default function HomePage() {
  const allGames = gvDb.getGames({ status: 'PUBLISHED' });
  const featuredGames = allGames.filter((g) => g.isFeatured);
  const categories = gvDb.getCategories();

  // Trending: ranked by engagement score
  const trendingGames = [...allGames].sort((a, b) => {
    const scoreA = (a.totalPlays || 0) * 0.5 + (a.rating || 0) * 1000;
    const scoreB = (b.totalPlays || 0) * 0.5 + (b.rating || 0) * 1000;
    return scoreB - scoreA;
  });

  // Most Played: ranked by totalPlays
  const mostPlayedGames = [...allGames].sort((a, b) => b.totalPlays - a.totalPlays);

  // New Releases: ranked by publication date
  const newReleases = [...allGames].sort(
    (a, b) =>
      new Date(b.publishedAt || b.createdAt).getTime() -
      new Date(a.publishedAt || a.createdAt).getTime()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      {/* Featured Hero Showcase */}
      <HeroCarousel featuredGames={featuredGames.length > 0 ? featuredGames : allGames} />

      {/* Category Navigation Quick Chips (Poki / CrazyGames Style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link
          href="/"
          className="flex-shrink-0 flex items-center gap-2 bg-indigo-600 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm shadow-indigo-600/30"
        >
          <span>🎮</span>
          <span>All Games</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-mono">
            {allGames.length}
          </span>
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="flex-shrink-0 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white font-medium text-xs px-4 py-2 rounded-xl border border-white/5 hover:border-white/15 transition-all"
          >
            <span>{CATEGORY_ICONS[cat.id] || '🎯'}</span>
            <span>{cat.name}</span>
            <span className="text-[10px] text-gray-500 font-mono">({cat.count})</span>
          </Link>
        ))}
      </div>

      {/* Recommended For You Section */}
      <AdaptiveRecommendations
        title="Recommended For You"
        subtitle="Games you might like based on your gameplay choices and favorite genres."
        limit={8}
      />

      {/* Trending Games Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-white tracking-wide">
                Trending Games
              </h2>
              <p className="text-gray-400 text-xs">Top games players are enjoying today</p>
            </div>
          </div>
          <Link
            href="/search?sort=trending"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {trendingGames.slice(0, 6).map((game) => (
            <GameCard key={`trend-${game.id}`} game={game} />
          ))}
        </div>
      </section>

      {/* Most Popular All Time */}
      <section className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-white tracking-wide">
                Most Played Games
              </h2>
              <p className="text-gray-400 text-xs">All-time favorites with highest player counts</p>
            </div>
          </div>
          <Link
            href="/search?sort=plays"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {mostPlayedGames.slice(0, 6).map((game) => (
            <GameCard key={`popular-${game.id}`} game={game} />
          ))}
        </div>
      </section>

      {/* Fresh New Releases */}
      <section className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-white tracking-wide">
                New Releases
              </h2>
              <p className="text-gray-400 text-xs">Fresh games recently uploaded by developers</p>
            </div>
          </div>
          <Link
            href="/search?sort=newest"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {newReleases.slice(0, 8).map((game) => (
            <GameCard key={`new-${game.id}`} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
}
