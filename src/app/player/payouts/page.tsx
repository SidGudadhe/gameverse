'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Clock,
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
  Copy,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface PlayerPayoutMethod {
  id: string;
  userId: string;
  method: 'UPI' | 'BANK_TRANSFER' | 'PAYPAL' | 'GIFT_CARD';
  accountDetails: string;
  beneficiaryName?: string;
  label?: string;
  provider?: 'GPAY' | 'PHONEPE' | 'PAYTM' | 'BHIM' | 'GENERIC_UPI' | 'BANK' | 'PAYPAL' | 'GIFT';
  isDefault?: boolean;
  updatedAt: string;
}

export interface PlayerWallet {
  userId: string;
  availableBalance: number;
  inProcessing: number;
  lifetimeWithdrawn: number;
  totalEarned: number;
  currency: string;
  updatedAt: string;
}

export interface PayoutRequestItem {
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

const COMMON_UPI_HANDLES = [
  { handle: '@okhdfcbank', label: 'GPay (HDFC)' },
  { handle: '@okaxis', label: 'GPay (Axis)' },
  { handle: '@oksbi', label: 'GPay (SBI)' },
  { handle: '@ybl', label: 'PhonePe (Yes Bank)' },
  { handle: '@paytm', label: 'Paytm Payments' },
  { handle: '@upi', label: 'BHIM UPI' },
];

export default function PlayerPayoutsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [wallet, setWallet] = useState<PlayerWallet | null>(null);
  const [savedMethods, setSavedMethods] = useState<PlayerPayoutMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [requests, setRequests] = useState<PayoutRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pop-up modal state for selecting payment method (up to 4 UPI IDs)
  const [isSelectMethodModalOpen, setIsSelectMethodModalOpen] = useState(false);

