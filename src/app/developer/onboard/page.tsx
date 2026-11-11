'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck, FileText, ArrowRight, Building, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function DeveloperOnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [studioName, setStudioName] = useState('PixelForge Studios');
  const [website, setWebsite] = useState('https://pixelforge.games');
  const [bio, setBio] = useState('Independent game studio specializing in retro synthwave arcade and puzzle games.');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFinishOnboarding = async () => {
    if (!agreedToTerms) {
      setError('You must accept the Creator Agreement before completing onboarding.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/developer/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementVersion: 'v1.0-2026',
          studioName,
          website,
          bio,
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setError(data.error || 'Failed to complete onboarding.');
        return;
      }

      setStep(3);
    } catch {
      setSubmitting(false);
      setError('Network connection error.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Wizard Progress Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-600/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
            Studio Onboarding
          </span>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mt-1">
            Creator Activation
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              step >= 1
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-surface border-white/10 text-gray-500'
            }`}
          >
            1
          </div>
          <div className="w-8 h-0.5 bg-white/10" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              step >= 2
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-surface border-white/10 text-gray-500'
            }`}
          >
            2
          </div>
          <div className="w-8 h-0.5 bg-white/10" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              step === 3
                ? 'bg-emerald-600 border-emerald-400 text-white'
                : 'bg-surface border-white/10 text-gray-500'
            }`}
          >
            <Check className="w-4 h-4" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* STEP 1: STUDIO DETAILS */}
      {step === 1 && (
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div>
            <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" />
              <span>Step 1: Studio & Creator Profile</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Tell the GameVerse community and players about your game studio.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Studio / Brand Name"
              required
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="e.g. PixelForge Studios"
            />

            <Input
              label="Official Website or Portfolio URL"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourstudio.com"
              leftIcon={<Globe className="w-4 h-4" />}
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-gray-300">
                Studio Bio & Description
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of your games and development background..."
                className="w-full bg-black/40 text-gray-100 placeholder-gray-500 text-xs sm:text-sm rounded-xl p-3 border border-white/10 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <Button
              variant="primary"
              onClick={() => {
                if (!studioName.trim()) {
                  setError('Studio name is required.');
                  return;
                }
                setError('');
                setStep(2);
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Legal Agreement
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: CREATOR AGREEMENT */}
      {step === 2 && (
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div>
            <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Step 2: Review Creator Agreement (v1.0-2026)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Review platform revenue share, intellectual property, and publishing rules.
            </p>
          </div>

          {/* Legal Scrollbox */}
          <div className="h-64 overflow-y-auto bg-black/50 p-5 rounded-2xl border border-white/10 text-xs text-gray-300 space-y-3 font-mono leading-relaxed">
            <div className="font-bold text-white text-sm">
              GAMEVERSE CREATOR REVENUE-SHARE & PUBLISHING AGREEMENT
            </div>
            <div>Version: 1.0-2026 • Published: November 2026</div>

            <div className="font-semibold text-indigo-400 pt-2">1. REVENUE SHARING (50% NET)</div>
            <p>
              The platform distributes fifty percent (50%) of all eligible Net Game Revenue generated by the Creator&apos;s published games. Net Game Revenue is defined as Gross Ad Revenue minus direct network processing fees, chargebacks, and verified invalid traffic (IVT) deductions.
            </p>

            <div className="font-semibold text-indigo-400 pt-2">2. INTELLECTUAL PROPERTY & AI DISCLOSURES</div>
            <p>
              The Creator retains 100% intellectual property ownership of their games. The Creator grants GameVerse a non-exclusive license to host, display, and promote the build. The Creator explicitly warrants that they possess commercial licenses for all third-party fonts, audio, and textures, and agrees to truthfully declare any AI-generated components.
            </p>

            <div className="font-semibold text-indigo-400 pt-2">3. PAYOUT THRESHOLDS & ACCOUNTING CYCLE</div>
            <p>
              Earnings reconcile on a Net-30 monthly calendar. The minimum payout disbursement threshold is $50.00 USD (or local currency equivalent). Balances below the threshold roll over to the subsequent billing period.
            </p>

            <div className="font-semibold text-indigo-400 pt-2">4. PROHIBITED CONTENT & SECURITY</div>
            <p>
              Builds containing malware, cryptominers, unauthorized tracking pixels, or offensive hate speech will be immediately unpublished, with earnings subject to forfeiture.
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-black/40 text-indigo-600 focus:ring-0"
              />
              <span className="text-xs text-gray-200 leading-relaxed font-semibold">
                I have read, understood, and accept the GameVerse Creator Agreement (v1.0-2026). I agree that this acceptance will be cryptographically timestamped and bound to my account IP address.
              </span>
            </label>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="success"
              isLoading={submitting}
              onClick={handleFinishOnboarding}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Sign Agreement & Activate Studio
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: ACTIVATION COMPLETE */}
      {step === 3 && (
        <div className="bg-surface rounded-3xl p-8 sm:p-12 border border-white/10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-heading font-black text-3xl text-white">
              Studio Activated Successfully!
            </h2>
            <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
              Your Creator Agreement (v1.0-2026) has been registered. Your studio <span className="font-bold text-white">{studioName}</span> is now active and authorized to submit game builds to the platform.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Button variant="secondary" onClick={() => router.push('/developer')}>
              View Studio Dashboard
            </Button>
            <Button variant="primary" onClick={() => router.push('/developer/submit')}>
              Upload Your First Game Build
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
