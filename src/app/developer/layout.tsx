'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Gamepad2,
  BarChart3,
  UserCheck,
  Settings,
  HelpCircle,
  Plus,
  DollarSign,
} from 'lucide-react';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/developer', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/developer/games', label: 'My Games', icon: Gamepad2 },
    { href: '/developer/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/developer/profile', label: 'Studio Profile', icon: UserCheck },
    { href: '/developer/settings', label: 'Settings', icon: Settings },
    { href: '/developer/payouts', label: 'Revenue Ledger', icon: DollarSign },
    { href: '/developer/support', label: 'Developer Support', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-[#090D16]">
      {/* Studio Sub-Navigation Bar */}
      <div className="border-b border-white/10 bg-surface/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
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

          <Link
            href="/developer/submit"
            className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-400/30 shadow-sm"
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
