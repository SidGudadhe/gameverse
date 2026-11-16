import React from 'react';
import Link from 'next/link';
import { gvDb } from '@/lib/database';
import {
  Plus,
  BarChart3,
  Users,
  DollarSign,
  Wallet,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600" />
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Creator Studio
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
            PixelForge Studios
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            Manage your published games, monitor player metrics, and track your revenue share.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/developer/payouts"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-all"
          >
            Revenue & Payouts
          </Link>
          <Link
            href="/developer/submit"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Game</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards (Vercel / Stripe Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Plays</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-heading font-bold text-2xl text-slate-900">
            {totalPlays.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            Active across catalog
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Playtime</span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="font-heading font-bold text-2xl text-slate-900">
            1,480 hrs
          </div>
          <div className="text-[11px] text-slate-500">
            Avg 4.8 min per session
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Payout Option</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-heading font-bold text-2xl text-emerald-700">
            Active
          </div>
          <div className="text-[11px] text-slate-500">
            Calculation rates coming soon
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Published Titles</span>
            <BarChart3 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-heading font-bold text-2xl text-slate-900">
            {games.length}
          </div>
          <div className="text-[11px] text-slate-500">
            {games.filter((g) => g.status === 'PUBLISHED').length} Live in Catalog
          </div>
        </div>
      </div>

      {/* Quick Creator Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/developer/submit"
          className="group bg-white hover:bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-xs transition-all flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
              Submit a New Game
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Upload your HTML5 or WebGL ZIP archive and submit for QA testing.
            </p>
          </div>
        </Link>

        <Link
          href="/docs/publishing-guide"
          className="group bg-white hover:bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-cyan-300 shadow-xs transition-all flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-cyan-700 transition-colors">
              Developer SDK Guide
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Integrate pause/resume, audio muting, and interstitial ads with postMessage.
            </p>
          </div>
        </Link>

        <Link
          href="/developer/payouts"
          className="group bg-white hover:bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 shadow-xs transition-all flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
              Earnings & Payouts
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Review monthly statement reconciliation and withdraw available balance ($50 min).
            </p>
          </div>
        </Link>
      </div>

      {/* Games Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900">
              Your Games
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage updates and view status of your uploaded titles
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {games.length} {games.length === 1 ? 'Game' : 'Games'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Game</th>
                <th className="px-5 py-3.5">Engine</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Version</th>
                <th className="px-5 py-3.5">Total Plays</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {games.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={g.thumbnailUrl}
                        alt=""
                        className="w-12 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{g.title}</div>
                        <div className="text-[11px] text-slate-500">{g.categoryName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-700">{g.engine}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        g.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : g.status === 'QA_TESTING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {g.status === 'PUBLISHED' && <CheckCircle2 className="w-3 h-3" />}
                      {g.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-500">{g.currentVersionId || 'v1.0.0'}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {g.totalPlays.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/game/${g.slug}`}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                      >
                        Play Preview
                      </Link>
                      <Link
                        href={`/developer/submit?edit=${g.id}`}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
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
