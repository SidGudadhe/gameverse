'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Download,
  Trash2,
  Lock,
  Cookie,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Database,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PrivacyPolicyPage() {
  const [downloading, setDownloading] = useState(false);
  const [erasureModal, setErasureModal] = useState(false);
  const [erasureConfirmText, setErasureConfirmText] = useState('');
  const [erasureLoading, setErasureLoading] = useState(false);
  const [erasureStatus, setErasureStatus] = useState<{ success: boolean; message: string } | null>(null);

  const openCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('gv-open-cookie-settings'));
  };

  const handleExportData = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/user/privacy/export');
      if (res.status === 401) {
        alert('Please log in first to export your personal data archive.');
        return;
      }
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to export data');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gameverse-privacy-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleErasureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (erasureConfirmText !== 'DELETE') {
      alert('Please type "DELETE" to confirm.');
      return;
    }

    setErasureLoading(true);
    setErasureStatus(null);
    try {
      const res = await fetch('/api/user/privacy/erasure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erasure request failed');
      }

      setErasureStatus({
        success: true,
        message: data.message || 'Your account data has been successfully anonymized and erased.',
      });

      // Redirect to home after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err: any) {
      setErasureStatus({
        success: false,
        message: err.message,
      });
    } finally {
      setErasureLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero Header */}
      <div className="space-y-4 border-b border-white/10 pb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full font-mono">
          <Shield className="w-3.5 h-3.5" />
          <span>GDPR (EU) & India DPDP Act 2023 Hardened</span>
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
          GameVerse Privacy Policy & Data Rights
        </h1>
        <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
          Effective Date: November 9, 2026 • Version 2026.1. Your privacy and digital rights are
          foundational to GameVerse. Learn how your data is processed, how our isolated sandbox protects
          your system, and how to exercise your rights of access, portability, and erasure.
        </p>
      </div>

      {/* Self-Service Privacy & Data Rights Hub */}
      <div className="bg-slate-900/80 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-xl text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <span>Self-Service Data Subject Rights Center</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Under GDPR Articles 15, 17, 20 and DPDP Section 11/12, you have the right to export or erase your data at any time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCookiePreferences}
              className="bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-colors flex items-center gap-2"
            >
              <Cookie className="w-4 h-4 text-cyan-400" />
              <span>Cookie Preferences</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              disabled={downloading}
              leftIcon={<Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />}
            >
              {downloading ? 'Generating Archive...' : 'Export My Data (JSON)'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setErasureModal(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete My Account
            </Button>
          </div>
        </div>
      </div>

      {/* Main Privacy Policy Sections */}
      <div className="space-y-10 text-sm text-gray-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-mono">1</span>
            Data Controller & DPO Contact
          </h2>
          <p>
            GameVerse Portal Ltd. is the Data Controller responsible for the processing of your personal data.
            For any queries or formal requests regarding your data, you may contact our designated Data Protection Officer (DPO) at{' '}
            <a href="mailto:privacy@gameverse.com" className="text-indigo-400 hover:underline">
              privacy@gameverse.com
            </a>.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-mono">2</span>
            Categories of Data Collected
          </h2>
          <p>We process only minimal, necessary information categorized as follows:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 pl-2">
            <li>
              <strong className="text-white">Account Information:</strong> When you register as a player or creator, we collect your email address, chosen player handle/username, avatar preference, and hashed password credentials.
            </li>
            <li>
              <strong className="text-white">Gameplay & Telemetry:</strong> While playing games, our client dispatches 15-second active play heartbeats to measure session duration and popular titles. Heartbeats are suspended whenever the browser tab is hidden or paused.
            </li>
            <li>
              <strong className="text-white">IP Anonymization:</strong> IP addresses are never stored in raw plaintext in our analytics ledger. Instead, they are transformed into salted SHA-256 cryptographic hashes for fraud prevention and aggregated geo-statistics.
            </li>
            <li>
              <strong className="text-white">Community Contributions:</strong> Star ratings, commentary reviews, and favorite game selections that you voluntarily publish.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-mono">3</span>
            Origin Isolation & Zero Third-Party Cookie Policy in Game Sandboxes
          </h2>
          <p>
            Untrusted user-submitted games run inside a restricted HTML5 iframe sandbox with strict attributes:{' '}
            <code className="text-xs bg-black/50 text-cyan-300 px-2 py-1 rounded font-mono">
              sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            </code>.
          </p>
          <p>
            Games are strictly isolated from the parent GameVerse domain. An embedded game cannot read your session cookies, cannot inspect your localStorage, and cannot navigate your browser window. No third-party tracking cookies or fingerprinting scripts are injected into untrusted game runtimes.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-mono">4</span>
            Data Subject Rights (GDPR & DPDP Act 2023)
          </h2>
          <p>You possess enforceable legal rights regarding your personal information:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="font-bold text-white text-xs block">Right of Access & Portability</span>
              <span className="text-xs text-gray-400">Download your entire profile, telemetry, and activity in machine-readable JSON.</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="font-bold text-white text-xs block">Right to Erasure (To Be Forgotten)</span>
              <span className="text-xs text-gray-400">Instantly anonymize personal identifiers and wipe credentials from our servers.</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="font-bold text-white text-xs block">Right to Rectification</span>
              <span className="text-xs text-gray-400">Update your gamer profile, studio details, or bio at any time from your settings.</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="font-bold text-white text-xs block">Right to Revoke Consent</span>
              <span className="text-xs text-gray-400">Modify your analytics and marketing cookie preferences with one click.</span>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-mono">5</span>
            Data Retention & Cryptographic Audit Trails
          </h2>
          <p>
            Personal data is retained only for as long as your account remains active. When you request erasure, all personal identifiers are replaced with randomized pseudonyms within seconds.
          </p>
          <p>
            Administrative security actions (such as publishing reviews, payouts, and erasure verifications) are recorded in an append-only, SHA-256 tamper-evident cryptographic audit chain that cannot be silently modified.
          </p>
        </section>
      </div>

      {/* Account Erasure Confirmation Modal */}
      {erasureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0E131F] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-heading font-bold text-lg text-white">
                Request Account Erasure
              </h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              This action is <strong className="text-rose-400">permanent and irreversible</strong>. In compliance with GDPR Article 17 and DPDP Section 12, your email, password, profile details, and favorites will be permanently anonymized and purged.
            </p>

            {erasureStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  erasureStatus.success
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {erasureStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{erasureStatus.message}</span>
              </div>
            )}

            {!erasureStatus?.success && (
              <form onSubmit={handleErasureSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Type <code className="text-rose-400 font-mono">DELETE</code> to confirm:
                  </label>
                  <input
                    type="text"
                    value={erasureConfirmText}
                    onChange={(e) => setErasureConfirmText(e.target.value)}
                    placeholder="DELETE"
                    required
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setErasureModal(false)}
                    className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    disabled={erasureConfirmText !== 'DELETE' || erasureLoading}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    {erasureLoading ? 'Erasing...' : 'Confirm Permanent Erasure'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
