import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { gvDb } from '@/lib/database';
import GameCard from '@/components/GameCard';
import { User, Heart, Gamepad2, Sparkles, ArrowLeft, Calendar, Shield } from 'lucide-react';

interface PlayerProfilePageProps {
  params: {
    username: string;
  };
}

export default function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const cleanUsername = params.username.trim().replace(/^@/, '');
  const profile = gvDb.getProfileByUsername(cleanUsername);

  if (!profile) {
    notFound();
  }

  const favoriteGames = gvDb.getFavoriteGames(profile.userId);
  const playHistory = gvDb.getPlayHistory(profile.userId, 10);
  const totalReviews = gvDb
    .getReviewsByGame('') // to count user reviews
    .filter((r) => r.userId === profile.userId).length;

  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '2026';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Explore</span>
      </Link>

      {/* Hero Profile Card */}
      <div className="bg-[#0B0F19] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          {/* Avatar */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-tr from-indigo-500 via-cyan-400 to-emerald-400 shadow-xl shadow-indigo-600/30 shrink-0">
            <img
              src={
                profile.avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`
              }
              alt={profile.displayName}
              className="w-full h-full rounded-[22px] object-cover bg-black"
            />
          </div>

          {/* Details */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                  {profile.displayName}
                </h1>
                <p className="text-sm font-mono text-cyan-400 font-semibold">
                  @{profile.username}
                </p>
              </div>

              {profile.favoriteGenre && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mx-auto sm:mx-0">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Favorite: {profile.favoriteGenre}</span>
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Badges / Joined */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>Joined {joinDate}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                <span>GameVerse Verified Player</span>
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/60 text-center">
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {favoriteGames.length}
            </div>
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
              Favorite Games
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/60 text-center">
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {playHistory.length}
            </div>
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
              Titles Played
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-950/60 rounded-2xl p-4 border border-slate-800/60 text-center">
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              Active
            </div>
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
              Community Status
            </div>
          </div>
        </div>
      </div>

      {/* Favorite Games Showcase */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-heading font-bold text-xl text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span>Favorite Games Collection</span>
          </h2>
          <span className="text-xs text-gray-400 font-mono">
            {favoriteGames.length} Titles
          </span>
        </div>

        {favoriteGames.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
            <Gamepad2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-400">
              No favorites saved to this profile yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favoriteGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
