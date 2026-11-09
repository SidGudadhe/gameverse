import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import HeroCarousel from '@/components/HeroCarousel';
import GameCard from '@/components/GameCard';
import { Flame, Trophy, Sparkles, Gamepad2, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const allGames = db.getGames({ status: 'PUBLISHED' });
  const featuredGames = allGames.filter((g) => g.isFeatured);
  const categories = db.categories;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      {/* Hero Carousel */}
      <HeroCarousel featuredGames={featuredGames.length > 0 ? featuredGames : allGames} />

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link
          href="/"
          className="flex-shrink-0 flex items-center gap-2 bg-indigo-600 text-white font-semibold text-xs px-4 py-2 rounded-xl border border-indigo-500/40 shadow-sm"
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>All Games</span>
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="flex-shrink-0 flex items-center gap-2 bg-surface hover:bg-elevated text-gray-300 hover:text-white font-medium text-xs px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all"
          >
            <span>{cat.name}</span>
            <span className="text-[10px] text-gray-500">({cat.count})</span>
          </Link>
        ))}
      </div>

      {/* Trending Games Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-white tracking-wide">
                Trending Right Now
              </h2>
              <p className="text-gray-400 text-xs">Hot browser games trending across the community</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {allGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Most Played Section */}
      <section className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-white tracking-wide">
                Hall of Fame / Most Played
              </h2>
              <p className="text-gray-400 text-xs">All-time player favorites with over 100k+ minutes played</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...allGames].reverse().map((game) => (
            <GameCard key={`most-${game.id}`} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
}
