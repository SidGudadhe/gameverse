import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { gvDb } from '@/lib/database';
import GameCard from '@/components/GameCard';
import GameActionBar from '@/components/GameActionBar';
import { Star, ArrowLeft, Gamepad, Info, ShieldCheck, Check, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

// Dynamic code-splitting for heavy client components to optimize LCP & TTI
const GamePlayer = dynamic(() => import('@/components/GamePlayer'), {
  loading: () => (
    <div className="w-full aspect-video rounded-3xl bg-[#090D16] border border-white/10 flex flex-col items-center justify-center text-center p-6 shadow-2xl relative overflow-hidden animate-pulse">
      <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center mb-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
      <div className="h-4 w-48 bg-white/10 rounded-full" />
      <div className="h-3 w-32 bg-white/5 rounded-full mt-2" />
    </div>
  ),
  ssr: false,
});

const GameReviewsSection = dynamic(() => import('@/components/GameReviewsSection'), {
  loading: () => (
    <div className="w-full h-44 rounded-2xl bg-slate-900/40 border border-white/5 animate-pulse" />
  ),
  ssr: true,
});

interface GamePageProps {
  params: {
    slug: string;
  };
}

export default function GamePage({ params }: GamePageProps) {
  const game = gvDb.getGameBySlug(params.slug) || gvDb.getGameById(params.slug);

  if (!game || game.status !== 'PUBLISHED') {
    notFound();
  }

  const version = game.currentVersionId ? gvDb.getVersionById(game.currentVersionId) : null;
  const relatedGames = gvDb
    .getGames({ categoryId: game.categoryId, status: 'PUBLISHED' })
    .filter((g) => g.id !== game.id)
    .slice(0, 3);

  // Generate opaque creator referral token
  const referralToken = `cr_${game.developerId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Catalog</span>
        </Link>
        <span>/</span>
        <Link href={`/category/${game.categoryId}`} className="hover:text-white transition-colors">
          {game.categoryName}
        </Link>
        <span>/</span>
        <span className="text-gray-200 font-medium">{game.title}</span>
      </div>

      {/* Embedded Sandboxed Player Viewport */}
      <GamePlayer game={game} />

      {/* Game Meta & Social Actions Bar */}
      <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
              {game.title}
            </h1>
            <Badge variant="cyan">{game.categoryName}</Badge>
            {version && (
              <span className="text-xs font-mono text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                v{version.versionNumber}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            <span>
              By <span className="text-gray-200 font-semibold">{game.developerName}</span>
            </span>
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
        <GameActionBar
          gameTitle={game.title}
          gameSlug={game.slug}
          gameId={game.id}
          referralToken={referralToken}
          thumbnailUrl={game.thumbnailUrl}
        />
      </div>

      {/* Details & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 rounded-2xl p-6 border border-white/10 space-y-4">
            <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              <span>About {game.title}</span>
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {game.fullDescription || game.shortDescription}
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-2xl p-6 border border-white/10 space-y-4">
            <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <Gamepad className="w-5 h-5 text-cyan-400" />
              <span>Controls & How to Play</span>
            </h2>
            <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-xs text-gray-300 whitespace-pre-line leading-relaxed">
              {game.controlsGuide || 'Standard Mouse / Keyboard / Touch controls supported.'}
            </div>
          </div>
        </div>

        {/* Right Col: Technical Specifications & Verification */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Technical Specs</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Game Engine</span>
                <span className="text-gray-200 font-semibold font-mono">{game.engine}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Target Orientation</span>
                <span className="text-gray-200 font-semibold">{game.orientation}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Platform Sandbox</span>
                <span className="text-emerald-400 font-semibold">Strict Origin Isolation</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Build Version</span>
                <span className="text-gray-200 font-mono">v{version?.versionNumber || '1.0.0'}</span>
              </div>
              {version?.archiveChecksum && (
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Checksum (SHA-256)</span>
                  <span className="text-emerald-400 font-mono truncate max-w-[120px]" title={version.archiveChecksum}>
                    {version.archiveChecksum.substring(0, 10)}...
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400">Published Date</span>
                <span className="text-gray-200">
                  {new Date(game.publishedAt || game.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Ratings & Reviews */}
      <GameReviewsSection gameSlug={game.slug} gameId={game.id} initialRating={game.rating} />

      {/* Related Games Carousel */}
      {relatedGames.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-xl text-white">
              More Games Like This
            </h2>
            <Link
              href={`/category/${game.categoryId}`}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Browse All in {game.categoryName} →
            </Link>
          </div>
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
