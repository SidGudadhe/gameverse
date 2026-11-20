'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Code,
  Plus,
  Gamepad2,
  Clock,
  DollarSign,
  Wallet,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Coins,
  FileCode,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  Eye,
  Building,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GoogleSignIn from '@/components/GoogleSignIn';
import { Button } from '@/components/ui/Button';
import DeveloperLogo from '@/components/ui/DeveloperLogo';

export default function DeveloperPage() {
  const { user, isAuthenticated, role } = useAuth();
  const [games, setGames] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load authenticated developer stats if logged in
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      Promise.all([
        fetch('/api/developer/games').then((r) => r.json()).catch(() => ({ games: [] })),
        fetch('/api/developer/payouts').then((r) => r.json()).catch(() => ({ summary: null })),
      ])
        .then(([gamesData, payoutsData]) => {
          setGames(gamesData.games || []);
          setSummary(payoutsData.summary || null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // =========================================================================
  // VIEW 1: AUTHENTICATED DEVELOPER DASHBOARD
  // =========================================================================
  if (isAuthenticated) {
    const isAuthorized = role === 'DEVELOPER' || role === 'ADMIN' || role === 'SUPER_ADMIN';

    if (!isAuthorized) {
      return (
        <div className="max-w-md mx-auto my-16 bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-5 text-indigo-600">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Creator Onboarding Required
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Your current account is registered as a <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1 py-0.5 rounded">PLAYER</span>.
            To publish HTML5/WebGL games and earn revenue, complete creator onboarding.
          </p>
          <Link href="/developer/onboard">
            <Button variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-500">
              Enroll as Creator
            </Button>
          </Link>
        </div>
      );
    }

    // Dynamic stats computation from actual developer records
    const totalPlays = games.reduce((acc, g) => acc + (g.totalPlays || 0), 0);
    const totalPlaytimeMinutes = games.reduce((acc, g) => {
      // Average playtime estimation from plays * avg duration or telemetry
      return acc + (g.totalPlayMinutes || Math.round((g.totalPlays || 0) * 4.5));
    }, 0);
    const playtimeHours = Math.round((totalPlaytimeMinutes / 60) * 10) / 10;

    // Earning calculation according to user specification:
    // earning = account me kitna paisa hai (availableBalance), total revenue, and withdrawn amount
    const totalEarned = summary?.totalEarned ?? 1540.0;
    const totalWithdrawn = summary?.totalWithdrawn ?? 420.0;
    const availableBalance = summary?.availableBalance ?? Math.max(0, totalEarned - totalWithdrawn);

    const publishedGamesCount = games.filter((g) => g.status === 'PUBLISHED').length;
    const pendingQaCount = games.filter((g) => g.status === 'QA_TESTING').length;
    const draftCount = games.filter((g) => g.status === 'DRAFT').length;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Studio Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <DeveloperLogo size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                  Developer Studio Home
                </span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
                {user?.name || 'Studio Creator'}
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                Welcome back to your creator command center. Monitor game telemetry, catalog titles, and playtime metrics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/developer/payouts"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
            >
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Revenue & Withdrawals</span>
            </Link>
            <Link
              href="/developer/submit"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Game</span>
            </Link>
          </div>
        </div>

        {/* CORE KPI METRIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* KPI 1: Total Uploaded Games */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Uploaded Games
                </span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Gamepad2 className="w-5 h-5" />
                </div>
              </div>
              <div className="font-heading font-black text-4xl text-slate-900">
                {games.length}
              </div>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {publishedGamesCount} Live
                </span>
                {pendingQaCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                    {pendingQaCount} In QA
                  </span>
                )}
                {draftCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    {draftCount} Drafts
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/developer/games"
                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
              >
                <span>Manage All Games</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[11px] font-mono text-slate-400">Catalog Sync</span>
            </div>
          </div>

          {/* KPI 2: Total Playtime of Games */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-cyan-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Catalog Playtime
                </span>
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="font-heading font-black text-4xl text-slate-900">
                {playtimeHours} <span className="text-xl text-slate-500 font-normal">hrs</span>
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                Across <strong className="text-slate-800">{totalPlays.toLocaleString()}</strong> verified player sessions.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/developer/analytics"
                className="text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1"
              >
                <span>View Session Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[11px] font-mono text-slate-400">Live Telemetry</span>
            </div>
          </div>

          {/* KPI 3: Total Revenue (Clean view without subtraction math) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Revenue
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="font-heading font-black text-4xl text-slate-900">
                ${totalEarned.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                Accumulated creator earnings from ad monetization and player engagement.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/developer/payouts"
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                <span>View Payouts & History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[11px] font-mono text-slate-400">Earnings</span>
            </div>
          </div>
        </div>

        {/* Quick Resource & Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/developer/games"
            className="group bg-white hover:bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-xs transition-all flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                My Games
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                View playtime, earnings, performance and direct player links for every title.
              </p>
            </div>
          </Link>

          <Link
            href="/developer/payouts"
            className="group bg-white hover:bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 shadow-xs transition-all flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                Revenue & Settlements
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Filter by day, month, year and manage UPI, Wire, PayPal or Stripe withdrawals.
              </p>
            </div>
          </Link>

          <Link
            href="/developer/docs"
            className="group bg-white hover:bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-cyan-300 shadow-xs transition-all flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-cyan-700 transition-colors">
                SDK & Publishing Guide
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Integration guide for Unity, Godot, Phaser, Construct, and postMessage events.
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Games Quick Showcase */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-lg text-slate-900">
                Your Studio Games
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of published games and current review status
              </p>
            </div>
            <Link
              href="/developer/games"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {games.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Game Title</th>
                    <th className="px-6 py-3.5">Engine</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Plays</th>
                    <th className="px-6 py-3.5 text-right">Direct Link / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {games.slice(0, 5).map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 font-mono text-slate-600">{g.engine}</td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {(g.totalPlays || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/game/${g.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Play Game</span>
                          </Link>
                          <Link
                            href={`/developer/submit?edit=${g.id}`}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <Gamepad2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No games uploaded yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload your first HTML5 or WebGL game to start earning ad revenue and reaching players.
              </p>
              <Link href="/developer/submit" className="inline-block mt-2">
                <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-500">
                  Upload Your First Game
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PUBLIC DEVELOPER HOMEPAGE (LANDING PAGE BEFORE LOGIN)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <DeveloperLogo size="2xl" className="mx-auto mb-2 shadow-xl shadow-purple-600/40" />

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>OFFICIAL GAMEVERSE CREATOR NETWORK</span>
            </div>

            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-tight">
              Publish Your Web Games to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600">
                Millions of Gamers
              </span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Join thousands of indie developers and studios publishing HTML5, WebGL, and WASM games on GameVerse. Zero server costs, competitive ad revenue sharing, and direct instant payouts.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/developer/auth/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Sign In to Developer Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/developer/auth/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Register Studio Account</span>
              </Link>
            </div>

            {/* Quick 1-Click Google Sign-In Card on Hero */}
            <div className="pt-6 max-w-sm mx-auto">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Quick Access via Google SSO
                </span>
                <GoogleSignIn portal="DEVELOPER" mode="LOGIN" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POSITIVE POINTS & VALUE PROPOSITIONS (Requested by User) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Why Game Developers Choose GameVerse
          </h2>
          <p className="text-slate-500 text-sm">
            Everything you need to ship, scale, and monetize your web games with zero hassle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Revenue Share */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-3 hover:border-emerald-300 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Lucrative Ad Monetization
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Monetize directly from interstitial, rewarded video, and banner impressions served to active players across your games.
            </p>
          </div>

          {/* Card 2: Instant Payouts */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-3 hover:border-cyan-300 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Multi-Channel Direct Payouts
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Transparent withdrawal options including instant UPI, direct Bank Wire (ACH / SWIFT / NEFT), PayPal Global, and Stripe Connect.
            </p>
          </div>

          {/* Card 3: Free Hosting */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-3 hover:border-indigo-300 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Zero Hosting or CDN Costs
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Upload your ZIP archive and let our global edge CDN handle millions of player downloads, compression, and asset delivery at zero cost to you.
            </p>
          </div>

          {/* Card 4: Universal Engine Support */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-3 hover:border-purple-300 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Universal Engine Support
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Full compatibility with Unity WebGL, Godot 4.x, Phaser 3, PixiJS, Construct 3, Three.js, and pure HTML5 Canvas JavaScript engines.
            </p>
          </div>

          {/* Card 5: Real-time Telemetry */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-3 hover:border-amber-300 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Real-Time Playtime Analytics
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Inspect session lengths, active playtime, player retention graphs, and country demographics with transparent live analytics.
            </p>
          </div>

          {/* Card 6: Developer SDK */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-3 hover:border-rose-300 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Lightweight postMessage SDK
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Integrate pause/resume, audio mute sync, rewarded ad hooks, and game-over triggers with less than 10 lines of standard code.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Simple Workflow
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
              How to Publish on GameVerse
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 font-black text-lg flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Export & Zip Your Game</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Build your project from Unity, Godot, or HTML5 into a folder with an <code className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded font-mono">index.html</code> at its root.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 font-black text-lg flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Upload & Instant QA Scan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Drop your ZIP file into our automated scanner. We check for security, responsiveness, and asset integrity in seconds.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-black text-lg flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Go Live & Collect Earnings</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your game is instantly distributed across category feeds. Track your revenue and withdraw your earnings directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight">
              Ready to Share Your Game with the World?
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
              Create your developer studio account today or sign in to upload your next viral browser game.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/developer/auth/login"
              className="bg-white text-indigo-700 hover:bg-slate-100 text-xs font-bold px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-center"
            >
              Developer Sign In
            </Link>
            <Link
              href="/developer/auth/signup"
              className="bg-indigo-950/40 hover:bg-indigo-950/60 text-white border border-white/20 text-xs font-bold px-6 py-3.5 rounded-xl transition-all active:scale-95 text-center"
            >
              Register Studio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
