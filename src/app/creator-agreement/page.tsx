import React from 'react';
import Link from 'next/link';
import { Sparkles, DollarSign, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CreatorAgreementPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>GameVerse Creator Agreement • Version 2026.1</span>
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
          Independent Creator Publishing Agreement
        </h1>
        <p className="text-gray-400 text-sm">
          Clear, transparent terms governing game distribution, 50%–70% net revenue sharing, double-entry financial accounting, and sandbox compliance.
        </p>
      </div>

      <div className="space-y-8 text-sm text-gray-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono">1</span>
            Creator Onboarding & Build Rights
          </h2>
          <p>
            By uploading HTML5, WebGL, or WebAssembly game archives to GameVerse, the developer (&quot;Creator&quot;) certifies that they own or hold lawful commercial licenses for all submitted code, artwork, audio assets, and fonts. Creators must transparently disclose any AI-generated or AI-assisted content during the submission process.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="text-white">Revenue Sharing & Calculation Engine</span>
          </h2>
          <p>
            Monetization is driven by pre-roll, interstitial, and rewarded ad formats integrated into our non-intrusive player HUD. Revenue is calculated according to the following formulas:
          </p>
          <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 font-mono text-xs space-y-2 text-emerald-300">
            <div>Net Ad Revenue = Gross Revenue − 10% Platform Operating/Network Deduction</div>
            <div>Standard Organic Creator Share = 50% of Net Ad Revenue</div>
            <div>Creator Referral Attributed Share = 70% of Net Ad Revenue (20% bonus incentive)</div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono">3</span>
            Settlement Schedule & Payout Thresholds
          </h2>
          <p>
            Creator earnings follow an immutable double-entry ledger (<code className="text-xs text-indigo-300 font-mono">ESTIMATED → FINALIZED → PROCESSING → PAID</code>).
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-300 pl-2">
            <li><strong className="text-white">Net-30 Settlement:</strong> Ad network earnings from month <em>M</em> are audited and finalized on the 1st of month <em>M+2</em>.</li>
            <li><strong className="text-white">Minimum Payout Threshold:</strong> Payout requests require an accumulated finalized balance of at least <strong>$50.00 USD</strong>.</li>
            <li><strong className="text-white">Supported Disbursement Channels:</strong> Bank Wire (SWIFT/NEFT), UPI, and verified PayPal.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span className="text-white">Sandbox Security & Invalid Traffic (IVT) Zero Tolerance</span>
          </h2>
          <p>
            All submitted archives are automatically scanned for ZIP bombs (10:1 ratio limit, 250 MB ceiling) and prohibited executables (<code className="text-xs bg-black/40 text-amber-300 px-1 py-0.5 rounded font-mono">.exe, .dll, .bat, .sh</code>).
          </p>
          <p>
            Any attempt to bypass iframe sandboxing, inject cross-domain sniffers, simulate automated bot plays, or tamper with the 15-second heartbeat telemetry will result in immediate build suspension, forfeiture of accrued pending revenue, and permanent developer ban.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
        <Link href="/developer" className="text-indigo-400 hover:underline flex items-center gap-1">
          <span>Go to Developer Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link href="/privacy" className="text-indigo-400 hover:underline flex items-center gap-1">
          <span>Privacy & DPDP Compliance</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
