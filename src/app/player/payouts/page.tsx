'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Gamepad2,
  Coins,
  Shield,
  ArrowRight,
  AlertCircle,
  Building,
  CreditCard,
  Gift,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';

interface PayoutRequestItem {
  id: string;
  userId: string;
  method: 'UPI' | 'BANK_TRANSFER' | 'PAYPAL' | 'GIFT_CARD';
  accountDetails: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED';
  requestedAt: string;
  note?: string;
}

interface PlayerStats {
  gamesPlayed: number;
  totalPlayMinutes: number;
  eligible: boolean;
  calculationStatus: string;
  notice: string;
}

const PAYMENT_METHODS = [
  {
    id: 'UPI',
    name: 'UPI (GPay / PhonePe / Paytm)',
    description: 'Instant transfer to your virtual payment address (VPA)',
    icon: Coins,
    placeholder: 'e.g. gamername@okhdfcbank or 9876543210@paytm',
  },
  {
    id: 'BANK_TRANSFER',
    name: 'Bank Account Transfer',
    description: 'Direct NEFT/IMPS transfer to your bank account',
    icon: Building,
    placeholder: 'Account Number, IFSC Code, Account Holder Name',
  },
  {
    id: 'PAYPAL',
    name: 'PayPal Global',
    description: 'Direct international transfer to your PayPal email',
    icon: CreditCard,
    placeholder: 'e.g. player@gmail.com',
  },
  {
    id: 'GIFT_CARD',
    name: 'Steam / Google Play Gift Card',
    description: 'Digital gift code delivered to your registered email',
    icon: Gift,
    placeholder: 'Enter preferred gift card brand (Steam / Google Play / Amazon)',
  },
];

