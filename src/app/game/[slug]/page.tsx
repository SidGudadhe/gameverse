import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { gvDb } from '@/lib/database';
import { gameverseStorage } from '@/lib/storage';
import GameCard from '@/components/GameCard';
import GameActionBar from '@/components/GameActionBar';
import AdaptiveRecommendations from '@/components/AdaptiveRecommendations';
import WebAdBanner from '@/components/ads/WebAdBanner';
import GameVerseLogo from '@/components/ui/GameVerseLogo';
import { Star, Gamepad2, Info, ShieldCheck, Keyboard, MessageSquare, Loader2, User, Sparkles, Bot, Play, Flame } from 'lucide-react';
import { GameMood } from '@/types/recommendations';
import { getPersonalizedRecommendations } from '@/lib/recommendations';

// Dynamic code-splitting for heavy client components
const GamePlayer = dynamic(() => import('@/components/GamePlayer'), {
  loading: () => (
    <div className="w-full h-[360px] sm:h-[420px] lg:h-[460px] rounded-3xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center p-6 shadow-sm relative overflow-hidden animate-pulse">
      <GameVerseLogo size="2xl" className="mb-3 animate-pulse shadow-lg shadow-indigo-500/20" />
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
  const rights = version ? gvDb.getRightsDeclarationByVersionId(version.id) : null;

  // Resolve direct public CDN asset URL for isolated runtime delivery
  const cdnUrl = version
    ? gameverseStorage.getPublicCdnUrl(
        `games/${game.id}/versions/${version.versionNumber}/${version.entryFile || 'index.html'}`
      )
    : gameverseStorage.getPublicCdnUrl(`games/${game.id}/versions/v1/index.html`);

  // Resolve Developed By choice (AI Developed | Human Developed | AI + Human Developed)
  let rawDevelopedBy = game.developedBy || (game as any).developmentType || rights?.developedBy;
  if (!rawDevelopedBy) {
    const ai = rights?.aiDisclosure;
    if (ai === 'AI_GENERATED') rawDevelopedBy = 'AI Developed';
    else if (ai === 'AI_ASSISTED') rawDevelopedBy = 'AI + Human Developed';
    else rawDevelopedBy = 'Human Developed';
  } else {
    if (rawDevelopedBy === 'AI_GENERATED' || rawDevelopedBy.toLowerCase().includes('ai developed') || rawDevelopedBy.toLowerCase() === 'ai') {
      rawDevelopedBy = 'AI Developed';
    } else if (rawDevelopedBy === 'AI_ASSISTED' || rawDevelopedBy.toLowerCase().includes('ai + human') || rawDevelopedBy.toLowerCase().includes('ai+human')) {
      rawDevelopedBy = 'AI + Human Developed';
    } else {
      rawDevelopedBy = 'Human Developed';
    }
  }

  const developedByConfig = {
    'Human Developed': {
      label: 'Human Developed',
      icon: User,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    'AI + Human Developed': {
      label: 'AI + Human Developed',
      icon: Sparkles,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    'AI Developed': {
      label: 'AI Developed',
      icon: Bot,
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
  }[rawDevelopedBy as 'Human Developed' | 'AI + Human Developed' | 'AI Developed'] || {
    label: rawDevelopedBy,
    icon: User,
    color: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const DevelopedByIcon = developedByConfig.icon;

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
  const isNonVeg = game.mainCategory === 'NON_VEG';

  // Fetch right-side suggested games strictly aligned with the current game's mainCategory
  // Limit to 12 games for a continuous 2-column Poki/CrazyGames sidebar extending all the way down
  const sideRecommendations = getPersonalizedRecommendations({
    mainCategory: isNonVeg ? 'NON_VEG' : 'VEG',
    excludeGameId: game.id,
    limit: 12,
  }).games;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 pb-8">
      {/* Poki & CrazyGames Outer Architecture: Main Content on Left + Continuous 2-Column Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Main Section (Game Player, Title, Ads, Bottom Recommendations, About, Reviews) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* 1. Embedded Responsive Game Player Viewport (Compact Height) */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-xs">
            <GamePlayer game={{ ...game, cdnUrl } as any} sandboxUrl={cdnUrl} />
          </div>

          {/* 2. Game Title, Creator & Social Action Controls */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900">
                  {game.title}
                </h1>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-2.5 py-0.5 rounded-lg">
                  {game.categoryName}
                </span>
                {/* Main Category Badge: Veg or Non-Veg */}
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 ${
                  isNonVeg
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <span>{isNonVeg ? '🔴' : '🟢'}</span>
                  <span>{isNonVeg ? 'Non-Veg (16+)' : 'Veg (Family Safe)'}</span>
                </span>

                {/* Player Mode Badge: Singleplayer, Multiplayer, or Both */}
                {game.playerMode === 'MULTIPLAYER' && (
                  <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                    <span>👥</span>
                    <span>Multiplayer</span>
                  </span>
                )}
                {game.playerMode === 'BOTH' && (
                  <>
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                      <span>👤</span>
                      <span>Singleplayer</span>
                    </span>
                    <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                      <span>👥</span>
                      <span>Multiplayer</span>
                    </span>
                  </>
                )}
                {(!game.playerMode || game.playerMode === 'SINGLEPLAYER') && (
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                    <span>👤</span>
                    <span>Singleplayer</span>
                  </span>
                )}
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

          {/* 3. GAME DETAIL PAGE BANNER AD (Placement: Below game title bar) */}
          <WebAdBanner placement="GAME_DETAIL_BANNER" />

          {/* 4. SIMILAR GAMES SUGGESTIONS (Directly below game player - Poki / CrazyGames Pattern) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <AdaptiveRecommendations
              initialMood={defaultMood}
              title={isNonVeg ? `More Non-Veg Games Like ${game.title}` : `More Veg Games Like ${game.title}`}
              subtitle={
                isNonVeg
                  ? `Strictly 16+ Non-Veg games only — uncensored action and mature titles for players.`
                  : `Strictly 100% Pure Veg games only — wholesome, safe fun for the entire family.`
              }
              excludeGameId={game.id}
              mainCategory={isNonVeg ? 'NON_VEG' : 'VEG'}
              limit={4}
            />
          </div>

          {/* 5. ABOUT, INSTRUCTIONS, GAME INFO & COMMUNITY REVIEWS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* About Game Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-2.5">
                <Info className="w-4 h-4 text-indigo-600" />
                <h2>About {game.title}</h2>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {game.fullDescription || game.shortDescription}
              </p>
            </div>

            {/* Controls & Instructions Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-2.5">
                <Keyboard className="w-4 h-4 text-indigo-600" />
                <h2>Controls & How to Play</h2>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono">
                {game.controlsGuide || '• Use Mouse or Touch to interact\n• Arrow keys or WASD to move\n• Space to jump or action'}
              </div>
            </div>
          </div>

          {/* Game Information Metadata Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-2.5 mb-3">
              <Gamepad2 className="w-4 h-4 text-indigo-600" />
              <h3>Game Information</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Developer</span>
                <span className="text-slate-800 font-bold mt-0.5 block truncate">{game.developerName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Developed by</span>
                <div className="mt-1">
                  <span
                    data-testid="game-developed-by"
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${developedByConfig.color}`}
                  >
                    <DevelopedByIcon className="w-3 h-3" />
                    <span>{developedByConfig.label}</span>
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Mode</span>
                <span className="text-purple-700 font-bold mt-0.5 block truncate">
                  {game.playerMode === 'MULTIPLAYER'
                    ? 'Multiplayer'
                    : game.playerMode === 'BOTH'
                    ? 'Single & Multi'
                    : 'Singleplayer'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Genre</span>
                <span className="text-indigo-600 font-bold mt-0.5 block truncate">{game.categoryName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Platform</span>
                <span className="text-emerald-700 font-bold mt-0.5 block truncate">Web Browser</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Released</span>
                <span className="text-slate-800 font-bold mt-0.5 block truncate">
                  {new Date(game.publishedAt || game.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Community Ratings & Reviews */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3 mb-4">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h2>Player Reviews & Ratings</h2>
            </div>
            <GameReviewsSection gameSlug={game.slug} gameId={game.id} initialRating={game.rating} />
          </div>
        </div>

        {/* Right-Side Suggested Games Sidebar (Poki / CrazyGames 2-Column Square Tile Grid) */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-xs">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-xs font-black shadow-2xs">
                  ⚡
                </span>
                <h3 className="font-heading font-black text-sm text-slate-900 tracking-tight">
                  Suggested Games
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isNonVeg
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                <span>{isNonVeg ? '🔴' : '🟢'}</span>
                <span>{isNonVeg ? 'Non-Veg' : 'Pure Veg'}</span>
              </span>
            </div>

            {/* Poki & CrazyGames Signature 2-Column Square Visual Tile Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {sideRecommendations.map((sg) => (
                <Link
                  key={`side-rec-${sg.id}`}
                  href={`/game/${sg.slug}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/90 hover:border-indigo-500 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-end p-2.5 cursor-pointer transform hover:-translate-y-1"
                >
                  {/* Full-Bleed Game Cover Art */}
                  <img
                    src={sg.thumbnailUrl}
                    alt={sg.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Multi-layer Dark Gradient for Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5 group-hover:via-black/15 transition-all duration-300" />

                  {/* Top Badges: Category & Rating */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                    <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-md text-white border border-white/10 truncate max-w-[65%]">
                      {sg.categoryName}
                    </span>
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-black text-[9px] shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-white text-white" />
                      <span>{sg.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Center Hover Play Button (Poki & CrazyGames Signature Interaction) */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                    <div className="w-9 h-9 rounded-full bg-indigo-600/95 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom In-Card Title and Plays */}
                  <div className="relative z-10">
                    <h4 className="font-heading font-black text-xs text-white leading-tight truncate group-hover:text-indigo-200 transition-colors drop-shadow-xs">
                      {sg.title}
                    </h4>
                    <p className="text-[10px] text-slate-300 font-medium truncate mt-0.5 flex items-center gap-1">
                      <span>{(sg.totalPlays / 1000).toFixed(1)}k plays</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
