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
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Studio Analytics</span>
        </Link>
      </div>

      {/* Game Header Card */}
      <div className="relative rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {targetGame?.thumbnailUrl && (
            <img
              src={targetGame.thumbnailUrl}
              alt={targetGame.title}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                Per-Game Deep Dive
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                {targetGame?.status || 'PUBLISHED'}
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
              {targetGame?.title || 'Game Analytics'}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-mono">Game ID: {gameId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {targetGame?.slug && (
            <Link
              href={`/game/${targetGame.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-colors"
            >
              <span>View Public Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
          <a
            href={`/api/developer/analytics/export?format=csv&gameId=${gameId}`}
            download
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Starts</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-heading font-bold text-2xl text-slate-900">
            {summary.totalStarts.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">All-time initiations</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Playtime</span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="font-heading font-bold text-2xl text-slate-900">
            {Math.floor(summary.totalPlayMinutes / 60)}h {Math.round(summary.totalPlayMinutes % 60)}m
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Avg {Math.round(summary.avgSessionSeconds / 60)}m {summary.avgSessionSeconds % 60}s / session
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Unique Players</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-heading font-bold text-2xl text-emerald-600 font-mono">
            {summary.uniquePlayers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Anonymized Unique Reach</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>IVT Intercepts</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-heading font-bold text-2xl text-amber-600 font-mono">
            {summary.ivtSessionsCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">{summary.ivtRate}% Bot Traffic Filtered</div>
        </div>
      </div>

      {/* Grid: Device Breakdown & Referrals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading font-bold text-lg text-slate-900">Device Breakdown</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span>Desktop Web</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{devices.desktopPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div style={{ width: `${devices.desktopPct}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700">
                  <Smartphone className="w-4 h-4 text-cyan-600" />
                  <span>Mobile Browser</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{devices.mobilePct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div style={{ width: `${devices.mobilePct}%` }} className="h-full bg-cyan-400 rounded-full" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700">
                  <Tablet className="w-4 h-4 text-emerald-600" />
                  <span>Tablet Viewports</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{devices.tabletPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div style={{ width: `${devices.tabletPct}%` }} className="h-full bg-emerald-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Creator Referral Attribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-heading font-bold text-lg text-slate-900">Creator Referral Campaigns</h2>
          <p className="text-slate-500 text-xs">
            Direct referral campaigns generated via opaque link tokens for this title
          </p>

          {acquisition.referralTokens.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
              No referral tokens tracked yet for this game. Copy the referral link from the public game page to start earning referral revenue bonuses.
            </div>
          ) : (
            <div className="space-y-3">
              {acquisition.referralTokens.map((t: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono text-xs text-indigo-600 font-bold">{t.token}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {t.uniquePlayers} unique players · {t.playMinutes} mins played
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700 font-mono">
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
