'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import GoogleSignIn from '@/components/GoogleSignIn';
import DeveloperLogo from '@/components/ui/DeveloperLogo';

export default function DeveloperSignupPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [engine, setEngine] = useState('Unity WebGL');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showFullAgreement, setShowFullAgreement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      setError('You must accept the GameVerse Creator Terms & Monetization Agreement before you can create an account and proceed.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          portal: 'DEVELOPER',
          role: 'DEVELOPER',
          termsAgreed: true,
          agreementVersion: 'v1.0-2026',
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Developer studio registration failed.');
        return;
      }

      if (data.user) {
        setSession(data.user);
      }

      router.refresh();
      router.push('/developer');

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/developer/auth')) {
          window.location.href = '/developer';
        }
      }, 250);
    } catch {
      setLoading(false);
      setError('Network connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F8FAFC]">
      <div className="w-full max-w-lg space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="text-center space-y-2">
          <DeveloperLogo size="xl" className="mx-auto mb-2" />
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Badge variant="cyan">DEVELOPER STUDIO PORTAL</Badge>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
            Register Game Studio
          </h1>
          <p className="text-xs text-slate-500">
            Join the GameVerse Creator Network. Upload HTML5/WebGL games, monetize with automated ad payouts, and manage releases.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google SSO Registration for Developers */}
        <div className="space-y-3">
          <GoogleSignIn
            portal="DEVELOPER"
            mode="SIGNUP"
            onSuccess={() => {
              router.push('/developer');
            }}
          />

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider relative z-10">
              Or register with Email & Password
            </span>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label="Studio or Creator Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. PixelForge Studios"
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Studio Business Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="creator@pixelforge.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Primary Game Engine
            </label>
            <div className="relative">
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors shadow-xs"
              >
                <option value="Unity WebGL" className="bg-white text-slate-800">Unity WebGL (Wasm)</option>
                <option value="Godot Engine" className="bg-white text-slate-800">Godot 4.x Web</option>
                <option value="Phaser 3" className="bg-white text-slate-800">Phaser 3 / PixiJS</option>
                <option value="Custom HTML5" className="bg-white text-slate-800">Custom HTML5 / Vanilla Canvas</option>
                <option value="PlayCanvas" className="bg-white text-slate-800">PlayCanvas</option>
              </select>
            </div>
          </div>

          <Input
            label="Studio Password (min 8 characters)"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            helperText="Include letters and numbers for secure studio access."
          />

          {/* ================= MANDATORY CREATOR AGREEMENT & PLATFORM POLICY SECTION ================= */}
          <div className="pt-2 space-y-3">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Creator Agreement & Monetization Policy
                    </h4>
                    <span className="text-[10px] text-indigo-700 font-semibold font-mono">
                      Version v1.0-2026 • Mandatory Agreement
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullAgreement(!showFullAgreement)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>{showFullAgreement ? 'Hide' : 'Review'}</span>
                  {showFullAgreement ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Agreement Key Terms Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="flex items-start gap-1.5 p-2 rounded-xl bg-white/80 border border-indigo-100">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">70% Net Revenue Share</span>
                    <span className="text-slate-500 text-[10px]">Instant Bank & UPI payouts with ₹500 threshold.</span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 p-2 rounded-xl bg-white/80 border border-indigo-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Sandbox Safety</span>
                    <span className="text-slate-500 text-[10px]">Strict iframe isolation; zero tracking or harmful code.</span>
                  </div>
                </div>
              </div>

              {/* Full Scrollable Agreement Text (Expandable) */}
              {showFullAgreement && (
                <div className="max-h-48 overflow-y-auto bg-white p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-2 font-mono leading-relaxed mt-2 shadow-inner">
                  <p className="font-bold text-slate-900">
                    1. REVENUE SHARE & MONETIZATION
                  </p>
                  <p>
                    Net game revenue is distributed via automated double-entry ledger calculation (Gross Ad Revenue minus verified network processing deductions). Minimum payout threshold is ₹500 INR via direct Bank/UPI transfer.
                  </p>
                  <p className="font-bold text-slate-900 pt-1">
                    2. INTELLECTUAL PROPERTY & AI DISCLOSURE
                  </p>
                  <p>
                    Creators retain 100% intellectual property ownership of all submitted game builds, graphics, and code. Creators agree to truthfully disclose any AI-generated or AI-assisted content during game build submission.
                  </p>
                  <p className="font-bold text-slate-900 pt-1">
                    3. TECHNICAL INTEGRITY & SANDBOX POLICY
                  </p>
                  <p>
                    All builds must be self-contained HTML5/WebGL packages. Malicious scripts, cryptocurrency miners, external redirection, or unauthorized data collection result in immediate quarantine and account termination.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/creator-agreement"
                      target="_blank"
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-sans font-semibold text-[11px]"
                    >
                      <span>Read Full Legal Document in New Window</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Mandatory Checkbox */}
              <div className="pt-2 border-t border-indigo-100">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-800 leading-relaxed font-medium">
                    I have read, understood, and accept the{' '}
                    <span className="font-bold text-indigo-700">GameVerse Creator Agreement (v1.0-2026)</span> and{' '}
                    <span className="font-bold text-indigo-700">Platform Policies</span>. I agree that this acceptance will be cryptographically timestamped and bound to my account IP address.
                  </span>
                </label>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-indigo-600 hover:bg-indigo-500 shadow-md font-bold text-sm py-3"
            isLoading={loading}
            disabled={!termsAgreed}
          >
            {termsAgreed ? 'Agree & Create Developer Account' : 'Agree to Terms to Continue'}
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-1">
          Already registered as a Developer?{' '}
          <Link href="/developer/auth/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Studio Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
