'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Clock,
  ShieldCheck,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  Share2,
  ExternalLink,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function GameAnalyticsDeepDivePage({
  params,
}: {
  params: { gameId: string };
}) {
  const { gameId } = params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGameData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/developer/analytics?gameId=${gameId}&timeframe=all`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load game analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGameData();
  }, [gameId]);

  const targetGame = data?.games?.find((g: any) => g.id === gameId) || data?.games?.[0];
  const summary = data?.summary || {
    totalStarts: 0,
    validSessions: 0,
    ivtSessionsCount: 0,
    ivtRate: 0,
    uniquePlayers: 0,
    totalPlayMinutes: 0,
    avgSessionSeconds: 0,
  };
  const devices = data?.devices || {
    desktopPct: 70,
    mobilePct: 25,
    tabletPct: 5,
    desktop: 0,
    mobile: 0,
    tablet: 0,
  };
  const acquisition = data?.acquisition || { referralTokens: [] };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/developer/analytics"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Studio Analytics</span>
        </Link>
      </div>

      {/* Game Header Card */}
      <div className="relative rounded-3xl bg-surface border border-white/10 overflow-hidden p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {targetGame?.thumbnailUrl && (
            <img
              src={targetGame.thumbnailUrl}
              alt={targetGame.title}
              className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-xl"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                Per-Game Deep Dive
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                {targetGame?.status || 'PUBLISHED'}
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mt-1">
              {targetGame?.title || 'Game Analytics'}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5 font-mono">Game ID: {gameId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {targetGame?.slug && (
            <Link
              href={`/game/${targetGame.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 bg-surface hover:bg-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-colors"
            >
              <span>View Public Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
          <a
            href={`/api/developer/analytics/export?format=csv&gameId=${gameId}`}
            download
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-indigo-400/30 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Total Starts</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-white">
            {summary.totalStarts.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400">All-time initiations</div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Active Playtime</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-white">
            {Math.floor(summary.totalPlayMinutes / 60)}h {Math.round(summary.totalPlayMinutes % 60)}m
          </div>
          <div className="text-[11px] text-gray-400 font-medium">
            Avg {Math.round(summary.avgSessionSeconds / 60)}m {summary.avgSessionSeconds % 60}s / session
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Unique Players</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-emerald-400 font-mono">
            {summary.uniquePlayers.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 font-medium">Anonymized Unique Reach</div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>IVT Intercepts</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-heading font-bold text-2xl text-amber-400 font-mono">
            {summary.ivtSessionsCount}
          </div>
          <div className="text-[11px] text-gray-400 font-medium">{summary.ivtRate}% Bot Traffic Filtered</div>
        </div>
      </div>

      {/* Grid: Device Breakdown & Referrals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-surface rounded-3xl p-6 border border-white/10 space-y-6">
          <h2 className="font-heading font-bold text-lg text-white">Device Breakdown</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-200">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span>Desktop Web</span>
                </span>
                <span className="font-mono font-bold text-white">{devices.desktopPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div style={{ width: `${devices.desktopPct}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-200">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Mobile Browser</span>
                </span>
                <span className="font-mono font-bold text-white">{devices.mobilePct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div style={{ width: `${devices.mobilePct}%` }} className="h-full bg-cyan-400 rounded-full" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-200">
                  <Tablet className="w-4 h-4 text-emerald-400" />
                  <span>Tablet Viewports</span>
                </span>
                <span className="font-mono font-bold text-white">{devices.tabletPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div style={{ width: `${devices.tabletPct}%` }} className="h-full bg-emerald-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Creator Referral Attribution */}
        <div className="bg-surface rounded-3xl p-6 border border-white/10 space-y-4">
          <h2 className="font-heading font-bold text-lg text-white">Creator Referral Campaigns</h2>
          <p className="text-gray-400 text-xs">
            Direct referral campaigns generated via opaque link tokens for this title
          </p>

          {acquisition.referralTokens.length === 0 ? (
            <div className="p-4 rounded-xl bg-elevated/40 border border-white/5 text-gray-400 text-xs">
              No referral tokens tracked yet for this game. Copy the referral link from the public game page to start earning referral revenue bonuses.
            </div>
          ) : (
            <div className="space-y-3">
              {acquisition.referralTokens.map((t: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-elevated p-3.5 rounded-xl border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono text-xs text-indigo-400 font-bold">{t.token}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {t.uniquePlayers} unique players · {t.playMinutes} mins played
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {t.clicks} starts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