export default function PlayerPayoutsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [requests, setRequests] = useState<PayoutRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'BANK_TRANSFER' | 'PAYPAL' | 'GIFT_CARD'>('UPI');
  const [accountDetails, setAccountDetails] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/player/payouts');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load player payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPayoutData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountDetails.trim()) {
      setErrorMessage('Please enter your payout account details.');
      return;
    }

    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: selectedMethod,
          accountDetails,
          note,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Your payout request has been registered successfully! Our team will process it once calculation rates are activated.');
        setAccountDetails('');
        setNote('');
        fetchPayoutData();
      } else {
        setErrorMessage(data.error || 'Failed to submit payout request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error submitting payout.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPlaytime = (minutes: number) => {
    if (!minutes || minutes < 1) return '0 min';
    if (minutes < 60) return `${minutes} mins`;
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hrs`;
  };

  // 1. Loading state
  if (authLoading || (loading && isAuthenticated)) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-white/5 rounded-xl" />
          <div className="h-64 bg-surface rounded-3xl border border-white/5" />
          <div className="h-96 bg-surface rounded-3xl border border-white/5" />
        </div>
      </div>
    );
  }

  // 2. LOCKED STATE: For users who haven't created an account or aren't logged in
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in space-y-8">
        <div className="bg-[#0B0F19] rounded-3xl p-8 sm:p-12 border border-amber-500/20 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Locked Badge & Icon */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Member Access Only &bull; Page Locked</span>
          </div>

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600/30 to-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xl text-amber-400">
            <Lock className="w-10 h-10" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
              Gameplay Rewards & Payouts is Locked
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              GameVerse par game khelne ke paise sirf registered gamers ko milte hain.
              Bina account banaye game khelne wale users ke liye ye page locked rehta hai.
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Turant apna free gamer account banayein ya sign in karein aur game khelkar paise kamana shuru karein!
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Free Account & Unlock Payouts</span>
            </Link>

            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm px-6 py-3 rounded-xl border border-white/10 transition-all active:scale-95"
            >
              <span>Sign In as Gamer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Value props preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/10 text-left">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <Gamepad2 className="w-4 h-4" />
                <span>Play-to-Earn</span>
              </div>
              <p className="text-xs text-gray-400">
                Har game session ka playtime automatically record hota hai.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                <Coins className="w-4 h-4" />
                <span>Instant Withdrawals</span>
              </div>
              <p className="text-xs text-gray-400">
                UPI, Bank Transfer, PayPal aur Gift Cards me direct transfer.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <Shield className="w-4 h-4" />
                <span>100% Free Forever</span>
              </div>
              <p className="text-xs text-gray-400">
                Khelne ke liye koi subscription ya deposit required nahi hai.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. UNLOCKED STATE: For Registered / Authenticated Gamers
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-gray-200 font-medium">Gamer Payouts</span>
      </div>

      {/* Header Banner */}
      <div className="bg-[#0B0F19] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Play-to-Earn Rewards
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mt-1">
              Gamer Rewards & Payouts
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              Play games on GameVerse, level up your gameplay time, and earn money for your playtime.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gamer Payout Unlocked</span>
            </span>
          </div>
        </div>

        {/* Notice Card: Calculation formula message (Per user instruction) */}
        <div className="mt-6 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">
              Payout Calculation & Rate Engine Update:
            </p>
            <p className="text-indigo-200 leading-relaxed">
              Kitne paise milenge ye rates platform administrators dwara jald finalize kiye jayenge.
              Abhi aapka khela hua har game aur gameplay duration automatically aapke account me track ho raha hai,
              taki rate activate hote hi aapka payout credit ho sake!
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Games Played</span>
            </div>
            <div className="text-2xl font-black text-white">{stats?.gamesPlayed ?? 0}</div>
            <div className="text-[10px] text-gray-500">Tracked in session history</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Playtime</span>
            </div>
            <div className="text-2xl font-black text-white">
              {formatPlaytime(stats?.totalPlayMinutes ?? 0)}
            </div>
            <div className="text-[10px] text-gray-500">Verified gameplay duration</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payout Balance</span>
            </div>
            <div className="text-lg font-bold text-emerald-400 pt-1">
              Active & Tracking
            </div>
            <div className="text-[10px] text-gray-500">Rates will be added soon</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Account Status</span>
            </div>
            <div className="text-lg font-bold text-indigo-300 pt-1">
              Verified Gamer
            </div>
            <div className="text-[10px] text-gray-500">Eligible for withdrawals</div>
          </div>
        </div>
      </div>

      {/* Request Payout Form */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            <span>Request Gamer Payout</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Apna preferred payout method select karein aur withdrawal details submit karein.
          </p>
        </div>

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitPayout} className="space-y-6">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
              1. Select Payout Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                const isSelected = selectedMethod === pm.id;
                return (
                  <button
                    type="button"
                    key={pm.id}
                    onClick={() => setSelectedMethod(pm.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-[#090D16] border-white/5 hover:border-white/20 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {pm.name}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                        {pm.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Details Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              2. Payout Account Details
            </label>
            <input
              type="text"
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              placeholder={PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.placeholder}
              required
              className="w-full bg-[#090D16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Your payment information is encrypted and securely stored for processing.
            </p>
          </div>

          {/* Note (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              3. Note / Comments (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Please process via fast IMPS / GPay"
              maxLength={200}
              className="w-full bg-[#090D16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Payout Request'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Payout History / Requests Table */}
      <div className="bg-[#0B0F19] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Your Payout Requests</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              History of all withdrawal requests submitted from your account.
            </p>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg">
            {requests.length} Requests
          </span>
        </div>

        <div className="overflow-x-auto">
          {requests.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-3">
              <Coins className="w-8 h-8 text-gray-500 mx-auto" />
              <p className="text-sm font-semibold text-gray-300">No payout requests yet</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Play games to build up your playtime, then use the form above to submit your first payout request.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Explore Games & Start Playing &rarr;</span>
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-white/10 text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Requested Date</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5 font-mono">Account Details</th>
                  <th className="px-6 py-3.5">Note</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">
                      {new Date(r.requestedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-amber-400">{r.method}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-300">
                      {r.accountDetails.length > 10
                        ? `${r.accountDetails.slice(0, 4)}••••${r.accountDetails.slice(-4)}`
                        : r.accountDetails}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-[11px]">
                      {r.note || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          r.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : r.status === 'PROCESSING'
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
