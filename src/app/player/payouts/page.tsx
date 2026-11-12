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
  Trash2,
  Edit3,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SavedPayoutMethod {
  id: string;
  userId: string;
  method: 'UPI' | 'BANK_TRANSFER' | 'PAYPAL' | 'GIFT_CARD';
  accountDetails: string;
  beneficiaryName?: string;
  updatedAt: string;
}

interface PayoutRequestItem {
  id: string;
  userId: string;
  amount: number;
  currency?: string;
  method: 'UPI' | 'BANK_TRANSFER' | 'PAYPAL' | 'GIFT_CARD';
  accountDetails: string;
  beneficiaryName?: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED';
  requestedAt: string;
  paidAt?: string;
  transactionRef?: string;
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
    name: 'UPI (GPay / PhonePe / Paytm / BHIM)',
    description: 'Instant transfer directly to your UPI ID (VPA)',
    icon: Coins,
    placeholder: 'e.g. gamer@okhdfcbank or 9876543210@paytm',
    fieldLabel: 'UPI ID (VPA)',
  },
  {
    id: 'BANK_TRANSFER',
    name: 'Direct Bank Account Transfer (IMPS / NEFT)',
    description: 'Transfer directly into your savings/current bank account',
    icon: Building,
    placeholder: 'Account No., IFSC Code, Beneficiary Name',
    fieldLabel: 'Bank Account Details & IFSC',
  },
  {
    id: 'PAYPAL',
    name: 'PayPal Global',
    description: 'Direct international transfer to your PayPal email',
    icon: CreditCard,
    placeholder: 'e.g. yourname@gmail.com',
    fieldLabel: 'PayPal Email Address',
  },
  {
    id: 'GIFT_CARD',
    name: 'Gaming Gift Card (Steam / Google Play)',
    description: 'Digital gift card voucher sent to your email',
    icon: Gift,
    placeholder: 'Preferred Brand (e.g. Steam / Google Play) & Delivery Email',
    fieldLabel: 'Voucher Preference & Email',
  },
];

