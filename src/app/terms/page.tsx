import React from 'react';
import Link from 'next/link';
import { Shield, FileCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full font-mono">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Legal Agreement • Version 2026.1</span>
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
          GameVerse Terms of Service
        </h1>
        <p className="text-gray-400 text-sm">
          Last Updated: November 9, 2026. Please review these terms carefully before playing games or submitting content on GameVerse.
        </p>
      </div>

      <div className="space-y-8 text-sm text-gray-300 leading-relaxed">
        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or playing games on the GameVerse platform (the &quot;Platform&quot;), registering an account, or interacting with platform services, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must discontinue using GameVerse immediately.
          </p>
        </section>

        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white">2. Eligibility & Player Accounts</h2>
          <p>
            Guest play is available to all users without registration. To create an account, save favorite games, or submit developer content, you must be at least 13 years old (or the applicable age of digital consent in your jurisdiction). You are responsible for safeguarding your credentials and any activity occurring under your account.
          </p>
        </section>

        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white">3. Acceptable Use & Prohibited Conduct</h2>
          <p>Users agree NOT to engage in any of the following prohibited behaviors:</p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-300 pl-2">
            <li>Attempting to bypass, escape, or disable the iframe sandbox boundaries (<code className="text-xs bg-black/40 text-cyan-300 px-1 py-0.5 rounded font-mono">sandbox=&quot;allow-scripts allow-same-origin allow-pointer-lock&quot;</code>).</li>
            <li>Distributing malicious code, exploits, cross-site scripting (XSS) vectors, or unauthorized network sniffers through submitted game builds.</li>
            <li>Generating invalid traffic (IVT), automated bot clicks, fraudulent playtime heartbeats, or ad spoofing.</li>
            <li>Posting defamatory, infringing, or abusive commentary in public game reviews.</li>
          </ul>
        </section>

        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white">4. Intellectual Property & DMCA Notice</h2>
          <p>
            GameVerse respects intellectual property rights. Creators retain ownership of their original game source code and assets. By uploading a game, creators grant GameVerse a worldwide license to host, display, and stream the build to players.
          </p>
          <p>
            To report suspected copyright infringement, send a formal DMCA takedown notice to{' '}
            <a href="mailto:copyright@gameverse.com" className="text-indigo-400 hover:underline">
              copyright@gameverse.com
            </a>{' '}
            including the URL of the infringing title and proof of rights ownership.
          </p>
        </section>

        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white">5. Disclaimer of Warranties & Limitation of Liability</h2>
          <p>
            The Platform and all games are provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;. GameVerse makes no warranties regarding uninterrupted availability, frame rates, or specific engine compatibility. In no event shall GameVerse be liable for indirect, incidental, or consequential damages resulting from gameplay or data loss.
          </p>
        </section>

        <section className="space-y-3 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h2 className="font-heading font-bold text-lg text-white">6. Governing Law & Dispute Resolution</h2>
          <p>
            These terms are governed by and construed in accordance with the laws of India, including the Information Technology Act 2000 and the Digital Personal Data Protection Act 2023, without regard to conflict of law principles.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
        <Link href="/privacy" className="text-indigo-400 hover:underline flex items-center gap-1">
          <span>Read our Privacy Policy</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link href="/creator-agreement" className="text-indigo-400 hover:underline flex items-center gap-1">
          <span>Creator Agreement</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
