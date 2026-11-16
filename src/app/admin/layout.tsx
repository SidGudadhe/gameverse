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
    return <div className="min-h-screen bg-[#F8FAFC]">{children}</div>;
  }

  if (loading) {
    return <PortalShellSkeleton portal="ADMIN" />;
  }

  // Strict role check: only ADMIN, SUPER_ADMIN, or MODERATOR allowed
  const isAuthorized =
    user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR');

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-5 text-rose-600">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Access Denied (403 Forbidden)
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            The GameVerse Admin Suite is strictly restricted to platform administrators and security auditors.
            {user ? (
              <span className="block mt-2 font-mono text-xs text-rose-600 font-semibold">
                Your current account role is <span className="font-bold underline">{user.role}</span>.
              </span>
            ) : (
              <span className="block mt-2 font-mono text-xs text-slate-500">
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
              {user.role}
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