export default function PlayerPayoutsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [savedMethod, setSavedMethod] = useState<SavedPayoutMethod | null>(null);
  const [requests, setRequests] = useState<PayoutRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Method Modal / Form state
  const [isEditingMethod, setIsEditingMethod] = useState(false);
  const [methodType, setMethodType] = useState<'UPI' | 'BANK_TRANSFER' | 'PAYPAL' | 'GIFT_CARD'>('UPI');
  const [accountDetails, setAccountDetails] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [savingMethod, setSavingMethod] = useState(false);

  // Payout Request Form state (Amount only)
  const [amount, setAmount] = useState<string>('500');
  const [requestNote, setRequestNote] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Notification banners
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/player/payouts');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setSavedMethod(data.savedMethod || null);
        setRequests(data.requests || []);

        if (data.savedMethod) {
          setMethodType(data.savedMethod.method);
          setAccountDetails(data.savedMethod.accountDetails);
          setBeneficiaryName(data.savedMethod.beneficiaryName || '');
        }
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

  // 1. Save or Update Payout Method
  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountDetails.trim()) {
      setErrorMessage('Please enter your payout account details.');
      return;
    }

    setSavingMethod(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_METHOD',
          method: methodType,
          accountDetails: accountDetails.trim(),
          beneficiaryName: beneficiaryName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSavedMethod(data.savedMethod);
        setIsEditingMethod(false);
        setSuccessMessage('Payout method successfully saved! Ab aapko baar-baar details dalne ki zaroorat nahi hai.');
      } else {
        setErrorMessage(data.error || 'Failed to save payout method.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving payout method.');
    } finally {
      setSavingMethod(false);
    }
  };

  // 2. Delete Payout Method
  const handleDeleteMethod = async () => {
    if (!window.confirm('Are you sure you want to remove your saved payout method?')) return;

    setSavingMethod(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_METHOD' }),
      });

      if (res.ok) {
        setSavedMethod(null);
        setAccountDetails('');
        setBeneficiaryName('');
        setSuccessMessage('Saved payout method deleted successfully.');
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to delete method.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting method.');
    } finally {
      setSavingMethod(false);
    }
  };

  // 3. Submit Payout Request (Amount only)
  const handleSubmitPayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savedMethod) {
      setErrorMessage('Please save your payout method first before requesting a payout.');
      setIsEditingMethod(true);
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMessage('Please enter a valid withdrawal amount greater than 0.');
      return;
    }

    setSubmittingPayout(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_PAYOUT',
          amount: numAmount,
          note: requestNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Payout request for ₹${numAmount} successfully submitted! Aapka request history table me add ho gaya hai.`);
        setRequestNote('');
        fetchPayoutData();
      } else {
        setErrorMessage(data.error || 'Failed to submit payout request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting payout request.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const formatPlaytime = (minutes: number) => {
    if (!minutes || minutes < 1) return '0 min';
    if (minutes < 60) return `${minutes} mins`;
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hrs`;
  };

  // Loading state
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

  // LOCKED STATE: For guests who haven't logged in
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in space-y-8">
        <div className="bg-[#0B0F19] rounded-3xl p-8 sm:p-12 border border-amber-500/20 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none" />

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
        </div>
      </div>
    );
  }

  const selectedMethodObj = PAYMENT_METHODS.find((m) => m.id === (savedMethod ? savedMethod.method : methodType));

  // UNLOCKED STATE: For Registered Gamers
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
              Apna payout method ek baar save karein, aur amount enter karke turant withdrawal request dalein.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gamer Payout Active</span>
            </span>
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
            <div className="text-[10px] text-gray-500">Tracked in history</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Playtime</span>
            </div>
            <div className="text-2xl font-black text-white">
              {formatPlaytime(stats?.totalPlayMinutes ?? 0)}
            </div>
            <div className="text-[10px] text-gray-500">Verified duration</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payout Method</span>
            </div>
            <div className="text-base font-bold text-emerald-400 pt-1">
              {savedMethod ? savedMethod.method : 'Not Configured'}
            </div>
            <div className="text-[10px] text-gray-500">
              {savedMethod ? 'Saved & Ready' : 'Setup Required'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Account Status</span>
            </div>
            <div className="text-base font-bold text-indigo-300 pt-1">
              Verified Gamer
            </div>
            <div className="text-[10px] text-gray-500">Withdrawals open</div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* STEP 1: CHOOSE, SAVE, UPDATE & DELETE PAYOUT METHOD */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>1. Payout Method (Ek Baar Save Karein)</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Yahan apna payout method choose aur save karein, taki baar-baar details na dalni pade. Aap ise kabhi bhi update ya delete kar sakte hain.
            </p>
          </div>

          {savedMethod && !isEditingMethod && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingMethod(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Update Method</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteMethod}
                disabled={savingMethod}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* If Saved: Show the Active Saved Card */}
        {savedMethod && !isEditingMethod ? (
          <div className="p-5 rounded-2xl bg-[#090D16] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                {savedMethod.method === 'UPI' && <Coins className="w-6 h-6" />}
                {savedMethod.method === 'BANK_TRANSFER' && <Building className="w-6 h-6" />}
                {savedMethod.method === 'PAYPAL' && <CreditCard className="w-6 h-6" />}
                {savedMethod.method === 'GIFT_CARD' && <Gift className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">
                    {savedMethod.method.replace('_', ' ')}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    <Check className="w-3 h-3" />
                    <span>Saved & Verified</span>
                  </span>
                </div>
                <p className="text-sm font-mono text-cyan-300">
                  {savedMethod.accountDetails}
                </p>
                {savedMethod.beneficiaryName && (
                  <p className="text-xs text-gray-400">
                    Beneficiary: <span className="text-gray-200">{savedMethod.beneficiaryName}</span>
                  </p>
                )}
                <p className="text-[11px] text-gray-500">
                  Last updated: {new Date(savedMethod.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Ready for Direct Payout</span>
              </span>
            </div>
          </div>
        ) : !savedMethod && !isEditingMethod ? (
          /* If Not Saved: Prompt Button to Choose & Save */
          <div className="py-8 px-6 rounded-2xl bg-[#090D16] border border-dashed border-white/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Payout Method Saved</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                Apna UPI ID ya Bank Account ek baar save kar lijiye taki aage sirf amount enter karke payout le sakein.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingMethod(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Choose & Save Payout Method</span>
            </button>
          </div>
        ) : (
          /* Form to Choose, Save or Update Payout Method */
          <form onSubmit={handleSaveMethod} className="space-y-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Select Payment Option
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = methodType === pm.id;
                  return (
                    <button
                      type="button"
                      key={pm.id}
                      onClick={() => setMethodType(pm.id as any)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  {selectedMethodObj?.fieldLabel || 'Account Details'}
                </label>
                <input
                  type="text"
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder={selectedMethodObj?.placeholder}
                  required
                  className="w-full bg-[#090D16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Account Holder / Beneficiary Name (Optional)
                </label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[#090D16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {savedMethod && (
                <button
                  type="button"
                  onClick={() => setIsEditingMethod(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={savingMethod}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{savingMethod ? 'Saving Method...' : 'Save Payout Method'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* STEP 2: PAYOUT REQUEST (AMOUNT ONLY) */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span>2. Request Payout (Sirf Amount Fill Karein)</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Aapka saved method automatically link ho chuka hai. Bas withdrawal amount enter karein aur payout request submit karein.
          </p>
        </div>

        <form onSubmit={handleSubmitPayoutRequest} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Enter Withdrawal Amount (₹)
            </label>
            <div className="relative max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base">
                ₹
              </span>
              <input
                type="number"
                min="10"
                step="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                required
                className="w-full bg-[#090D16] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-lg font-bold text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
              />
            </div>

            {/* Quick Amount Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs text-gray-400">Quick Select:</span>
              {['100', '250', '500', '1000', '2000'].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer ${
                    amount === amt
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-[#090D16] text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Receiving Account Indicator */}
          {savedMethod ? (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400">Receiving via Saved Method:</span>
              <span className="font-mono text-cyan-300 font-semibold">
                {savedMethod.method} &bull; {savedMethod.accountDetails}
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Upar pehle apna payout method save karein, fir yahan request submit karein.</span>
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Note / Comments (Optional)
            </label>
            <input
              type="text"
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="e.g. Fast payout please"
              maxLength={200}
              className="w-full bg-[#090D16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={submittingPayout || !savedMethod}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-7 py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingPayout ? 'Submitting Request...' : `Submit Payout Request (₹${amount || 0})`}</span>
            </button>
          </div>
        </form>
      </div>

      {/* STEP 3: PAYOUT HISTORY TABLE WITH EXPLICIT STATUS & METHOD */}
      <div className="bg-[#0B0F19] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">
              History of all withdrawal requests submitted from your account
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Har withdrawal request ka live status, method aur transaction reference yahan dekhein.
            </p>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            {requests.length} Requests
          </span>
        </div>

        <div className="overflow-x-auto">
          {requests.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-3">
              <Coins className="w-8 h-8 text-gray-500 mx-auto" />
              <p className="text-sm font-semibold text-gray-300">No withdrawal requests yet</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Play games to build up your playtime, save your payout method, and submit your first withdrawal request.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-white/10 text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Requested Date</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Payout Method</th>
                  <th className="px-6 py-3.5 font-mono">Account / Details</th>
                  <th className="px-6 py-3.5">Transaction Ref</th>
                  <th className="px-6 py-3.5 text-right">Status (Payout Hua ya Pending)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {requests.map((r) => {
                  const isPaid = r.status === 'PAID';
                  const isProcessing = r.status === 'PROCESSING';
                  const isRejected = r.status === 'REJECTED';
                  const isPending = r.status === 'PENDING';

                  return (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-white font-medium whitespace-nowrap">
                        {new Date(r.requestedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-white text-sm whitespace-nowrap">
                        ₹{r.amount || 100}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          {r.method === 'UPI' && <Coins className="w-3.5 h-3.5" />}
                          {r.method === 'BANK_TRANSFER' && <Building className="w-3.5 h-3.5" />}
                          {r.method === 'PAYPAL' && <CreditCard className="w-3.5 h-3.5" />}
                          {r.method === 'GIFT_CARD' && <Gift className="w-3.5 h-3.5" />}
                          <span>{r.method.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-gray-300 whitespace-nowrap">
                        {r.accountDetails.length > 12
                          ? `${r.accountDetails.slice(0, 4)}••••${r.accountDetails.slice(-4)}`
                          : r.accountDetails}
                      </td>

                      <td className="px-6 py-4 font-mono text-gray-400 text-[11px] whitespace-nowrap">
                        {r.transactionRef || 'TXN-GV-PENDING'}
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Successfully Paid</span>
                          </span>
                        )}

                        {isProcessing && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing Payout</span>
                          </span>
                        )}

                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Review</span>
                          </span>
                        )}

                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
