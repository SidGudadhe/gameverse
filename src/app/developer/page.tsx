import React from 'react';
import Link from 'next/link';
import { gvDb } from '@/lib/database';
import {
  Plus,
  BarChart3,
  Users,
  DollarSign,
  Clock,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Code,
  FileText,
  Gamepad2,
} from 'lucide-react';

export default function DeveloperDashboard() {
  const games = gvDb.getGames({ developerId: 'usr-dev-1' });
  const earnings = gvDb.getFinancialRecordsByCreator('usr-dev-1');

  const totalPlays = games.reduce((acc, g) => acc + g.totalPlays, 0);
  const totalEarnings = earnings.reduce((acc, e) => acc + e.creatorShare, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              Creator Studio
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mt-1">
            PixelForge Studios
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Manage your published games, monitor player metrics, and track your revenue share.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/developer/payouts"
            className="bg-slate-900 hover:bg-slate-800 text-gray-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all"
          >
            Revenue & Payouts
          </Link>
          <Link
            href="/developer/submit"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Game</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards (Vercel / Stripe Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Total Plays</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-white">
            {totalPlays.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            Active across catalog
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Active Playtime</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-white">
            1,480 hrs
          </div>
          <div className="text-[11px] text-gray-400">
            Avg 4.8 min per session
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Total Earnings (70%)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-emerald-400 font-mono">
            ${totalEarnings.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            Net-30 Monthly Payouts
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Published Titles</span>
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

      {/* Quick Creator Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/developer/submit"
          className="group bg-slate-900/60 hover:bg-slate-800/80 rounded-2xl p-5 border border-white/10 hover:border-indigo-500/40 transition-all flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
              Submit a New Game
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Upload your HTML5 or WebGL ZIP archive and submit for QA testing.
            </p>
          </div>
        </Link>

        <Link
          href="/docs/publishing-guide"
          className="group bg-slate-900/60 hover:bg-slate-800/80 rounded-2xl p-5 border border-white/10 hover:border-cyan-500/40 transition-all flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
              Developer SDK Guide
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Integrate pause/resume, audio muting, and interstitial ads with postMessage.
            </p>
          </div>
        </Link>

        <Link
          href="/developer/payouts"
          className="group bg-slate-900/60 hover:bg-slate-800/80 rounded-2xl p-5 border border-white/10 hover:border-emerald-500/40 transition-all flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
              Earnings & Payouts
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Review monthly statement reconciliation and withdraw available balance ($50 min).
            </p>
          </div>
        </Link>
      </div>

      {/* Games Management Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-white">
              Your Games
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage updates and view status of your uploaded titles
            </p>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {games.length} {games.length === 1 ? 'Game' : 'Games'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-white/5 text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
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
                        className="w-12 h-8 rounded-lg object-cover bg-slate-950 border border-white/10"
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
                        className="bg-slate-800 hover:bg-slate-700 text-gray-200 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                      >
                        Play Preview
                      </Link>
                      <Link
                        href={`/developer/submit?edit=${g.id}`}
                        className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Update
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
