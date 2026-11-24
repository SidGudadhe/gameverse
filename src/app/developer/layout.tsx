'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Gamepad2,
  BarChart3,
  UserCheck,
  HelpCircle,
  Plus,
  IndianRupee,
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
import DeveloperLogo from '@/components/ui/DeveloperLogo';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, role, loading } = useAuth();

  // Allow open access to onboarding page so players can apply
  const isOnboardPage = pathname === '/developer/onboard';

  const navLinks = [
    { href: '/developer', label: 'Home', icon: LayoutDashboard, exact: true },
    { href: '/developer/games', label: 'My Games', icon: Gamepad2 },
    { href: '/developer/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/developer/payouts', label: 'Revenue Ledger', icon: IndianRupee },
    { href: '/developer/profile', label: 'Studio Profile', icon: UserCheck },
    { href: '/developer/docs', label: 'Docs & SDK', icon: BookOpen },
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

  // Public Developer Landing and Documentation are viewable before login
  const isPublicDeveloperPage = pathname === '/developer' || pathname === '/developer/docs';

  if (!isAuthenticated) {
    if (isPublicDeveloperPage) {
      return <div className="min-h-screen bg-[#F8FAFC]">{children}</div>;
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl">
          <DeveloperLogo size="xl" className="mx-auto mb-4 shadow-xl shadow-purple-600/30" />
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
          <DeveloperLogo size="xl" className="mx-auto mb-4 shadow-xl shadow-purple-600/30" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Creator Studio Activation Required
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Your current active session is registered as a <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1 py-0.5 rounded">PLAYER</span> ({user?.email || 'Gamer'}).
            To publish HTML5/WebGL games, manage versions, and earn revenue, activate your Creator Studio account or sign in with your Developer credentials.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/developer/auth/login" className="w-full">
              <Button variant="outline" className="w-full">
                Sign In to Studio
              </Button>
            </Link>
            <Link href="/developer/onboard" className="w-full">
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
      <div className="border-b border-slate-200 bg-white sticky top-16 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          <div className="flex-1 overflow-x-auto scrollbar-none py-1">
            <nav className="flex items-center gap-1 text-xs font-semibold text-slate-600 min-w-max">
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
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold shadow-xs'
                        : 'hover:text-slate-900 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <Link
            href="/developer/submit"
            className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95"
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
