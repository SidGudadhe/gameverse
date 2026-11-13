'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Cookie,
  Settings2,
  Check,
  X,
  Lock,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { CookieConsentPreferences } from '@/types';

const STORAGE_KEY = 'gv_consent_preferences';
const CURRENT_VERSION = '2026.1';

export default function CookieConsent() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  // Suppress cookie banner inside sandboxed game runner iframes
  if (pathname.startsWith('/sandbox')) {
    return null;
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CookieConsentPreferences = JSON.parse(stored);
        setAnalyticsEnabled(parsed.analytics);
        setMarketingEnabled(parsed.marketing);
      }
    } catch {
      // Quiet fallback
    }

    // Global listener for "Manage Cookie Preferences" links
    const handleOpenSettings = () => {
      setShowModal(true);
    };
    window.addEventListener('gv-open-cookie-settings', handleOpenSettings);
    return () => window.removeEventListener('gv-open-cookie-settings', handleOpenSettings);
  }, []);

  const savePreferences = (analytics: boolean, marketing: boolean) => {
    const preferences: CookieConsentPreferences = {
      necessary: true,
      analytics,
      marketing,
      updatedAt: new Date().toISOString(),
      version: CURRENT_VERSION,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      window.dispatchEvent(
        new CustomEvent('gv-consent-updated', { detail: preferences })
      );
    } catch (e) {
      console.warn('Failed to persist cookie consent:', e);
    }

    setAnalyticsEnabled(analytics);
    setMarketingEnabled(marketing);
    setIsVisible(false);
    setShowModal(false);
  };

  const handleAcceptAll = () => {
    savePreferences(true, true);
  };

  const handleRejectNonEssential = () => {
    savePreferences(false, false);
  };

  const handleSaveCustom = () => {
    savePreferences(analyticsEnabled, marketingEnabled);
  };

  if (!isVisible && !showModal) return null;

  return (
    <>
      {/* Floating Bottom Banner */}
      {isVisible && !showModal && (
        <aside
          aria-label="Cookie and Privacy Consent Banner"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-50 bg-[#0E131F]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-5 text-gray-200 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-heading font-bold text-white">
                  Privacy & Cookie Preferences
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  GDPR & DPDP
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                GameVerse protects player privacy. We use essential cookies for secure login
                and origin-isolated sandboxing. We request your consent for anonymous gameplay
                analytics and creator ad attribution.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Customize</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRejectNonEssential}
                className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3.5 py-1.5 rounded-xl border border-white/10 transition-colors"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={handleAcceptAll}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-1.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Customization Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0E131F] border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg text-white">
                    Consent & Tracking Preferences
                  </h3>
                  <p className="text-xs text-gray-400">
                    GDPR Article 7 & India DPDP Act 2023 Conformance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Rows */}
            <div className="space-y-4">
              {/* Essential */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Essential & Sandbox Security</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                      Always Active
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Required for HTTP-only session cookies, anti-CSRF tokens, and isolated
                    subdomain iframe sandboxing. Cannot be disabled.
                  </p>
                </div>
              </div>

              {/* Analytics */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-4">
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white">Gameplay & Telemetry Analytics</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Measures 15-second heartbeat intervals, active gameplay minutes, and crash
                    diagnostics. Salted SHA-256 IP anonymization is applied automatically.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={analyticsEnabled}
                    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Marketing & Ads */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-4">
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-white">Monetization & Ad Attribution</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Powers pre-roll, interstitial, and rewarded ad frequency capping, referral
                    bonus crediting, and creator revenue share calculation.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={marketingEnabled}
                    onChange={(e) => setMarketingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={handleRejectNonEssential}
                className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-xl border border-white/10 transition-colors"
              >
                Reject All Optional
              </button>
              <button
                onClick={handleSaveCustom}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
