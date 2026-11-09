import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Plus, BarChart3, Users, DollarSign, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

export default function DeveloperDashboard() {
  const games = db.games; // In production: db.getGamesByDeveloper(currentUserId)
  const earnings = db.financialRecords;

  const totalPlays = games.reduce((acc, g) => acc + g.totalPlays, 0);
  const totalEarnings = earnings.reduce((acc, e) => acc + e.creatorShare, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase">
              Creator Studio Hub
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mt-1.5">
            PixelForge Studios Dashboard
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Manage your game builds, monitor engagement telemetry, and track creator earnings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/developer/payouts"
            className="bg-elevated hover:bg-white/10 text-gray-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-colors"
          >
            Earnings & Ledger
          </Link>
          <Link
            href="/developer/submit"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-indigo-400/30 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Build</span>
          </Link>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Total Game Starts</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-white">
            {totalPlays.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            +18.4% from last period
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Active Playtime</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-white">
            1,480 hrs
          </div>
          <div className="text-[11px] text-gray-400">
            Avg 4.8 min / session
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Estimated Share (50%)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-emerald-400 font-mono">
            ${totalEarnings.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            Net ad-split reconciled
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Active Games</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-white">
            {games.length}
          </div>
          <div className="text-[11px] text-gray-400">
            {games.filter((g) => g.status === 'PUBLISHED').length} Live in Catalog
          </div>
        </div>
      </div>

      {/* Games Management Table */}
      <div className="bg-surface rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-white">
            Your Studio Games
          </h2>
          <span className="text-xs text-gray-400">
            Showing {games.length} registered projects
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 border-b border-white/5 text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Game</th>
                <th className="px-5 py-3.5">Engine</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Version</th>
                <th className="px-5 py-3.5">Total Plays</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {games.map((g) => (
                <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={g.thumbnailUrl}
                        alt=""
                        className="w-12 h-8 rounded-lg object-cover bg-black/40 border border-white/10"
                      />
                      <div>
                        <div className="font-semibold text-white text-sm">{g.title}</div>
                        <div className="text-[11px] text-gray-400">{g.categoryName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-300">{g.engine}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        g.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : g.status === 'QA_TESTING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-white/5 text-gray-400 border-white/10'
                      }`}
                    >
                      {g.status === 'PUBLISHED' && <CheckCircle2 className="w-3 h-3" />}
                      {g.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-400">{g.currentVersionId || 'v1.0.0'}</td>
                  <td className="px-5 py-4 font-semibold text-white">
                    {g.totalPlays.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/game/${g.slug}`}
                        className="bg-elevated hover:bg-white/10 text-gray-200 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                      >
                        Preview
                      </Link>
                      <Link
                        href={`/developer/submit?edit=${g.id}`}
                        className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Upload Update
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
