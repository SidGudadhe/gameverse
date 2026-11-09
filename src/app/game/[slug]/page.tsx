import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import GamePlayer from '@/components/GamePlayer';
import GameCard from '@/components/GameCard';
import { Heart, Share2, Flag, Star, ArrowLeft, Gamepad, Info, ShieldCheck } from 'lucide-react';

interface GamePageProps {
  params: {
    slug: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  const game = db.getGameBySlug(params.slug);

  if (!game) {
    notFound();
  }

  const relatedGames = db.getGames({ categoryId: game.categoryId }).filter((g) => g.id !== game.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <Link href={`/category/${game.categoryId}`} className="hover:text-white transition-colors">
          {game.categoryName}
        </Link>
        <span>/</span>
        <span className="text-gray-200 font-medium">{game.title}</span>
      </div>

      {/* Embedded Sandboxed Player */}
      <GamePlayer game={game} />

      {/* Game Meta & Social Actions Bar */}
      <div className="bg-surface rounded-2xl p-5 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
              {game.title}
            </h1>
            <span className="bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {game.categoryName}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            <span>By <span className="text-gray-200 font-semibold">{game.developerName}</span></span>
            <span>•</span>
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{game.rating.toFixed(1)}</span>
            </div>
            <span>•</span>
            <span>{(game.totalPlays / 1000).toFixed(1)}k Total Plays</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-elevated hover:bg-white/10 text-gray-200 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-all"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Favorite</span>
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(window.location.href);
                alert('Unique Game Link copied to clipboard!');
              }
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-elevated hover:bg-white/10 text-gray-200 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-all"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>Share Link</span>
          </button>

          <button
            className="p-2.5 bg-elevated hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-xl border border-white/10 transition-colors"
            title="Report build or content issue"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Details & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl p-6 border border-white/10 space-y-4">
            <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              <span>About {game.title}</span>
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {game.fullDescription || game.shortDescription}
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-6 border border-white/10 space-y-4">
            <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <Gamepad className="w-5 h-5 text-cyan-400" />
              <span>Controls & How to Play</span>
            </h2>
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 font-mono text-xs text-gray-300 whitespace-pre-line leading-relaxed">
              {game.controlsGuide || 'Standard Mouse / Keyboard / Touch controls supported.'}
            </div>
          </div>
        </div>

        {/* Right Col: Technical Specifications & Verification */}
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Build Specs</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Game Engine</span>
                <span className="text-gray-200 font-semibold">{game.engine}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Target Orientation</span>
                <span className="text-gray-200 font-semibold">{game.orientation}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Platform Sandbox</span>
                <span className="text-emerald-400 font-semibold">Strict Isolated Iframe</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Last Updated</span>
                <span className="text-gray-200">{new Date(game.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Games */}
      {relatedGames.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-white/10">
          <h2 className="font-heading font-bold text-xl text-white">
            More Games Like This
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedGames.map((rg) => (
              <GameCard key={rg.id} game={rg} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
