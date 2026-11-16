'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Gamepad2,
  BarChart3,
  Share2,
  UserCheck,
  Settings,
  HelpCircle,
  Plus,
  DollarSign,
  BookOpen,
  Lock,
  ArrowRight,
  Sparkles,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { PortalShellSkeleton } from '@/components/ui/Skeleton';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, role, loading } = useAuth();

  // Allow open access to onboarding page so players can apply
  const isOnboardPage = pathname === '/developer/onboard';

  const navLinks = [
    { href: '/developer', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/developer/games', label: 'My Games', icon: Gamepad2 },
    { href: '/developer/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/developer/referrals', label: 'Referrals & Social', icon: Share2 },
    { href: '/developer/profile', label: 'Studio Profile', icon: UserCheck },
    { href: '/developer/settings', label: 'Settings', icon: Settings },
    { href: '/developer/payouts', label: 'Revenue Ledger', icon: DollarSign },
    { href: '/docs/publishing-guide', label: 'Docs & SDK', icon: BookOpen },
    { href: '/developer/support', label: 'Developer Support', icon: HelpCircle },
  ];

  // Allow open access to developer auth pages (login & signup)
  if (pathname.startsWith('/developer/auth')) {
    return <div className="min-h-screen bg-[#F8FAFC]">{children}</div>;
  }

  if (loading) {
    return <PortalShellSkeleton portal="DEVELOPER" />;
  }

  // If on onboarding page, allow rendering without blocking
  if (isOnboardPage) {
    return <div className="min-h-screen bg-[#F8FAFC]">{children}</div>;
  }

  // Not logged in -> Prompt login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-5 text-indigo-600">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Developer Studio Sign-In Required
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            You must be signed in with a GameVerse Developer account to access the studio, upload game builds, and inspect telemetry analytics.
          </p>
          <div className="flex flex-col gap-3 justify-center">
            <Link href="/developer/auth/login">
              <Button variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-500">
                Sign In to Studio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in as Player (Not a Developer or Admin) -> Gate with Creator Onboarding
  const isAuthorized = role === 'DEVELOPER' || role === 'ADMIN' || role === 'SUPER_ADMIN';

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-5 text-indigo-600">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Creator Onboarding Required
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Your current account is registered as a <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1 py-0.5 rounded">PLAYER</span>.
            To publish HTML5/WebGL games, manage versions, and earn revenue, you must complete the Creator Agreement onboarding.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button variant="outline" className="w-full">
                Keep Playing
              </Button>
            </Link>
            <Link href="/developer/onboard">
              <Button variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-1.5">
                <span>Enroll as Creator</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Studio Sub-Navigation Bar */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-16 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-1 text-xs font-semibold text-slate-600">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                      : 'hover:text-slate-900 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Link
            href="/developer/submit"
            className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Build</span>
          </Link>
        </div>
      </div>

      <div className="py-2">{children}</div>
    </div>
  );
}
