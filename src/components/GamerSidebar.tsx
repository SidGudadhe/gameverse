'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gamepad2,
  Layers,
  FolderHeart,
  History,
  Coins,
  ChevronLeft,
  ChevronRight,
  Swords,
  Puzzle,
  Crown,
  Trophy,
  Sparkles,
  Shield,
  X,
  ExternalLink,
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import GameVerseLogo from '@/components/ui/GameVerseLogo';

export default function GamerSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile, isPlayerPortal } = useSidebar();
  const { isAuthenticated, openAuthModal } = useAuth();

  // Strictly render on Player website
  if (!isPlayerPortal) {
    return null;
  }

  // Primary Page Navigation Links (CrazyGames Signature Pages Navigation)
  const NAV_PAGES = [
    {
      href: '/',
      label: 'All Games',
      shortLabel: 'Games',
      icon: Gamepad2,
      color: 'text-indigo-600',
      activeCheck: pathname === '/',
      requiresAuth: false,
    },
    {
      href: '/category',
      label: 'Categories',
      shortLabel: 'Browse',
      icon: Layers,
      color: 'text-cyan-600',
      activeCheck: pathname.startsWith('/category'),
      requiresAuth: false,
    },
    {
      href: '/player/favorites',
      label: 'Favorites',
      shortLabel: 'Saved',
      icon: FolderHeart,
      color: 'text-rose-500',
      activeCheck: pathname.startsWith('/player/favorites'),
      requiresAuth: true,
    },
    {
      href: '/player/history',
      label: 'Play History',
      shortLabel: 'History',
      icon: History,
      color: 'text-amber-500',
      activeCheck: pathname.startsWith('/player/history'),
      requiresAuth: true,
    },
    {
      href: '/player/payouts',
      label: 'Gamer Payouts',
      shortLabel: 'Payouts',
      icon: Coins,
      color: 'text-emerald-600',
      activeCheck: pathname.startsWith('/player/payouts'),
      requiresAuth: true,
    },
  ];

  // Quick Genre / Tag Shortcuts (CrazyGames Sidebar Genre Navigation)
  const GENRE_TAGS = [
    { name: 'Action', href: '/category/action', icon: Swords, color: 'text-rose-500' },
    { name: 'Arcade', href: '/category/arcade', icon: Gamepad2, color: 'text-indigo-500' },
    { name: 'Puzzle', href: '/category/puzzle', icon: Puzzle, color: 'text-amber-500' },
    { name: 'Strategy', href: '/category/strategy', icon: Crown, color: 'text-emerald-500' },
    { name: 'Sports', href: '/category/sports', icon: Trophy, color: 'text-cyan-500' },
    { name: 'Casual', href: '/category/casual', icon: Sparkles, color: 'text-pink-500' },
    { name: 'RPG', href: '/category/rpg', icon: Shield, color: 'text-purple-500' },
  ];

  const handleNavClick = (e: React.MouseEvent, item: typeof NAV_PAGES[0]) => {
    if (item.requiresAuth && !isAuthenticated) {
      e.preventDefault();
      openAuthModal('LOGIN');
      closeMobile();
    } else {
      closeMobile();
    }
  };

  return (
    <>
      {/* =========================================================================
          1. DESKTOP SIDEBAR (FIXED TO LEFT UNDER TOP NAVBAR)
          ========================================================================= */}
      <aside
        aria-label="Player Side Navigation"
        className={`hidden md:flex fixed left-0 top-16 bottom-0 z-40 bg-white border-r border-slate-200 flex-col transition-all duration-300 select-none shadow-xs ${
          isCollapsed ? 'w-16' : 'w-48'
        }`}
      >
        {/* Navigation Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3 scrollbar-thin">
          {/* Main Pages Navigation Group ("sirf pages vala") */}
          <div className="space-y-1">
            {NAV_PAGES.map((item) => {
              const Icon = item.icon;
              const isActive = item.activeCheck;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  title={item.label}
                  className={`group relative flex items-center rounded-xl transition-all ${
                    isCollapsed
                      ? 'flex-col justify-center py-2 px-1 text-center'
                      : 'gap-2.5 px-2.5 py-2'
                  } ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <Icon
                    className={`shrink-0 transition-transform group-hover:scale-105 ${
                      isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
                    } ${isActive ? 'text-white' : item.color}`}
                  />

                  {isCollapsed ? (
                    <span
                      className={`text-[9px] font-semibold tracking-tight mt-1 truncate max-w-full leading-none ${
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'
                      }`}
                    >
                      {item.shortLabel}
                    </span>
                  ) : (
                    <span className="text-xs truncate flex-1">{item.label}</span>
                  )}

                  {/* Active Indicator Bar on Expanded */}
                  {!isCollapsed && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Categories & Genres (CrazyGames Sidebar Tags) */}
          {!isCollapsed && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
                <span>Genres</span>
                <Link
                  href="/category"
                  className="text-[9px] text-indigo-600 hover:underline normal-case font-medium"
                >
                  View All
                </Link>
              </div>

              {/* 2 Main Categories Quick Filter */}
              <div className="grid grid-cols-2 gap-1 px-1 pb-1">
                <Link
                  href="/category?mainCategory=VEG"
                  className="flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition-colors"
                >
                  <span>🟢</span>
                  <span>Veg</span>
                </Link>
                <Link
                  href="/category?mainCategory=NON_VEG"
                  className="flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 transition-colors"
                >
                  <span>🔴</span>
                  <span>Non-Veg</span>
                </Link>
              </div>

              {GENRE_TAGS.map((genre) => {
                const Icon = genre.icon;
                const isGenreActive = pathname === genre.href;

                return (
                  <Link
                    key={genre.href}
                    href={genre.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors ${
                      isGenreActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${genre.color} shrink-0`} />
                    <span className="truncate">{genre.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Footer: Toggle Collapse / Expand */}
        <div className="p-2 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-full flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-600" />
                <span className="text-[11px] font-medium text-slate-600">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          2. MOBILE SIDEBAR DRAWER (OVERLAY ON PHONES & SMALL TABLETS)
          ========================================================================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Blur */}
          <div
            onClick={closeMobile}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Panel */}
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <GameVerseLogo href="/" size="sm" showText={true} />
              <button
                onClick={closeMobile}
                aria-label="Close menu"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Navigation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="space-y-1">
                {NAV_PAGES.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.activeCheck;

                  return (
                    <Link
                      key={`mob-${item.href}`}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Genre Shortcuts */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                  Top Genres
                </div>

                {/* 2 Main Categories Quick Filter */}
                <div className="grid grid-cols-2 gap-1 px-3 pb-2">
                  <Link
                    href="/category?mainCategory=VEG"
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200"
                  >
                    <span>🟢</span>
                    <span>Veg</span>
                  </Link>
                  <Link
                    href="/category?mainCategory=NON_VEG"
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200"
                  >
                    <span>🔴</span>
                    <span>Non-Veg</span>
                  </Link>
                </div>

                {GENRE_TAGS.map((genre) => {
                  const Icon = genre.icon;
                  return (
                    <Link
                      key={`mob-genre-${genre.href}`}
                      href={genre.href}
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Icon className={`w-3.5 h-3.5 ${genre.color}`} />
                      <span>{genre.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
