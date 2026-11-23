'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  ClipboardList,
  FileText,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { PortalShellSkeleton } from '@/components/ui/Skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, role, loading } = useAuth();

  // Strict role check: only ADMIN, SUPER_ADMIN, or MODERATOR allowed
  const isAuthorized =
    isAuthenticated && (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'MODERATOR');

  // Bina login ke koi bhi admin page open nahi hona chahiye - immediately redirect to admin login
  // NOTE: Defined at top level unconditionally before any return statements
  useEffect(() => {
    if (!loading && !isAuthorized && !pathname.startsWith('/admin/auth')) {
      const redirectUrl = `/admin/auth/login?redirect=${encodeURIComponent(pathname)}`;
      if (typeof window !== 'undefined') {
        window.location.replace(redirectUrl);
      }
    }
  }, [loading, isAuthorized, pathname]);

  const navLinks = [
    { href: '/admin', label: 'QA Submissions Queue', icon: ClipboardList, exact: true },
    { href: '/admin/audit-logs', label: 'Security Audit Logs', icon: FileText },
    { href: '/admin/launch-checklist', label: 'Production Launch Checklist', icon: CheckCircle2 },
  ];

  // Allow open access to admin auth pages (login & signup)
  if (pathname.startsWith('/admin/auth')) {
    return <div className="min-h-screen bg-[#F8FAFC]">{children}</div>;
  }

  if (loading || !isAuthorized) {
    return <PortalShellSkeleton portal="ADMIN" />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Admin Sub-Navigation Header */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-16 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider hidden sm:inline">
              Operations Control
            </span>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              {user?.role || role}
            </span>
          </div>

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
        </div>
      </div>

      <main>{children}</main>
    </div>
  );
}
