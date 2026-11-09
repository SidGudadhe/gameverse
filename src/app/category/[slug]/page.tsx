import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import GameCard from '@/components/GameCard';
import { ArrowLeft, Gamepad2 } from 'lucide-react';

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = db.categories.find((c) => c.slug === params.slug);
  if (!category) {
    notFound();
  }

  const games = db.getGames({ categoryId: category.id, status: 'PUBLISHED' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Games</span>
        </Link>
        <span>/</span>
        <span className="text-gray-200">{category.name} Games</span>
      </div>

      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-black text-3xl text-white">
              {category.name} Games
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              {category.description} • {games.length} Instant Playable Games
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
