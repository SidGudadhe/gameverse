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
import { PortalShellSkeleton } from '@/components/ui/Skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const navLinks = [
    { href: '/admin', label: 'QA Submissions Queue', icon: ClipboardList, exact: true },
    { href: '/admin/audit-logs', label: 'Security Audit Logs', icon: FileText },
    { href: '/admin/launch-checklist', label: 'Production Launch Checklist', icon: CheckCircle2 },
  ];

  // Allow open access to admin auth pages (login & signup)
  if (pathname.startsWith('/admin/auth')) {
    return <div className="min-h-screen bg-[#090D16]">{children}</div>;
  }

  if (loading) {
    return <PortalShellSkeleton portal="ADMIN" />;
  }

  // Strict role check: only ADMIN, SUPER_ADMIN, or MODERATOR allowed
  const isAuthorized =
    user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR');

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/80 border border-rose-500/30 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5 text-rose-400">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Access Denied (403 Forbidden)
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            The GameVerse Admin Suite is strictly restricted to platform administrators and security auditors.
            {user ? (
              <span className="block mt-2 font-mono text-xs text-rose-300">
                Your current account role is <span className="font-bold underline">{user.role}</span>.
              </span>
            ) : (
              <span className="block mt-2 font-mono text-xs text-gray-400">
                You are currently not logged in.
              </span>
            )}
          </p>

          <div className="flex flex-col gap-3 justify-center">
            <Link href="/admin/auth/login">
              <Button variant="primary" className="w-full">
                Log In as Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16]">
      {/* Admin Sub-Navigation Header */}
      <div className="border-b border-white/10 bg-surface/60 backdrop-blur-md sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider hidden sm:inline">
              Operations Control
            </span>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              {user.role}
            </span>
          </div>

          <nav className="flex items-center gap-1 text-xs font-semibold text-gray-400">
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
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'hover:text-white hover:bg-white/5'
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
