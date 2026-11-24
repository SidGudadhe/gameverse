import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, ArrowRight, Code, Server, AlertCircle } from 'lucide-react';
import DeveloperLogo from '@/components/ui/DeveloperLogo';

export const metadata = {
  title: 'GameVerse Developer Studio Terms of Service',
  description: 'Terms of Service governing the use of the GameVerse Developer Studio, SDK APIs, and publisher toolchain.',
};

export default function DeveloperTermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-slate-200 pb-6">
        <DeveloperLogo size="xl" className="shadow-lg shadow-purple-600/30" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full font-mono">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Developer Terms of Service • Studio Edition 2026</span>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Developer Studio Terms of Service
          </h1>
          <p className="text-slate-600 text-sm">
            Rules, obligations, and service level standards governing your use of the GameVerse Developer Workspace, build deployment pipeline, telemetry endpoints, and payout requests.
          </p>
        </div>
      </div>

      <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
        {/* Section 1: Studio Access & Accounts */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-mono font-bold">1</span>
            <h2>Studio Account & Workspace Access</h2>
          </div>
          <p>
            Developer accounts are granted solely for the development, publication, versioning, and monetization of web-based games. Developers are responsible for maintaining the confidentiality of their credentials and all activities executed within their workspace.
          </p>
          <p>
            Account credentials may not be shared outside your designated studio team. GameVerse reserves the right to suspend any developer account engaged in malicious activity or credential sharing.
          </p>
        </section>

        {/* Section 2: SDK Protocol & Telemetry Rules */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-mono font-bold">2</span>
            <h2>SDK postMessage Protocol & Telemetry Rules</h2>
          </div>
          <p>
            Games published on GameVerse communicate with the runtime host via the standardized postMessage protocol (<code className="text-xs bg-slate-100 text-indigo-700 px-1 py-0.5 rounded font-mono border border-slate-200">GV_READY, GV_PAUSE, GV_RESUME, GV_WIN, GV_GAME_OVER</code>).
          </p>
          <p>
            Developers agree not to tamper with, simulate, or spoof telemetry signals, ad completion callbacks, or player session pings. Any automated manipulation of game events to inflate gameplay minutes or ad revenue is strictly prohibited.
          </p>
        </section>

        {/* Section 3: Game Build Submission & QA Guidelines */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-mono font-bold">3</span>
            <h2>Build Submission & Automated Quarantine</h2>
          </div>
          <p>
            Every uploaded build undergoes automated security analysis, malware scanning, ZIP bomb inspection, and frame-busting checks. Builds that fail automated verification or violate content guidelines are automatically quarantined.
          </p>
          <p>
            Developers must provide responsive mouse, touch, and keyboard controls and ensure smooth 60fps performance across modern browsers without external asset hotlinking dependencies.
          </p>
        </section>

        {/* Section 4: Revenue & Tax Compliance */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-heading font-bold text-lg">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-mono font-bold">4</span>
            <h2>Disbursements, KYC & Tax Compliance</h2>
          </div>
          <p>
            Payout disbursements are conducted in INR (Indian Rupees) via Direct Bank Transfer or UPI VPA. Developers are solely responsible for all applicable income taxes, GST, and statutory reporting obligations in their local jurisdiction.
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
          <Link href="/developer/agreement" className="text-slate-600 hover:text-indigo-600 hover:underline">
            Creator Agreement
          </Link>
          <Link href="/developer/privacy" className="text-slate-600 hover:text-indigo-600 hover:underline">
            Studio Privacy
          </Link>
          <Link href="/developer/docs" className="text-slate-600 hover:text-indigo-600 hover:underline">
            Docs & SDK
          </Link>
        </div>
      </div>
    </div>
  );
}