  // Modal / Drawer state for adding or editing account
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [methodType, setMethodType] = useState<'UPI' | 'BANK_TRANSFER' | 'PAYPAL' | 'GIFT_CARD'>('UPI');
  const [accountDetails, setAccountDetails] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accountLabel, setAccountLabel] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [savingMethod, setSavingMethod] = useState(false);

  // Amount-Only Payout Request State
  const [amount, setAmount] = useState<string>('500');
  const [requestNote, setRequestNote] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Table filter and clipboard
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

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
        if (data.wallet) {
          setWallet(data.wallet);
        }
        const methods: PlayerPayoutMethod[] = data.savedMethods || (data.savedMethod ? [data.savedMethod] : []);
        setSavedMethods(methods);
        setRequests(data.requests || []);

        // Default to primary method or first method if not yet selected
        const defaultMethod = methods.find((m) => m.isDefault) || methods[0];
        if (defaultMethod && !selectedMethodId) {
          setSelectedMethodId(defaultMethod.id);
        } else if (defaultMethod && !methods.some((m) => m.id === selectedMethodId)) {
          setSelectedMethodId(defaultMethod.id);
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

  // Copy reference with feedback
  const handleCopyRef = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedRef(refText);
    setTimeout(() => {
      setCopiedRef((prev) => (prev === refText ? null : prev));
    }, 2000);
  };

  // Open Modal for New Method
  const handleOpenAddModal = () => {
    if (savedMethods.length >= 4) {
      setErrorMessage('Maximum 4 payout accounts / UPI IDs can be linked at a time. Please remove or update an existing account.');
      return;
    }
    setEditingMethodId(null);
    setMethodType('UPI');
    setAccountDetails('');
    setBeneficiaryName('');
    setAccountLabel('');
    setSetAsDefault(savedMethods.length === 0);
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  // Open Modal for Editing Existing Method
  const handleOpenEditModal = (method: PlayerPayoutMethod) => {
    setEditingMethodId(method.id);
    setMethodType(method.method);
    setAccountDetails(method.accountDetails);
    setBeneficiaryName(method.beneficiaryName || '');
    setAccountLabel(method.label || '');
    setSetAsDefault(Boolean(method.isDefault));
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  // Save / Update Payout Method
  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountDetails.trim()) {
      setErrorMessage('Please enter valid payout account details.');
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
          id: editingMethodId || undefined,
          addNew: !editingMethodId,
          method: methodType,
          accountDetails: accountDetails.trim(),
          beneficiaryName: beneficiaryName.trim() || undefined,
          label: accountLabel.trim() || undefined,
          isDefault: setAsDefault,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setSuccessMessage(
          editingMethodId
            ? 'Payout account successfully updated!'
            : 'New payout account linked successfully! You can select this account for instant withdrawals.'
        );
        await fetchPayoutData();
        if (data.savedMethod?.id) {
          setSelectedMethodId(data.savedMethod.id);
        }
      } else {
        setErrorMessage(data.error || 'Failed to save payout method.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving payout method.');
    } finally {
      setSavingMethod(false);
    }
  };

  // Make an account the primary default
  const handleSetPrimary = async (methodId: string) => {
    try {
      const res = await fetch('/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_DEFAULT',
          methodId,
        }),
      });
      if (res.ok) {
        setSelectedMethodId(methodId);
        setSuccessMessage('Primary payout account updated.');
        await fetchPayoutData();
      }
    } catch (err: any) {
      setErrorMessage('Could not update primary account.');
    }
  };

  // Delete a specific method
  const handleDeleteMethod = async (methodId: string, label: string) => {
    if (!window.confirm(`Are you sure you want to remove this payout account (${label})?`)) return;

    try {
      const res = await fetch('/api/player/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_METHOD',
          methodId,
        }),
      });

      if (res.ok) {
        setSuccessMessage('Payout account removed.');
        await fetchPayoutData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to remove payout account.');
      }
    } catch (err: any) {
      setErrorMessage('Error removing payout account.');
    }
  };

  // Submit Payout Request
  const handleSubmitPayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savedMethods.length === 0) {
      setErrorMessage('Please link at least one UPI ID or payout account before requesting a withdrawal.');
      handleOpenAddModal();
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 500) {
      setErrorMessage('Minimum withdrawal amount is ₹500. Withdrawals below ₹500 are not permitted.');
      return;
    }

    if ((wallet?.availableBalance ?? 0) < 500) {
      setErrorMessage(
        `Your available balance is ₹${(wallet?.availableBalance ?? 0).toFixed(2)}. A minimum balance of ₹500 is required to withdraw (Remaining needed: ₹${Math.max(0, 500 - (wallet?.availableBalance ?? 0)).toFixed(2)}).`
      );
      return;
    }

    if (numAmount > (wallet?.availableBalance ?? 0)) {
      setErrorMessage(
        `Withdrawal amount cannot exceed your available balance of ₹${(wallet?.availableBalance ?? 0).toFixed(2)}.`
      );
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
          methodId: selectedMethodId || undefined,
          amount: numAmount,
          note: requestNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Withdrawal request for ₹${numAmount} submitted successfully! Your settlement is queued for instant processing.`);
        setRequestNote('');
        await fetchPayoutData();
      } else {
        setErrorMessage(data.error || 'Failed to submit withdrawal request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing payout request.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const formatPlaytime = (minutes: number) => {
    if (!minutes || minutes < 1) return '0 min';
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);
    return `${hours}h ${remainingMins}m`;
  };

  // Helper for provider branding
  const getProviderInfo = (method: PlayerPayoutMethod) => {
    if (method.method === 'UPI') {
      const details = method.accountDetails.toLowerCase();
      if (details.includes('@okhdfcbank') || details.includes('@okaxis') || details.includes('@oksbi') || details.includes('@okicici')) {
        return {
          brand: 'Google Pay',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dotClass: 'bg-emerald-400',
          icon: Smartphone,
        };
      }
      if (details.includes('@ybl') || details.includes('@ibl') || details.includes('@axl')) {
        return {
          brand: 'PhonePe',
          badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          dotClass: 'bg-indigo-400',
          icon: Smartphone,
        };
      }
      if (details.includes('@paytm')) {
        return {
          brand: 'Paytm',
          badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          dotClass: 'bg-cyan-400',
          icon: Smartphone,
        };
      }
      if (details.includes('@upi')) {
        return {
          brand: 'BHIM UPI',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dotClass: 'bg-amber-400',
          icon: Coins,
        };
      }
      return {
        brand: 'UPI',
        badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        icon: Coins,
      };
    }

    if (method.method === 'BANK_TRANSFER') {
      return {
        brand: 'Bank Wire',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        dotClass: 'bg-blue-400',
        icon: Building,
      };
    }

    if (method.method === 'PAYPAL') {
      return {
        brand: 'PayPal',
        badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        dotClass: 'bg-sky-400',
        icon: CreditCard,
      };
    }

    return {
      brand: 'Gift Card',
      badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      dotClass: 'bg-purple-400',
      icon: Gift,
    };
  };

  const selectedMethod = savedMethods.find((m) => m.id === selectedMethodId) || savedMethods[0];

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = r.transactionRef?.toLowerCase().includes(q);
      const matchAcc = r.accountDetails.toLowerCase().includes(q);
      const matchAmt = r.amount.toString().includes(q);
      return matchRef || matchAcc || matchAmt;
    }
    return true;
  });

  // LOADING SKELETON
  if (authLoading || (loading && isAuthenticated)) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-36 bg-slate-800 rounded-md" />
          <div className="h-28 bg-[#121826] rounded-2xl border border-slate-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-24 bg-[#121826] rounded-2xl border border-slate-800" />
            <div className="h-24 bg-[#121826] rounded-2xl border border-slate-800" />
          </div>
          <div className="h-80 bg-[#121826] rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  // LOCKED STATE: For guests who haven't logged in
  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-fade-in">
        <div className="bg-[#121826] rounded-2xl p-8 sm:p-12 border border-slate-800 shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
              <span>Verified Gamer Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Player Rewards & Payouts is Locked
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Gameplay rewards and instant UPI payouts on GameVerse are exclusively available for registered gamer accounts.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20"
            >
              <span>Create Free Gamer Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm px-6 py-2.5 rounded-xl border border-slate-700 transition-all"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // UNLOCKED STATE: Real SaaS FinTech Layout
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in text-slate-100">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-200 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-slate-300 font-medium">Rewards & Payouts</span>
      </div>

      {/* Top Header & Platform Gateway Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Rewards & Payouts</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Link up to 4 UPI IDs or accounts, transfer your gameplay earnings, and track real-time settlement status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-300">Instant Payouts: Active</span>
          </div>

          <button
            onClick={fetchPayoutData}
            title="Refresh Payout Data"
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FinTech Account Balance Hero Panel (Stripe / Deel Standard) */}
      <div className="bg-gradient-to-r from-[#121826] via-[#151D2E] to-[#121826] rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Available Account Balance
              </span>
              {(wallet?.availableBalance ?? 1500) < 500 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Lock className="w-3 h-3" />
                  <span>
                    Need ₹{Math.max(0, 500 - (wallet?.availableBalance ?? 0)).toFixed(2)} to Unlock (Min ₹500)
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ready for Instant Withdrawal (Min ₹500 Met)</span>
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                ₹
                {Number(wallet?.availableBalance ?? 1500).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-slate-400 font-medium">INR</span>
            </div>

            <p className="text-xs text-slate-400">
              Verified play reward balance available to withdraw immediately to any of your saved UPI IDs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-6 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">In Processing</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">
                ₹{Number(wallet?.inProcessing ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block">Pending clearance</span>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] block">Total Withdrawn</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                ₹
                {Number(wallet?.lifetimeWithdrawn ?? 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-[10px] text-slate-500 block">Payouts settled</span>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] block">Lifetime Earned</span>
              <span className="font-mono font-bold text-white text-sm">
                ₹
                {Number(wallet?.totalEarned ?? 1500).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-[10px] text-slate-500 block">All-time rewards</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Metric Cards (Stripe / Deel Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#121826] rounded-2xl p-5 border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">
              Games Played
            </span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              {stats?.gamesPlayed ?? 0}
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Verified Gameplay History</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        <div className="bg-[#121826] rounded-2xl p-5 border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">
              Tracked Playtime
            </span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              {formatPlaytime(stats?.totalPlayMinutes ?? 0)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Active session duration
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKFLOW SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: WITHDRAWAL FORM */}
        <div className="lg:col-span-8 space-y-6">
          {/* WITHDRAWAL ACTION PANEL */}
          <div className="bg-[#121826] rounded-2xl p-6 border border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Withdraw Rewards</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Funds are disbursed directly to your active UPI ID via IMPS instant clearing.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (savedMethods.length === 0) {
                    handleOpenAddModal();
                  } else {
                    setIsSelectMethodModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Select Payment Method ({savedMethods.length}/4)</span>
              </button>
            </div>

            <form onSubmit={handleSubmitPayoutRequest} className="space-y-5">
              {/* Payment Method Selector Card (Triggers Pop-up Modal) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Receiving Account
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {savedMethods.length}/4 UPI IDs linked
                  </span>
                </div>

                {selectedMethod ? (
                  <div
                    onClick={() => setIsSelectMethodModalOpen(true)}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getProviderInfo(selectedMethod).badgeClass}`}>
                        {React.createElement(getProviderInfo(selectedMethod).icon, { className: 'w-5 h-5' })}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-mono truncate">
                            {selectedMethod.accountDetails}
                          </span>
                          {selectedMethod.isDefault && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          {getProviderInfo(selectedMethod).brand} &bull; {selectedMethod.label || selectedMethod.beneficiaryName || 'Verified Payout Account'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSelectMethodModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 group-hover:bg-slate-800 border border-slate-700 text-xs font-medium text-cyan-300 group-hover:text-cyan-200 transition-colors cursor-pointer"
                      >
                        <Coins className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Select Payment Method</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (savedMethods.length === 0) {
                        handleOpenAddModal();
                      } else {
                        setIsSelectMethodModalOpen(true);
                      }
                    }}
                    className="p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-amber-300">
                          No Payout Method Selected
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Click to select or link up to 4 UPI IDs (Google Pay, PhonePe, Paytm, BHIM)
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddModal();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-sm shadow-emerald-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Link UPI ID</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Minimum Balance Requirement / Progress Box if balance < 500 */}
              {(wallet?.availableBalance ?? 1500) < 500 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Minimum Withdrawal Threshold: ₹500.00</span>
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      {Math.min(100, Math.round(((wallet?.availableBalance ?? 0) / 500) * 100))}% Completed
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(5, Math.round(((wallet?.availableBalance ?? 0) / 500) * 100))
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Your current available balance is <strong className="text-white font-mono">₹{(wallet?.availableBalance ?? 0).toFixed(2)}</strong>. A minimum balance of <strong className="text-amber-300 font-mono">₹500.00</strong> is required before submitting a withdrawal (Remaining needed: <strong className="text-white font-mono">₹{Math.max(0, 500 - (wallet?.availableBalance ?? 0)).toFixed(2)}</strong>). Play games on GameVerse to reach the ₹500 threshold!
                  </p>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Withdrawal Amount (₹ INR)
                    </label>
                    <span className="text-[10px] font-mono bg-slate-900 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                      Min: ₹500
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      Available:{' '}
                      <strong className="text-emerald-400 font-mono">
                        ₹{Number(wallet?.availableBalance ?? 1500).toFixed(2)}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAmount(String(Math.max(500, wallet?.availableBalance ?? 1500)))}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                    >
                      Use Max
                    </button>
                  </div>
                </div>

                <div className="relative max-w-sm">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="500"
                    step="50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    required
                    className={`w-full bg-slate-950 border rounded-xl pl-9 pr-4 py-2.5 text-xl font-bold text-white placeholder-slate-600 focus:outline-none transition-all font-mono ${
                      Number(amount) < 500 || Number(amount) > (wallet?.availableBalance ?? 1500)
                        ? 'border-amber-500/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                        : 'border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    }`}
                  />
                </div>

                {/* Amount Feedback Message */}
                {Number(amount) < 500 ? (
                  <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Minimum withdrawal amount is ₹500.00. Withdrawals below ₹500 are not permitted.
                    </span>
                  </p>
                ) : Number(amount) > (wallet?.availableBalance ?? 1500) ? (
                  <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Withdrawal amount cannot exceed your available balance of ₹
                      {(wallet?.availableBalance ?? 1500).toFixed(2)}.
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Remaining balance after this withdrawal:{' '}
                    <strong className="text-slate-200 font-mono">
                      ₹
                      {Math.max(
                        0,
                        (wallet?.availableBalance ?? 1500) - Number(amount || 0)
                      ).toFixed(2)}
                    </strong>
                  </p>
                )}

                {/* Quick Presets (Min ₹500) */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400">Quick Presets:</span>
                  {['500', '1000', '1500', '2000', '5000'].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setAmount(amt)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono border transition-all cursor-pointer ${
                        amount === amt
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transparent Fee & Settlement Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Gross Payout:</span>
                  <span className="font-mono text-white">₹{Number(amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Minimum Threshold:</span>
                  <span className="font-mono text-amber-400 font-medium">₹500.00 (Enforced)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Platform Fee (Gamer Rewards Promo):</span>
                  <span className="font-mono text-emerald-400 font-medium">₹0.00 (Free)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Estimated Processing Speed:</span>
                  <span className="text-slate-300">Instant (under 5 mins via IMPS / UPI)</span>
                </div>
              </div>

              {/* Optional Memo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">
                  Optional Note / Reference
                </label>
                <input
                  type="text"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="e.g. Tournament reward settlement"
                  maxLength={150}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={
                  submittingPayout ||
                  savedMethods.length === 0 ||
                  !amount ||
                  Number(amount) < 500 ||
                  Number(amount) > (wallet?.availableBalance ?? 1500) ||
                  (wallet?.availableBalance ?? 1500) < 500
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-8 py-3 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submittingPayout
                    ? 'Submitting Withdrawal...'
                    : (wallet?.availableBalance ?? 1500) < 500
                    ? `Minimum ₹500 Required (Need ₹${Math.max(0, 500 - (wallet?.availableBalance ?? 0)).toFixed(2)} more)`
                    : Number(amount) < 500
                    ? 'Minimum Withdrawal is ₹500'
                    : `Withdraw ₹${Number(amount || 0).toFixed(2)} via ${
                        selectedMethod ? selectedMethod.accountDetails : 'UPI'
                      }`}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: FINTECH RULES & TRUST WIDGET */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#121826] rounded-2xl p-5 border border-slate-800 space-y-4 text-xs">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>How GameVerse Payouts Work</span>
            </h3>

            <div className="space-y-3 text-slate-300">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </div>
                <p className="leading-snug">
                  <strong className="text-white">Play Games:</strong> Your play time and game earnings are automatically calculated and added to your balance.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </div>
                <p className="leading-snug">
                  <strong className="text-white">Link 4 UPI Accounts:</strong> You can add up to 4 UPI IDs (e.g. personal GPay, PhonePe, Paytm, or bank).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </div>
                <p className="leading-snug">
                  <strong className="text-white">Min ₹500 Withdrawal:</strong> Withdrawals start at ₹500. If your balance is under ₹500, play games to complete the ₹500 threshold, then withdraw instantly with 1-click direct transfer.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Direct UPI Transfer (GPay, PhonePe, Paytm)</span>
              </div>
              <p>We never ask for your bank PIN, password, or OTP. Payouts are credit-only.</p>
            </div>
          </div>

          {/* Quick Support Card */}
          <div className="bg-[#121826] rounded-2xl p-5 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-semibold text-white">Need Settlement Help?</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              If a payout takes longer than 2 hours or if your UPI ID changes, reach out to our community support desk.
            </p>
            <Link
              href="/player/profile"
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium pt-1"
            >
              <span>View Gamer Profile Settings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. TRANSACTION ACTIVITY & SETTLEMENT HISTORY TABLE (STRIPE / WISE STYLE) */}
      <div className="bg-[#121826] rounded-2xl border border-slate-800 shadow-sm overflow-hidden space-y-0">
        {/* Controls & Search Header */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span>Withdrawal & Settlement Activity</span>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {requests.length} records
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              History of all withdrawal requests submitted from your account with real-time settlement status.
            </p>
          </div>

          {/* Search + Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search UTR or account..."
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700 w-44"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {['ALL', 'PAID', 'PROCESSING', 'PENDING'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status === 'PAID' ? 'Settled' : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real Table */}
        <div className="overflow-x-auto">
          {filteredRequests.length === 0 ? (
            <div className="py-14 px-6 text-center space-y-2">
              <Coins className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">No withdrawal records found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {requests.length === 0
                  ? 'Your submitted withdrawal requests will appear here with live tracking and UTR transaction numbers.'
                  : 'No transactions match the selected filter.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Requested Date</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Destination UPI</th>
                  <th className="px-5 py-3.5">UTR / Reference ID</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredRequests.map((r) => {
                  const isPaid = r.status === 'PAID';
                  const isProcessing = r.status === 'PROCESSING';
                  const isPending = r.status === 'PENDING';
                  const isRejected = r.status === 'REJECTED';
                  const refId = r.transactionRef || 'TXN-GV-PENDING';
                  const isCopied = copiedRef === refId;

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-slate-300 font-medium">
                        {new Date(r.requestedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        <span className="text-slate-500 text-[10px] block">
                          {new Date(r.requestedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-sm text-white">
                        ₹{Number(r.amount || 100).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white text-xs">{r.accountDetails}</span>
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {r.method.replace('_', ' ')}
                          </span>
                        </div>
                        {r.beneficiaryName && (
                          <span className="text-[11px] text-slate-500 block">
                            {r.beneficiaryName}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopyRef(refId)}
                          title="Click to copy UTR reference"
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 hover:text-white bg-slate-950 px-2.5 py-1 rounded border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                        >
                          <span>{refId}</span>
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Successfully Paid</span>
                          </span>
                        )}

                        {isProcessing && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing Payout</span>
                          </span>
                        )}

                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Review</span>
                          </span>
                        )}

                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
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

      {/* 4. POP-UP MODAL: SELECT PAYMENT METHOD (UP TO 4 UPI IDs) */}
      {isSelectMethodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121826] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden space-y-4 p-6 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>Select Payment Method</span>
                  </h3>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                    {savedMethods.length}/4 Linked
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Choose which UPI ID will receive your withdrawal, or manage up to 4 accounts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSelectMethodModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: List of Saved Accounts */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {savedMethods.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">No Payout Accounts Linked</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Link your first Google Pay, PhonePe, Paytm, BHIM, or Bank Account to withdraw your earnings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectMethodModalOpen(false);
                      handleOpenAddModal();
                    }}
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Link First UPI ID (Slot 1 of 4)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedMethods.map((m) => {
                    const info = getProviderInfo(m);
                    const ProviderIcon = info.icon;
                    const isSelected = selectedMethodId === m.id || (!selectedMethodId && m.isDefault);

                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMethodId(m.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-500/60 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {/* Left: Radio indicator + Provider badge + Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                                : 'border-slate-600 bg-transparent'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                          </div>

                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${info.badgeClass}`}>
                            <ProviderIcon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-white font-mono truncate">
                                {m.accountDetails}
                              </span>
                              {m.isDefault && (
                                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                  Primary
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {info.brand} &bull; {m.label || m.beneficiaryName || 'Verified Payout Account'}
                            </p>
                          </div>
                        </div>

                        {/* Right: Actions (Set Primary, Edit, Delete) */}
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!m.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(m.id)}
                              className="text-[10px] font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-1 rounded transition-colors cursor-pointer"
                            >
                              Make Primary
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setIsSelectMethodModalOpen(false);
                              handleOpenEditModal(m);
                            }}
                            title="Edit Account Details"
                            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMethod(m.id, m.label || m.accountDetails)}
                            title="Remove Account"
                            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add New Slot inside Modal if < 4 */}
                  {savedMethods.length < 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectMethodModalOpen(false);
                        handleOpenAddModal();
                      }}
                      className="w-full p-3 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/30 hover:bg-slate-900/40 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Add Another UPI ID (Slot {savedMethods.length + 1} of 4)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-500 text-[11px]">
                {savedMethods.length < 4
                  ? `${4 - savedMethods.length} empty slot(s) remaining`
                  : 'All 4 payout slots linked'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSelectMethodModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsSelectMethodModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL / DIALOG: ADD OR EDIT PAYOUT ACCOUNT (UP TO 4 SLOTS) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121826] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden space-y-5 p-6 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingMethodId
                    ? 'Edit Payout Account'
                    : `Link Payout Account (Slot ${savedMethods.length + 1} of 4)`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Save up to 4 UPI IDs or payment accounts for instant withdrawals.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMethod} className="space-y-4">
              {/* Method Selector Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Payout Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethodType('UPI')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      methodType === 'UPI'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>UPI (GPay / PhonePe / Paytm)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethodType('BANK_TRANSFER')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      methodType === 'BANK_TRANSFER'
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Bank Account (IMPS)</span>
                  </button>
                </div>
              </div>

              {/* UPI ID / Account Details Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {methodType === 'UPI' ? 'UPI ID / VPA' : 'Bank Account & IFSC'}
                </label>
                <input
                  type="text"
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder={
                    methodType === 'UPI'
                      ? 'e.g. yourname@okhdfcbank or 9876543210@paytm'
                      : 'Account No., IFSC Code'
                  }
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />

                {/* Quick Handle Chips for UPI */}
                {methodType === 'UPI' && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-500">Quick Handle:</span>
                    {COMMON_UPI_HANDLES.map((h) => (
                      <button
                        type="button"
                        key={h.handle}
                        onClick={() => {
                          const prefix = accountDetails.includes('@')
                            ? accountDetails.split('@')[0]
                            : accountDetails || 'user';
                          setAccountDetails(`${prefix}${h.handle}`);
                        }}
                        className="text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        {h.handle}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Nickname / Label */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Account Nickname / Label (Optional)
                </label>
                <input
                  type="text"
                  value={accountLabel}
                  onChange={(e) => setAccountLabel(e.target.value)}
                  placeholder="e.g. My Personal GPay, PhonePe Secondary"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Account Holder Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Beneficiary Name (Account Holder Name)
                </label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Default Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="setAsDefaultCheck"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="setAsDefaultCheck" className="text-xs text-slate-300 cursor-pointer">
                  Set this as my primary payout account
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingMethod}
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-6 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingMethod ? 'Saving Account...' : 'Save Payout Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
