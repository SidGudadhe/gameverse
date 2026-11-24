'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Download,
  Trash2,
  Lock,
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
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full font-mono">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>GDPR (EU) & India DPDP Act 2023 Hardened</span>
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
          GameVerse Privacy Policy & Data Rights
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
          Effective Date: November 9, 2026 • Version 2026.1. Your privacy and digital rights are
          foundational to GameVerse. Learn how your data is processed, how our isolated sandbox protects
          your system, and how to exercise your rights of access, portability, and erasure.
        </p>
      </div>

      {/* Self-Service Privacy & Data Rights Hub */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-xl text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Self-Service Data Subject Rights Center</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Under GDPR Articles 15, 17, 20 and DPDP Section 11/12, you have the right to export or erase your data at any time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
      <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-mono font-bold">1</span>
            Data Controller & DPO Contact
          </h2>
          <p>
            GameVerse Portal Ltd. is the Data Controller responsible for the processing of your personal data.
            For any queries or formal requests regarding your data, you may contact our designated Data Protection Officer (DPO) at{' '}
            <a href="mailto:privacy@gameverse.com" className="text-indigo-600 hover:underline font-medium">
              privacy@gameverse.com
            </a>.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-mono font-bold">2</span>
            Categories of Data Collected
          </h2>
          <p>We process only minimal, necessary information categorized as follows:</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 pl-2">
            <li>
              <strong className="text-slate-900">Account Information:</strong> When you register as a player or creator, we collect your email address, chosen player handle/username, avatar preference, and hashed password credentials.
            </li>
            <li>
              <strong className="text-slate-900">Gameplay & Telemetry:</strong> While playing games, our client dispatches 15-second active play heartbeats to measure session duration and popular titles. Heartbeats are suspended whenever the browser tab is hidden or paused.
            </li>
            <li>
              <strong className="text-slate-900">IP Anonymization:</strong> IP addresses are never stored in raw plaintext in our analytics ledger. Instead, they are transformed into salted SHA-256 cryptographic hashes for fraud prevention and aggregated geo-statistics.
            </li>
            <li>
              <strong className="text-slate-900">Community Contributions:</strong> Star ratings, commentary reviews, and favorite game selections that you voluntarily publish.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-mono font-bold">3</span>
            Origin Isolation & Zero Third-Party Cookie Policy in Game Sandboxes
          </h2>
          <p>
            Untrusted user-submitted games run inside a restricted HTML5 iframe sandbox with strict attributes:{' '}
            <code className="text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono border border-slate-200">
              sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            </code>.
          </p>
          <p>
            Games are strictly isolated from the parent GameVerse domain. An embedded game cannot read your session cookies, cannot inspect your localStorage, and cannot navigate your browser window. No third-party tracking cookies or fingerprinting scripts are injected into untrusted game runtimes.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-mono font-bold">4</span>
            Data Subject Rights (GDPR & DPDP Act 2023)
          </h2>
          <p>You possess enforceable legal rights regarding your personal information:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 text-xs block">Right of Access & Portability</span>
              <span className="text-xs text-slate-600">Download your entire profile, telemetry, and activity in machine-readable JSON.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 text-xs block">Right to Erasure (To Be Forgotten)</span>
              <span className="text-xs text-slate-600">Instantly anonymize personal identifiers and wipe credentials from our servers.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 text-xs block">Right to Rectification</span>
              <span className="text-xs text-slate-600">Update your gamer profile, studio details, or bio at any time from your settings.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 text-xs block">Right to Revoke Consent</span>
              <span className="text-xs text-slate-600">Modify your analytics and marketing cookie preferences with one click.</span>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-mono font-bold">5</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-heading font-bold text-lg text-slate-900">
                Request Account Erasure
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action is <strong className="text-rose-600">permanent and irreversible</strong>. In compliance with GDPR Article 17 and DPDP Section 12, your email, password, profile details, and favorites will be permanently anonymized and purged.
            </p>

            {erasureStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  erasureStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {erasureStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{erasureStatus.message}</span>
              </div>
            )}

            {!erasureStatus?.success && (
              <form onSubmit={handleErasureSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type <code className="text-rose-600 font-mono">DELETE</code> to confirm:
                  </label>
                  <input
                    type="text"
                    value={erasureConfirmText}
                    onChange={(e) => setErasureConfirmText(e.target.value)}
                    placeholder="DELETE"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setErasureModal(false)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-colors"
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
