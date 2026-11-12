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
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide Navbar completely inside sandboxed game runner iframes
  if (pathname.startsWith('/sandbox')) {
    return null;
  }

  const isDev = pathname.startsWith('/developer');
  const isAdmin = pathname.startsWith('/admin');
  const isDesign = pathname.startsWith('/design-system');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090D16]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-black text-2xl tracking-wider bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
              GAME<span className="text-indigo-400">VERSE</span>
            </span>
          </Link>

          {/* Desktop Portal Switcher Tabs */}
          <nav
            aria-label="Portals navigation"
            className="hidden md:flex items-center gap-1 bg-surface px-2 py-1 rounded-xl border border-white/5 text-sm font-medium"
          >
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                !isDev && !isAdmin && !isDesign
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Play</span>
            </Link>
            <Link
              href="/developer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                isDev ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Studio Portal</span>
            </Link>
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                isAdmin ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin QA</span>
            </Link>
            <Link
              href="/design-system"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                isDesign ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Design System</span>
            </Link>
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

        {/* Actions & Profile (Desktop) */}
        <div className="flex items-center gap-3">
          <Link
            href="/developer/submit"
            className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-indigo-400/30 shadow-md shadow-indigo-600/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upload Game</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="w-9 h-9 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <div className="font-semibold text-white">NeoGamer</div>
              <div className="text-gray-400 text-[10px]">Verified Player</div>
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            className="md:hidden w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
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
                !isDev && !isAdmin && !isDesign ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Player Website</span>
            </Link>

            <Link
              href="/developer"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${
                isDev ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Developer Studio Hub</span>
            </Link>

            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${
                isAdmin ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin QA Portal</span>
            </Link>

            <Link
              href="/design-system"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${
                isDesign ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>UI/UX Design System</span>
            </Link>

            <Link
              href="/developer/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit Game Build</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
