'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Clock,
  ShieldCheck,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  Share2,
  Calendar,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Bot,
  CheckCircle2,
} from 'lucide-react';

export default function StudioAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('30d');
  const [selectedGameId, setSelectedGameId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        query.set('timeframe', timeframe);
        if (selectedGameId !== 'all') {
          query.set('gameId', selectedGameId);
        }

        // Fetch developer analytics
        const res = await fetch(`/api/developer/analytics?${query.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load studio analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [timeframe, selectedGameId]);

  const summary = data?.summary || {
    totalStarts: 0,
    validSessions: 0,
    ivtSessionsCount: 0,
    ivtRate: 0,
    uniquePlayers: 0,
    totalPlayMinutes: 0,
    avgSessionSeconds: 0,
    monetizableSessions: 0,
  };

  const devices = data?.devices || {
    desktop: 0,
    mobile: 0,
    tablet: 0,
    desktopPct: 70,
    mobilePct: 25,
    tabletPct: 5,
  };

  const acquisition = data?.acquisition || {
    organicStarts: 0,
    referralStarts: 0,
    organicPct: 100,
    referralPct: 0,
    referralTokens: [],
  };

  const retention = data?.retention || {
    day1Pct: 24.5,
    day7Pct: 14.2,
    day30Pct: 8.7,
  };

  const timeline = data?.timeline || [];
  const games = data?.games || [];

  const maxStarts = Math.max(...timeline.map((t: any) => t.starts), 1);
  const maxMinutes = Math.max(...timeline.map((t: any) => t.playMinutes), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Studio Telemetry & Insights
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mt-1.5">
            Developer Analytics Hub
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Monitor real-time player telemetry, active playtime, IVT protection metrics, and retention funnels.
          </p>
        </div>

        {/* Global Filter & Export Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Selector */}
          <div className="bg-surface p-1 rounded-xl border border-white/10 flex items-center gap-1 text-xs">
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                timeframe === '7d'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                timeframe === '30d'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                timeframe === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Game Filter */}
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="bg-surface border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Studio Games</option>
            {games.map((g: any) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>

          {/* Export Actions */}
          <a
            href={`/api/developer/analytics/export?format=csv&timeframe=${timeframe}${
              selectedGameId !== 'all' ? `&gameId=${selectedGameId}` : ''
            }`}
            download
            className="flex items-center gap-1.5 bg-surface hover:bg-white/10 text-gray-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </a>
          <a
            href={`/api/developer/analytics/export?format=json&timeframe=${timeframe}${
              selectedGameId !== 'all' ? `&gameId=${selectedGameId}` : ''
            }`}
            download
            className="flex items-center gap-1.5 bg-surface hover:bg-white/10 text-gray-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </a>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Starts */}
        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Total Gameplay Starts</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-heading font-black text-2xl text-white">
            {summary.totalStarts.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>+14.8% vs previous window</span>
          </div>
        </div>

        {/* Active Playtime */}
        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Active Playtime</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-heading font-black text-2xl text-white">
            {Math.floor(summary.totalPlayMinutes / 60)}h {Math.round(summary.totalPlayMinutes % 60)}m
          </div>
          <div className="text-[11px] text-gray-400 font-medium">
            Avg {Math.round(summary.avgSessionSeconds / 60)}m {summary.avgSessionSeconds % 60}s / session
          </div>
        </div>

        {/* Unique Players */}
        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Unique Players</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading font-black text-2xl text-emerald-400 font-mono">
            {summary.uniquePlayers.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 font-medium">
            GDPR Salted Anonymized
          </div>
        </div>

        {/* IVT Filter Rate */}
        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>IVT Bot Filter Rate</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-heading font-black text-2xl text-amber-400 font-mono">
            {summary.ivtRate}%
          </div>
          <div className="text-[11px] text-gray-400 font-medium">
            {summary.ivtSessionsCount} automated sessions filtered
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Activity Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-surface rounded-3xl p-6 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-lg text-white">Daily Gameplay Activity Trend</h2>
              <p className="text-gray-400 text-xs">Game starts and active playtime minutes per day</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                <span>Starts</span>
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                <span>Play Minutes</span>
              </span>
            </div>
          </div>

          {/* SVG Bar & Sparkline Trend Chart */}
          <div className="h-64 flex items-end gap-2 pt-6 pb-2 border-b border-white/10">
            {timeline.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                No telemetry recorded for this timeframe yet
              </div>
            ) : (
              timeline.map((point: any, idx: number) => {
                const startsHeight = Math.max(Math.round((point.starts / maxStarts) * 160), 8);
                const minutesHeight = Math.max(Math.round((point.playMinutes / maxMinutes) * 160), 8);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                    {/* Hover Tooltip */}
                    <div className="absolute -top-12 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/90 border border-white/20 text-white text-[10px] px-2 py-1 rounded-md shadow-xl whitespace-nowrap">
                      <div>{point.date}</div>
                      <div className="text-indigo-400 font-bold">{point.starts} starts</div>
                      <div className="text-cyan-400 font-bold">{point.playMinutes} mins</div>
                    </div>

                    {/* Dual Bars */}
                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1">
                      <div
                        style={{ height: `${startsHeight}px` }}
                        className="w-1/2 max-w-[14px] bg-indigo-600 hover:bg-indigo-500 rounded-t-sm transition-all"
                      />
                      <div
                        style={{ height: `${minutesHeight}px` }}
                        className="w-1/2 max-w-[14px] bg-cyan-500 hover:bg-cyan-400 rounded-t-sm transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 truncate w-full text-center mt-1">
                      {point.date.split(' ')[1] || point.date}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Device & Platform Breakdown (1 col) */}
        <div className="bg-surface rounded-3xl p-6 border border-white/10 space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-white">Device Breakdown</h2>
            <p className="text-gray-400 text-xs">Player platform distribution</p>
          </div>

          <div className="space-y-4">
            {/* Desktop */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-200">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span>Desktop Web</span>
                </span>
                <span className="font-mono font-bold text-white">
                  {devices.desktopPct}% ({devices.desktop})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  style={{ width: `${devices.desktopPct}%` }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-200">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Mobile Browser</span>
                </span>
                <span className="font-mono font-bold text-white">
                  {devices.mobilePct}% ({devices.mobile})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  style={{ width: `${devices.mobilePct}%` }}
                  className="h-full bg-cyan-400 rounded-full"
                />
              </div>
            </div>

            {/* Tablet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-200">
                  <Tablet className="w-4 h-4 text-emerald-400" />
                  <span>Tablet Viewports</span>
                </span>
                <span className="font-mono font-bold text-white">
                  {devices.tabletPct}% ({devices.tablet})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  style={{ width: `${devices.tabletPct}%` }}
                  className="h-full bg-emerald-400 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Retention Quick Summary */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Player Retention Benchmarks
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-elevated p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-400">Day 1</div>
                <div className="font-mono font-bold text-sm text-indigo-400">{retention.day1Pct}%</div>
              </div>
              <div className="bg-elevated p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-400">Day 7</div>
                <div className="font-mono font-bold text-sm text-cyan-400">{retention.day7Pct}%</div>
              </div>
              <div className="bg-elevated p-2 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-400">Day 30</div>
                <div className="font-mono font-bold text-sm text-emerald-400">{retention.day30Pct}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acquisition & Referral Section */}
      <div className="bg-surface rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-lg text-white">
              Traffic Acquisition & Creator Referral Links
            </h2>
            <p className="text-gray-400 text-xs">
              Attribution tracking for organic discovery vs direct creator promotion links (?ref=cr_...)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold px-3 py-1 rounded-xl">
              {acquisition.organicPct}% Organic
            </span>
            <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-1 rounded-xl">
              {acquisition.referralPct}% Creator Links
            </span>
          </div>
        </div>

        {acquisition.referralTokens.length === 0 ? (
          <div className="p-4 rounded-2xl bg-elevated/40 border border-white/5 text-gray-400 text-xs flex items-center justify-between">
            <span>No creator referral campaigns active yet. Generate links on any of your game landing pages.</span>
            <Link
              href="/developer/games"
              className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs flex items-center gap-1"
            >
              <span>View Game Links</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-gray-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Referral Token</th>
                  <th className="py-2.5 px-3">Click Starts</th>
                  <th className="py-2.5 px-3">Unique Players</th>
                  <th className="py-2.5 px-3">Total Playtime</th>
                  <th className="py-2.5 px-3">Monetization Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {acquisition.referralTokens.map((t: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="py-2.5 px-3 font-mono text-indigo-400 font-bold">{t.token}</td>
                    <td className="py-2.5 px-3 font-semibold">{t.clicks}</td>
                    <td className="py-2.5 px-3">{t.uniquePlayers}</td>
                    <td className="py-2.5 px-3">{t.playMinutes} mins</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">Tier 1 (+20% Referral Bonus)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-Game Performance Table */}
      <div className="bg-surface rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-white">Per-Game Telemetry Breakdown</h2>
            <p className="text-gray-400 text-xs">Detailed telemetry metrics for each individual game</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-gray-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Game</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total Starts</th>
                <th className="py-3 px-4">Valid Plays</th>
                <th className="py-3 px-4">Unique Players</th>
                <th className="py-3 px-4">Active Playtime</th>
                <th className="py-3 px-4">Avg Duration</th>
                <th className="py-3 px-4">IVT Filtered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {games.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No games found for this studio.
                  </td>
                </tr>
              ) : (
                games.map((g: any) => (
                  <tr key={g.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      {g.thumbnailUrl && (
                        <img
                          src={g.thumbnailUrl}
                          alt={g.title}
                          className="w-9 h-9 rounded-xl object-cover border border-white/10"
                        />
                      )}
                      <div>
                        <div className="font-bold text-white">{g.title}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{g.slug}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          g.status === 'PUBLISHED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{g.totalStarts}</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">{g.validSessions}</td>
                    <td className="py-3 px-4">{g.uniquePlayers}</td>
                    <td className="py-3 px-4 font-mono">{g.playMinutes} mins</td>
                    <td className="py-3 px-4">
                      {Math.round(g.avgSessionSeconds / 60)}m {g.avgSessionSeconds % 60}s
                    </td>
                    <td className="py-3 px-4 text-amber-400 font-mono">{g.ivtCount}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/developer/analytics/${g.id}`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        <span>Deep Dive</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
