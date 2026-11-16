'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gamepad2,
  Code,
  ShieldCheck,
  Search,
  Sparkles,
  User as UserIcon,
  Menu,
  X,
  Palette,
  ExternalLink,
  LogOut,
  FolderHeart,
  History,
  LayoutDashboard,
  BarChart3,
  DollarSign,
  ClipboardList,
  FileText,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  Coins,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, role, logout, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Hide Navbar completely inside sandboxed game runner iframes
  if (pathname.startsWith('/sandbox')) {
    return null;
  }

  const isDevPortal = pathname.startsWith('/developer');
  const isAdminPortal = pathname.startsWith('/admin');
  const isDesignPortal = pathname.startsWith('/design-system');

  // =========================================================================
  // PORTAL A: DEVELOPER STUDIO WEBSITE NAVBAR
  // =========================================================================
  if (isDevPortal) {
    const devLinks = [
      { href: '/developer', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/developer/games', label: 'My Games', icon: Gamepad2 },
      { href: '/developer/submit', label: 'Submit Game', icon: Sparkles },
      { href: '/developer/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/developer/payouts', label: 'Payouts', icon: DollarSign },
      { href: '/docs/publishing-guide', label: 'SDK Docs', icon: Code },
    ];

    return (
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Studio Brand */}
          <div className="flex items-center gap-3">
            <Link href="/developer" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-600/20 group-hover:scale-105 transition-transform">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-heading font-black text-xl tracking-wider text-slate-900 flex items-center gap-1.5">
                  GAMEVERSE <span className="text-cyan-600">STUDIO</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-700 block -mt-1 tracking-widest uppercase font-semibold">
                  Creator Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Studio Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {devLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white text-cyan-700 shadow-xs border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Studio Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/developer/submit"
                  className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upload Build</span>
                </Link>

                <button
                  onClick={logout}
                  title="Log Out of Studio"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/developer/auth/login"
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Studio Sign In
                </Link>
                <Link
                  href="/developer/auth/signup"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
                >
                  Join as Creator
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  // =========================================================================
  // PORTAL B: ADMIN & QA OPERATIONS WEBSITE NAVBAR
  // =========================================================================
  if (isAdminPortal) {
    const adminLinks = [
      { href: '/admin', label: 'QA Submissions', icon: ClipboardList, exact: true },
      { href: '/admin/audit-logs', label: 'Security Audit Logs', icon: FileText },
      { href: '/admin/launch-checklist', label: 'Launch Checklist', icon: CheckCircle2 },
    ];

    return (
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Admin Brand */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-md shadow-rose-600/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-heading font-black text-xl tracking-wider text-slate-900 flex items-center gap-1.5">
                  GAMEVERSE <span className="text-rose-600">OPS</span>
                </span>
                <span className="text-[10px] font-mono text-rose-700 block -mt-1 tracking-widest uppercase font-semibold">
                  Operations & Security
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Admin Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white text-rose-700 shadow-xs border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Admin Right Actions */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>2FA VERIFIED</span>
            </span>

            {isAuthenticated ? (
              <button
                onClick={logout}
                title="Log Out of Admin"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/admin/auth/login"
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
              >
                Staff Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }

  // =========================================================================
  // PORTAL C: PLAYER GAMING WEBSITE NAVBAR (PURE USER-FACING)
  // =========================================================================
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Gamer Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-heading font-black text-2xl tracking-wider text-slate-900">
                GAME<span className="text-indigo-600">VERSE</span>
              </span>
              <span className="text-[10px] text-slate-500 block -mt-1 tracking-wider uppercase font-semibold">
                Instant Browser Games
              </span>
            </div>
          </Link>

          {/* Desktop Player Navigation Links (ONLY GAMER FEATURES) */}
          <nav
            aria-label="Player navigation"
            className="hidden md:flex items-center gap-1 text-sm font-medium"
          >
            <Link
              href="/"
              prefetch={true}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                pathname === '/'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Gamepad2 className={`w-4 h-4 ${pathname === '/' ? 'text-white' : 'text-indigo-600'}`} />
              <span>All Games</span>
            </Link>

            <Link
              href="/category"
              prefetch={true}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                pathname.startsWith('/category')
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className={`w-4 h-4 ${pathname.startsWith('/category') ? 'text-white' : 'text-cyan-600'}`} />
              <span>Categories</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href="/player/favorites"
                  prefetch={true}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                    pathname.startsWith('/player/favorites')
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FolderHeart className={`w-4 h-4 ${pathname.startsWith('/player/favorites') ? 'text-white' : 'text-rose-500'}`} />
                  <span>Favorites</span>
                </Link>

                <Link
                  href="/player/history"
                  prefetch={true}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                    pathname.startsWith('/player/history')
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <History className={`w-4 h-4 ${pathname.startsWith('/player/history') ? 'text-white' : 'text-amber-500'}`} />
                  <span>History</span>
                </Link>

                <Link
                  href="/player/payouts"
                  prefetch={true}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                    pathname.startsWith('/player/payouts')
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Coins className={`w-4 h-4 ${pathname.startsWith('/player/payouts') ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Payouts</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Global Search Bar (Desktop) */}
        <div className="flex-1 max-w-md hidden sm:block">
          <form action="/search" method="GET" className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="q"
              placeholder="Search 1,000+ free browser games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-2xs"
            />
          </form>
        </div>

        {/* Player Profile & Authentication Actions (Strictly Gamer Realm Only) */}
        <div className="flex items-center gap-3">
          {/* Authentication State: Log In vs User Avatar */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                href="/player/profile"
                className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {user?.name ? user.name[0].toUpperCase() : 'P'}
                </div>
                <div className="hidden xl:block text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {user?.name || 'Player'}
                  </div>
                  <div className="text-slate-500 text-[10px] font-mono">{role}</div>
                </div>
              </Link>

              <button
                onClick={logout}
                title="Log Out"
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal('LOGIN')}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Log in</span>
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('SIGNUP')}
                className="bg-gradient-to-r from-[#6A38EB] to-[#8B5CF6] hover:from-[#5b2bd9] hover:to-[#7c3aed] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-purple-600/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Join Free</span>
              </button>
            </div>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">
          <form action="/search" method="GET" className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="q"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </form>

          <nav aria-label="Mobile navigation" className="space-y-1 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${
                pathname === '/' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-indigo-500" />
              <span>All Games</span>
            </Link>

            <Link
              href="/category"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>Browse Categories</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/player/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100"
                >
                  <FolderHeart className="w-4 h-4 text-rose-500" />
                  <span>My Favorites</span>
                </Link>

                <Link
                  href="/player/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100"
                >
                  <History className="w-4 h-4 text-amber-500" />
                  <span>Play History</span>
                </Link>

                <Link
                  href="/player/payouts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100"
                >
                  <Coins className="w-4 h-4 text-emerald-500" />
                  <span>Gamer Payouts</span>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('LOGIN');
                  }}
                  className="w-full text-center py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('SIGNUP');
                  }}
                  className="w-full text-center py-2.5 bg-gradient-to-r from-[#6A38EB] to-[#8B5CF6] hover:from-[#5b2bd9] hover:to-[#7c3aed] rounded-xl text-sm font-bold text-white shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                >
                  Join Free
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
