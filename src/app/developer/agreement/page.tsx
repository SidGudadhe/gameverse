import React from 'react';
import Link from 'next/link';
import { Sparkles, IndianRupee, ShieldAlert, CheckCircle2, ArrowRight, FileText, Lock, ShieldCheck } from 'lucide-react';
import DeveloperLogo from '@/components/ui/DeveloperLogo';

export const metadata = {
  title: 'GameVerse Creator Publishing Agreement • Developer Studio',
  description: 'Official independent creator terms governing game distribution, Net-30 revenue settlements, and sandbox compliance.',
};

export default function DeveloperAgreementPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-slate-200 pb-6">
        <DeveloperLogo size="xl" className="shadow-lg shadow-purple-600/30" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full font-mono">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Developer Studio • Creator Publishing Agreement v1.0-2026</span>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
            GameVerse Creator Agreement
          </h1>
          <p className="text-slate-600 text-sm">
            Legally binding terms governing HTML5/WebGL game distribution, double-entry Net Ad Revenue sharing, developer intellectual property protection, and sandbox security rules.
          </p>
        </div>
      </div>

      <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-mono font-bold">1</span>
            Creator Onboarding & Intellectual Property Rights
          </h2>
          <p>
            By uploading HTML5, WebGL, or WebAssembly game archives to the GameVerse Developer Studio, the creator (&quot;Developer&quot;) certifies that they own or hold valid commercial licenses for all submitted code, artwork, audio assets, and fonts.
          </p>
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 text-indigo-900 text-xs leading-relaxed space-y-1">
            <strong>100% IP Ownership:</strong> Creators permanently retain 100% intellectual property ownership of their games, source code, and assets. GameVerse only receives a non-exclusive license to host, display, and monetize the build on the platform.
          </div>
          <p>
            Developers must transparently disclose any AI-generated or AI-assisted content during game build submission (&quot;Human Developed&quot;, &quot;AI Developed&quot;, or &quot;AI + Human Developed&quot;).
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            <span className="text-slate-900">Double-Entry Revenue Sharing Engine</span>
          </h2>
          <p>
            Game monetization is powered by automated pre-roll, interstitial, and rewarded ad placements. Revenue is calculated on a transparent double-entry platform model:
          </p>
          <div className="bg-slate-50 border border-emerald-200 rounded-xl p-4 font-mono text-xs space-y-2 text-emerald-800">
            <div>Net Ad Revenue = Gross Ad Revenue − Operating Bandwidth & Ad Network Deductions</div>
            <div>Standard Organic Creator Share = Competitive Tiered Net Revenue Share</div>
            <div>Creator Referral Attributed Share = Enhanced Referral-Attributed Payout Bonus</div>
          </div>
          <p className="text-xs text-slate-500">
            All ad impressions, eCPMs, and earnings are tracked in real-time in your Studio Analytics and Revenue Ledger.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-mono font-bold">3</span>
            Settlement Schedule & Payout Thresholds
          </h2>
          <p>
            Developer earnings follow an immutable double-entry ledger (<code className="text-xs text-indigo-700 font-mono bg-indigo-50 px-1 py-0.5 rounded border border-indigo-200">ESTIMATED → FINALIZED → PROCESSING → PAID</code>).
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-700 pl-2">
            <li><strong className="text-slate-900">Net-30 Settlement:</strong> Ad network earnings from month <em>M</em> are audited and finalized on the 1st of month <em>M+2</em>.</li>
            <li><strong className="text-slate-900">Minimum Payout Threshold:</strong> Payout requests require an accumulated finalized balance of at least <strong>₹500.00 INR (Indian Rupees)</strong>.</li>
            <li><strong className="text-slate-900">Supported Disbursement Channels:</strong> Direct Bank Wire (NEFT/IMPS) and Instant UPI (VPA).</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span className="text-slate-900">Sandbox Security & Invalid Traffic (IVT) Zero Tolerance</span>
          </h2>
          <p>
            All submitted game builds are automatically scanned for ZIP bombs (10:1 ratio limit, 250 MB ceiling) and prohibited executables (<code className="text-xs bg-slate-100 text-amber-800 px-1 py-0.5 rounded font-mono border border-slate-200">.exe, .dll, .bat, .sh</code>).
          </p>
          <p>
            Any attempt to bypass iframe sandboxing, inject cross-domain sniffers, simulate automated bot plays, or tamper with the 15-second heartbeat telemetry will result in immediate build quarantine, forfeiture of accrued pending revenue, and permanent developer ban.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span className="text-slate-900">Role & Portal Isolation Guarantee</span>
          </h2>
          <p>
            The Developer Studio is an autonomous environment completely isolated from player gaming accounts and platform administration. Even if a user registers both a Player account and a Developer account with the same email, each role operates independently with separate credentials, session tokens, permissions, and ledgers.
          </p>
        </section>
      </div>

      {/* Developer Realm Footer Navigation */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <Link href="/developer" className="text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 font-semibold">
          <span>Go to Developer Studio Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/developer/terms" className="text-slate-600 hover:text-indigo-600 hover:underline">
            Developer Terms
          </Link>
          <Link href="/developer/privacy" className="text-slate-600 hover:text-indigo-600 hover:underline">
            Studio Privacy
          </Link>
          <Link href="/developer/docs" className="text-slate-600 hover:text-indigo-600 hover:underline">
            Documentation & SDK
          </Link>
        </div>
      </div>
    </div>
  );
}
