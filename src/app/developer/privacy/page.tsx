import React from 'react';
import Link from 'next/link';
import { Shield, Lock, FileText, ArrowRight, Database, Server } from 'lucide-react';
import DeveloperLogo from '@/components/ui/DeveloperLogo';

export const metadata = {
  title: 'GameVerse Developer Studio Privacy Policy',
  description: 'Privacy practices and data governance policies for GameVerse Developer Studio accounts and studio telemetry.',
};

export default function DeveloperPrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-slate-200 pb-6">
        <DeveloperLogo size="xl" className="shadow-lg shadow-purple-600/30" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full font-mono">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Developer Studio Privacy • Version 2026.1</span>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Developer Studio Privacy Policy
          </h1>
          <p className="text-slate-600 text-sm">
            How GameVerse collects, stores, protects, and audits information provided by game developers, creators, and studio partners.
          </p>
        </div>
      </div>

      <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
        {/* Section 1: Developer Data Collected */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm font-mono font-bold">1</span>
            <h2>Developer & Studio Data We Process</h2>
          </div>
          <p>
            When registering and operating as a developer on GameVerse, we collect and store:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-700 pl-2">
            <li><strong>Studio Identity:</strong> Studio name, developer handle, contact email, website, and biographical profile.</li>
            <li><strong>Disbursement Details:</strong> Bank account numbers, IFSC codes, UPI Virtual Payment Addresses (VPAs), and transaction history for Net-30 revenue payouts.</li>
            <li><strong>Authentication & Security:</strong> Cryptographically hashed passwords (scrypt/bcrypt), session tokens, IP audit logs, and timestamped agreement signatures.</li>
            <li><strong>Build Artifacts:</strong> Submitted HTML5/WebGL ZIP packages, metadata, version changelogs, and gameplay videos.</li>
          </ul>
        </section>

        {/* Section 2: Studio Telemetry & Analytics */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-mono font-bold">2</span>
            <h2>Studio Telemetry & Aggregated Performance Analytics</h2>
          </div>
          <p>
            To provide developers with real-time analytics, we collect aggregated telemetry metrics from game players:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-700 pl-2">
            <li>Active gameplay seconds, heartbeat pulses, and pause event durations.</li>
            <li>Aggregated ad impression counts, fill rates, eCPM tiers, and estimated revenue shares.</li>
            <li>Device categories (Desktop vs Mobile vs Tablet) and crash/error reports.</li>
          </ul>
          <p className="text-xs text-slate-500">
            Player telemetry delivered to developers is strictly anonymized and aggregated. Personal player identities or individual player PII are never exposed to game developers.
          </p>
        </section>

        {/* Section 3: Data Security & Retention */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-mono font-bold">3</span>
            <h2>Data Protection, Confidentiality & Retention</h2>
          </div>
          <p>
            All financial ledger records, earnings statements, and payout details are stored encrypted at rest with AES-256 and protected behind strict tenant isolation. Developer data is never sold or shared with third-party advertisers.
          </p>
          <p>
            Developers may request export of their studio data or initiate account closure by contacting Developer Support. Tax and audit ledger records are retained in compliance with statutory Indian financial regulations.
          </p>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <Link href="/developer" className="text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 font-semibold">
          <span>Go to Developer Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/developer/terms" className="text-slate-600 hover:text-indigo-600 hover:underline">
            Developer Terms
          </Link>
          <Link href="/developer/agreement" className="text-slate-600 hover:text-indigo-600 hover:underline">
            Creator Agreement
          </Link>
          <Link href="/developer/support" className="text-slate-600 hover:text-indigo-600 hover:underline">
            Developer Support
          </Link>
        </div>
      </div>
    </div>
  );
}
