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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, role, logout } = useAuth();
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
      <header className="sticky top-0 z-50 w-full border-b border-indigo-500/20 bg-[#090D16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Studio Brand */}
          <div className="flex items-center gap-3">
            <Link href="/developer" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-heading font-black text-xl tracking-wider text-white flex items-center gap-1.5">
                  GAMEVERSE <span className="text-cyan-400">STUDIO</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-300 block -mt-1 tracking-widest uppercase">
                  Creator Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Studio Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-surface px-2 py-1 rounded-xl border border-white/5 text-xs font-semibold">
            {devLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                  className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upload Build</span>
                </Link>

                <button
                  onClick={logout}
                  title="Log Out of Studio"
                  className="w-9 h-9 rounded-xl bg-surface hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 border border-white/10 flex items-center justify-center transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/developer/auth/login"
                  className="text-xs font-semibold text-cyan-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
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
      <header className="sticky top-0 z-50 w-full border-b border-rose-500/20 bg-[#090D16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Admin Brand */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-heading font-black text-xl tracking-wider text-white flex items-center gap-1.5">
                  GAMEVERSE <span className="text-rose-400">OPS</span>
                </span>
                <span className="text-[10px] font-mono text-rose-300 block -mt-1 tracking-widest uppercase">
                  Operations & Security
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Admin Links */}
          <nav className="hidden md:flex items-center gap-1 bg-surface px-2 py-1 rounded-xl border border-white/5 text-xs font-semibold">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
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
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>2FA VERIFIED</span>
            </span>

            {isAuthenticated ? (
              <button
                onClick={logout}
                title="Log Out of Admin"
                className="w-9 h-9 rounded-xl bg-surface hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 border border-white/10 flex items-center justify-center transition-colors"
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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090D16]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Gamer Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-heading font-black text-2xl tracking-wider bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                GAME<span className="text-indigo-400">VERSE</span>
              </span>
              <span className="text-[10px] text-gray-400 block -mt-1 tracking-wider uppercase font-semibold">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                pathname === '/'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-indigo-400" />
              <span>All Games</span>
            </Link>

            <Link
              href="/category/cat-arcade"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                pathname.startsWith('/category')
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Categories</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href="/player/favorites"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                    pathname.startsWith('/player/favorites')
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FolderHeart className="w-4 h-4 text-rose-400" />
                  <span>Favorites</span>
                </Link>

                <Link
                  href="/player/history"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                    pathname.startsWith('/player/history')
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <History className="w-4 h-4 text-amber-400" />
                  <span>History</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Global Search Bar (Desktop) */}
        <div className="flex-1 max-w-md hidden sm:block">
          <form action="/search" method="GET" className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="q"
              placeholder="Search 1,000+ free browser games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </form>
        </div>

        {/* Player Profile & Authentication Actions (Strictly Gamer Realm Only) */}
        <div className="flex items-center gap-3">
          {/* Authentication State: Log In vs User Avatar */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <Link
                href="/player/profile"
                className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 border border-white/10 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {user?.name ? user.name[0].toUpperCase() : 'P'}
                </div>
                <div className="hidden xl:block text-left text-xs leading-tight">
                  <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {user?.name || 'Player'}
                  </div>
                  <div className="text-gray-400 text-[10px] font-mono">{role}</div>
                </div>
              </Link>

              <button
                onClick={logout}
                title="Log Out"
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/5 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-xs font-semibold text-gray-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            className="md:hidden w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (PURE PLAYER FUNCTIONS) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#090D16] p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <form action="/search" method="GET" className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="q"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </form>

          <nav aria-label="Mobile navigation" className="space-y-1 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${
                pathname === '/' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-indigo-400" />
              <span>All Games</span>
            </Link>

            <Link
              href="/category/cat-arcade"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/5"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Browse Categories</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/player/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/5"
                >
                  <FolderHeart className="w-4 h-4 text-rose-400" />
                  <span>My Favorites</span>
                </Link>

                <Link
                  href="/player/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/5"
                >
                  <History className="w-4 h-4 text-amber-400" />
                  <span>Play History</span>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-white/5 rounded-xl text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-indigo-600 rounded-xl text-sm font-semibold text-white shadow-lg"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
