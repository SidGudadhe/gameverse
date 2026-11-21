'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Cookie } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GameVerseLogo from '@/components/ui/GameVerseLogo';
import DeveloperLogo from '@/components/ui/DeveloperLogo';
import WebAdBanner from '@/components/ads/WebAdBanner';

export default function FooterLegal() {
  const pathname = usePathname();
  const { role } = useAuth();

  // Hide footer inside sandboxed game runner iframes
  if (pathname.startsWith('/sandbox')) {
    return null;
  }

  const isDevPortal = pathname.startsWith('/developer') || pathname === '/creator-agreement';

  const openCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('gv-open-cookie-settings'));
  };

  return (
    <div className="w-full mt-20">
      {/* 7. FOOTER DISPLAY AD (Placement: Page ke bottom mein footer ke upar) */}
      {!isDevPortal && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <WebAdBanner placement="FOOTER_DISPLAY" />
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white py-12 text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {isDevPortal ? (
            <div className="flex items-center gap-2.5">
              <DeveloperLogo size="xs" />
              <span className="font-heading font-black text-slate-900 text-base tracking-wider">
                GAMEVERSE <span className="text-purple-600">STUDIO</span>
              </span>
              <span>© 2026 GameVerse Studio Ltd.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <GameVerseLogo size="xs" />
              <span className="font-heading font-black text-slate-900 text-base tracking-wider">GAMEVERSE</span>
              <span>© 2026 GameVerse Portal Ltd.</span>
            </div>
          )}
          <span className="hidden sm:inline text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-emerald-600 font-mono text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure & Privacy Protected</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link href="/privacy" className="hover:text-slate-900 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-900 transition-colors">
            Terms of Service
          </Link>
          <button
            onClick={openCookiePreferences}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Cookie Settings</span>
          </button>
        </div>
      </div>
    </footer>
  </div>
);
}
