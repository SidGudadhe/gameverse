'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Gamepad2, Search, Filter, Plus, CheckCircle2, Clock, AlertTriangle, Eye, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MyGamesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Default to studio games
  const allGames = db.games; // In production: fetched from /api/developer/games

  const filteredGames = allGames.filter((g) => {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
            My Studio Games
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Manage your submitted titles, inspect version histories, and track catalog publishing states.
          </p>
        </div>

        <Link href="/developer/submit">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Submit New Build
          </Button>
        </Link>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-2xl border border-white/10">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {['ALL', 'PUBLISHED', 'QA_TESTING', 'DRAFT'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {s === 'ALL' ? 'All Games' : s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Games Inventory Grid / Table */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="bg-surface rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between hover:border-indigo-500/30 transition-all shadow-xl group"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                  <img
                    src={game.thumbnailUrl}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <Badge
                      variant={
                        game.status === 'PUBLISHED'
                          ? 'success'
                          : game.status === 'QA_TESTING'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {game.status}
                    </Badge>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant="cyan">{game.engine.split(' ')[0]}</Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      {game.categoryName}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">
                      {game.currentVersionId || 'v1.0.0'}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-white line-clamp-1">
                    {game.title}
                  </h3>
                  <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                    {game.shortDescription}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="text-gray-400">
                  <span className="font-semibold text-white">{(game.totalPlays / 1000).toFixed(1)}k</span> plays
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/game/${game.slug}`}>
                    <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                      View
                    </Button>
                  </Link>
                  <Link href={`/developer/submit?update=${game.id}`}>
                    <Button variant="primary" size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />}>
                      Update
                    </Button>
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
