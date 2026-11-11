'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie } from 'lucide-react';

export default function FooterLegal() {
  const openCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('gv-open-cookie-settings'));
  };

  return (
    <footer className="border-t border-white/10 bg-surface/50 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-white text-base tracking-wider">GAMEVERSE</span>
            <span>© 2026 GameVerse Portal Ltd.</span>
          </div>
          <span className="hidden sm:inline text-white/20">|</span>
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GDPR & DPDP Hardened</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-gray-300 transition-colors">
            Terms of Service
          </Link>
          <Link href="/creator-agreement" className="hover:text-gray-300 transition-colors">
            Creator Agreement
          </Link>
          <button
            onClick={openCookiePreferences}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Cookie Settings</span>
          </button>
          <Link href="/developer" className="hover:text-indigo-400 transition-colors">
            Developer Portal
          </Link>
          <Link href="/admin" className="hover:text-indigo-400 transition-colors">
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
