import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { gvDb } from '@/lib/database';
import GameCard from '@/components/GameCard';
import GameActionBar from '@/components/GameActionBar';
import AdaptiveRecommendations from '@/components/AdaptiveRecommendations';
import { Star, ArrowLeft, Gamepad2, Info, ShieldCheck, Keyboard, MessageSquare, Loader2 } from 'lucide-react';
import { GameMood } from '@/types/recommendations';

// Dynamic code-splitting for heavy client components
const GamePlayer = dynamic(() => import('@/components/GamePlayer'), {
  loading: () => (
    <div className="w-full aspect-video rounded-3xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center p-6 shadow-sm relative overflow-hidden animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center mb-3">
        <Gamepad2 className="w-8 h-8 text-indigo-600" />
      </div>
      <div className="h-4 w-48 bg-slate-200 rounded-full" />
      <div className="h-3 w-32 bg-slate-200 rounded-full mt-2" />
    </div>
  ),
  ssr: false,
});

const GameReviewsSection = dynamic(() => import('@/components/GameReviewsSection'), {
  loading: () => (
    <div className="w-full h-44 rounded-2xl bg-white border border-slate-200 animate-pulse" />
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

  // Infer initial mood from current game category
  let defaultMood: GameMood = 'ALL';
  if (game.categoryId === 'cat-arcade' || game.categoryId === 'cat-action') {
    defaultMood = 'ADRENALINE';
  } else if (game.categoryId === 'cat-rpg' || game.categoryId === 'cat-strategy') {
    defaultMood = 'EXPLORATION';
  } else if (game.categoryId === 'cat-puzzle' || game.categoryId === 'cat-casual') {
    defaultMood = 'RELAX_PUZZLE';
  }

  // Generate opaque creator referral token
  const referralToken = `cr_${game.developerId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Clean Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <Link href={`/category/${game.categoryId}`} className="hover:text-slate-900 transition-colors font-medium">
          {game.categoryName}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-[200px]">{game.title}</span>
      </div>

      {/* Embedded Responsive Game Player Viewport */}
      <div className="relative">
        <GamePlayer game={game} />
      </div>

      {/* Game Title, Creator & Social Action Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
              {game.title}
            </h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-2.5 py-0.5 rounded-lg">
              {game.categoryName}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
            <span>
              By <span className="text-slate-800 font-semibold">{game.developerName}</span>
            </span>
            <span>•</span>
            <div className="flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{game.rating.toFixed(1)}</span>
            </div>
            <span>•</span>
            <span>{(game.totalPlays / 1000).toFixed(1)}k Plays</span>
          </div>
        </div>

        {/* Action Buttons: Like, Share, Report */}
        <GameActionBar
          gameTitle={game.title}
          gameSlug={game.slug}
          gameId={game.id}
          referralToken={referralToken}
          thumbnailUrl={game.thumbnailUrl}
        />
      </div>

      {/* 1. SIMILAR GAMES SUGGESTIONS (Directly below game player - Poki / CrazyGames Pattern) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <AdaptiveRecommendations
          initialMood={defaultMood}
          title={`More Games Like ${game.title}`}
          subtitle={`Popular ${game.categoryName} games you can play right now.`}
          excludeGameId={game.id}
          limit={4}
        />
      </div>

      {/* 2. ABOUT, INSTRUCTIONS & COMMUNITY REVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left 2 Cols: Description & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Game Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
              <Info className="w-5 h-5 text-indigo-600" />
              <h2>About {game.title}</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {game.fullDescription || game.shortDescription}
            </p>
          </div>

          {/* Controls & Instructions Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
              <Keyboard className="w-5 h-5 text-indigo-600" />
              <h2>Controls & How to Play</h2>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 whitespace-pre-line leading-relaxed font-mono text-xs">
              {game.controlsGuide || '• Use Mouse or Touch to interact\n• Arrow keys or WASD to move\n• Space to jump or action'}
            </div>
          </div>

          {/* 3. Community Ratings & Reviews */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3 mb-4">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h2>Player Reviews & Ratings</h2>
            </div>
            <GameReviewsSection gameSlug={game.slug} gameId={game.id} initialRating={game.rating} />
          </div>
        </div>

        {/* Right Col: Game Overview Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
              <Gamepad2 className="w-4 h-4 text-indigo-600" />
              <h3>Game Information</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Developer</span>
                <span className="text-slate-800 font-semibold">{game.developerName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Genre</span>
                <span className="text-indigo-600 font-semibold">{game.categoryName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Platform</span>
                <span className="text-emerald-700 font-medium">Web Browser (No Install)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Released</span>
                <span className="text-slate-800">
                  {new Date(game.publishedAt || game.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
