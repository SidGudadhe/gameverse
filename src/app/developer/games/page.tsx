'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, Search, Plus, CheckCircle2, Clock, Eye, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MyGamesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/developer/games')
      .then((res) => res.json())
      .then((data) => {
        setGames(data.games || []);
      })
      .catch((err) => {
        console.error('Failed to load games:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredGames = games.filter((g) => {
    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
    const matchesQuery =
      searchQuery.trim() === '' ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600" />
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Studio Inventory
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
            My Studio Games
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            Manage your published titles, upload version updates, and view review status.
          </p>
        </div>

        <Link
          href="/developer/submit"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Submit New Game</span>
        </Link>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { key: 'ALL', label: 'All Games' },
            { key: 'PUBLISHED', label: 'Live' },
            { key: 'QA_TESTING', label: 'Under Review' },
            { key: 'DRAFT', label: 'Drafts' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                statusFilter === s.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by game title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Games Inventory Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-indigo-300 transition-all shadow-xs group"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={game.thumbnailUrl}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-xs ${
                        game.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : game.status === 'QA_TESTING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {game.status === 'PUBLISHED' ? 'Live in Catalog' : game.status}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200">
                      {game.categoryName}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500">
                      Version: {game.currentVersionId || 'v1.0.0'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {(game.totalPlays / 1000).toFixed(1)}k plays
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-slate-900 line-clamp-1">
                    {game.title}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                    {game.shortDescription}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  Engine: <span className="text-slate-800 font-medium">{game.engine}</span>
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/game/${game.slug}`}
                    className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </Link>
                  <Link
                    href={`/developer/submit?update=${game.id}`}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Update</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Gamepad2}
          title="No games found"
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
