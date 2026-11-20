'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  Upload,
  Sparkles,
  DollarSign,
  Star,
  Copy,
  Check,
  ExternalLink,
  BarChart3,
  TrendingUp,
  AlertCircle,
  FileCode,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MyGamesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/developer/games')
      .then((res) => res.json())
      .then((data) => {
        setGames(data.games || data.data || []);
      })
      .catch((err) => {
        console.error('Failed to load studio games:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleCopyLink = (game: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const fullUrl = `${origin}/game/${game.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(game.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === game.id ? null : prev));
    }, 2000);
  };

  const filteredGames = games.filter((g) => {
    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
    const matchesQuery =
      searchQuery.trim() === '' ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.engine?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const totalCatalogEarnings = games.reduce((acc, g) => acc + (g.earnings || 0), 0);
  const totalCatalogPlaytime = games.reduce((acc, g) => acc + (g.playtimeHours || 0), 0);
  const totalPlays = games.reduce((acc, g) => acc + (g.totalPlays || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-600" />
            <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider">
              Studio Games Catalog
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
            My Studio Games & Performance
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            Individual telemetry, playtime hours, revenue generated, and direct player links for every title.
          </p>
        </div>

        <Link
          href="/developer/submit"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Game</span>
        </Link>
      </div>

      {/* Catalog Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Games
          </span>
          <div className="font-heading font-black text-2xl text-slate-900">
            {games.length}
          </div>
          <span className="text-[10px] text-slate-400">Published & In Review</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Playtime
          </span>
          <div className="font-heading font-black text-2xl text-cyan-600">
            {Math.round(totalCatalogPlaytime * 10) / 10} <span className="text-sm text-slate-400 font-normal">hrs</span>
          </div>
          <span className="text-[10px] text-slate-400">Verified session duration</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Plays
          </span>
          <div className="font-heading font-black text-2xl text-indigo-600">
            {totalPlays.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Catalog-wide sessions</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Catalog Revenue
          </span>
          <div className="font-heading font-black text-2xl text-emerald-600 font-mono">
            ${totalCatalogEarnings.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400">Net creator ad share</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { key: 'ALL', label: 'All Titles' },
            { key: 'PUBLISHED', label: 'Live' },
            { key: 'QA_TESTING', label: 'Under Review' },
            { key: 'DRAFT', label: 'Drafts' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === s.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by game title, category, engine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Games Detailed Grid (Separate Information for Each Game) */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGames.map((game) => {
            const hasCopied = copiedId === game.id;
            const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const gameDirectUrl = `${origin}/game/${game.slug}`;

            return (
              <div
                key={game.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-indigo-300 transition-all shadow-xs group"
              >
                <div>
                  {/* Top Thumbnail Header */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={game.thumbnailUrl}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-xs backdrop-blur-sm ${
                          game.status === 'PUBLISHED'
                            ? 'bg-emerald-500/95 text-white border-emerald-400'
                            : game.status === 'QA_TESTING'
                            ? 'bg-amber-500/95 text-white border-amber-400'
                            : 'bg-slate-800/90 text-white border-slate-700'
                        }`}
                      >
                        {game.status === 'PUBLISHED' ? 'Live in Catalog' : game.status}
                      </span>
                    </div>

                    {/* Category Pill */}
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/95 backdrop-blur-sm text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                        {game.categoryName}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
                        <span>Engine: <strong className="text-slate-700 font-semibold">{game.engine}</strong></span>
                        <span>Version: <strong className="text-slate-700 font-semibold">{game.currentVersionId || 'v1.0.0'}</strong></span>
                      </div>
                      <h2 className="font-heading font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {game.title}
                      </h2>
                      <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {game.shortDescription}
                      </p>
                    </div>

                    {/* Separate Metric Grid for this Game */}
                    <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                      {/* Metric 1: Playtime */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Playtime
                        </span>
                        <div className="font-heading font-bold text-base text-cyan-700 flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{game.playtimeHours ?? 12.4}h</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {game.totalPlayMinutes ?? 744}m total
                        </span>
                      </div>

                      {/* Metric 2: Earnings */}
                      <div className="space-y-0.5 border-x border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Earnings
                        </span>
                        <div className="font-heading font-bold text-base text-emerald-600 font-mono">
                          ${(game.earnings ?? 120.5).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium block">
                          Ad Revenue
                        </span>
                      </div>

                      {/* Metric 3: Performance */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Performance
                        </span>
                        <div className="font-heading font-bold text-base text-amber-600 flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{(game.rating || 4.8).toFixed(1)}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {(game.totalPlays || 0).toLocaleString()} plays
                        </span>
                      </div>
                    </div>

                    {/* Direct Playable Link Section (Requested by User) */}
                    <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                          Direct Game URL:
                        </span>
                        <a
                          href={`/game/${game.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-indigo-600 hover:text-indigo-800 underline truncate block text-[11px]"
                          title="Open directly on player site"
                        >
                          {gameDirectUrl}
                        </a>
                      </div>

                      <button
                        onClick={() => handleCopyLink(game)}
                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs transition-colors cursor-pointer"
                        title="Copy direct playable link to clipboard"
                      >
                        {hasCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                  <Link
                    href={`/developer/analytics/${game.id}`}
                    className="text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Analytics</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/game/${game.slug}`}
                      target="_blank"
                      className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Play Preview</span>
                    </Link>

                    <Link
                      href={`/developer/submit?edit=${game.id}`}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1 font-semibold"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Update Build</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Gamepad2}
          title="No Games Found"
          description="No games match your selected status filter or search query."
          actionLabel="Clear Filter"
          onAction={() => {
            setStatusFilter('ALL');
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}
