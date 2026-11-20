'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  CreditCard,
  Coins,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Check,
  Shield,
  Trash2,
  Edit3,
  Plus,
  Send,
  Zap,
} from 'lucide-react';
import { FinancialLedgerRecord, PayoutSummary } from '@/types';

interface DeveloperPayoutSettings {
  payoutMethod?: string;
  payoutDetails?: Record<string, string>;
}

const DEVELOPER_PAYMENT_METHODS = [
  {
    id: 'BANK_WIRE',
    name: 'Direct Bank Wire / Transfer (NEFT / SWIFT / ACH)',
    description: 'Direct institutional transfer to your registered studio bank account',
    icon: Building,
    placeholder: 'Account / IBAN Number, SWIFT / IFSC Code',
    fieldLabel: 'Bank Account / IBAN & IFSC/SWIFT Code',
    secondaryLabel: 'Company / Beneficiary Legal Name',
    secondaryPlaceholder: 'e.g. PixelForge Studios Pvt Ltd',
  },
  {
    id: 'UPI',
    name: 'UPI (Instant Developer Settlement)',
    description: 'Real-time disbursement directly to your verified business UPI ID (VPA)',
    icon: Coins,
    placeholder: 'e.g. studio@okaxis or 9876543210@paytm',
    fieldLabel: 'Business UPI ID (VPA)',
    secondaryLabel: 'Beneficiary Name (Optional)',
    secondaryPlaceholder: 'e.g. Rahul Sharma',
  },
  {
    id: 'PAYPAL',
    name: 'PayPal Global Merchant',
    description: 'International settlements delivered straight to your PayPal developer account',
    icon: CreditCard,
    placeholder: 'e.g. payments@yourgamestudio.com',
    fieldLabel: 'PayPal Email Address',
    secondaryLabel: 'Registered Account Name (Optional)',
    secondaryPlaceholder: 'e.g. Game Studio LLC',
  },
  {
    id: 'STRIPE',
    name: 'Stripe Direct / Connect',
    description: 'Direct creator payouts into your connected Stripe express balance',
    icon: Zap,
    placeholder: 'e.g. acct_1N00000000000000 or registered email',
    fieldLabel: 'Stripe Account ID or Connected Email',
    secondaryLabel: 'Account Holder Name (Optional)',
    secondaryPlaceholder: 'e.g. Lead Developer',
  },
];

export default function PayoutsPage() {
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [records, setRecords] = useState<FinancialLedgerRecord[]>([]);
  const [devSettings, setDevSettings] = useState<DeveloperPayoutSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [revenueTimeframe, setRevenueTimeframe] = useState<'DAY' | 'MONTH' | 'YEAR' | 'TOTAL'>('MONTH');
  const [timeframeRevenue, setTimeframeRevenue] = useState<{
    day: number;
    month: number;
    year: number;
    total: number;
  }>({ day: 28.5, month: 340.2, year: 1240.0, total: 1540.0 });

  // Step 1: Payout Method Management State
  const [isEditingMethod, setIsEditingMethod] = useState(false);
  const [methodType, setMethodType] = useState<string>('BANK_WIRE');
  const [accountDetails, setAccountDetails] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [savingMethod, setSavingMethod] = useState(false);

  // Step 2: Amount-Only Payout Request State
  const [amount, setAmount] = useState<string>('100');
  const [requestNote, setRequestNote] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Table filters & copy
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Feedback notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyRef = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedRef(refText);
    setTimeout(() => {
      setCopiedRef((prev) => (prev === refText ? null : prev));
    }, 2000);
  };

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/developer/payouts');
      if (res.ok) {
        const data = await res.json();
        if (data.timeframeRevenue) {
          setTimeframeRevenue(data.timeframeRevenue);
        }
        setSummary(data.summary);
        setRecords(data.records || []);
        if (data.settings) {
          setDevSettings(data.settings);
          if (data.settings.payoutMethod) {
            setMethodType(data.settings.payoutMethod);
          }
          if (data.settings.payoutDetails) {
            const rawDetails =
              data.settings.payoutDetails.accountDetails ||
              data.settings.payoutDetails.iban ||
              data.settings.payoutDetails.email ||
              data.settings.payoutDetails.upiId ||
              Object.values(data.settings.payoutDetails).filter(Boolean).join(' • ') ||
              '';
            setAccountDetails(rawDetails);
            setBeneficiaryName(
              data.settings.payoutDetails.beneficiaryName ||
                data.settings.payoutDetails.accountHolder ||
                ''
            );
          }
        }
      }
    } catch (e) {
      console.error('Failed to load developer payout data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutData();
  }, []);

  // 1. Save or Update Developer Payout Method
  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountDetails.trim()) {
      setErrorMsg('Please enter your payout account details.');
      return;
    }

    setSavingMethod(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/developer/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_METHOD',
          payoutMethod: methodType,
          payoutDetails: {
            accountDetails: accountDetails.trim(),
            beneficiaryName: beneficiaryName.trim() || undefined,
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsEditingMethod(false);
        setSuccessMsg(
          'Developer payout method successfully saved! Ab aapko baar-baar payment information dalne ki zaroorat nahi hai.'
        );
        await fetchPayoutData();
      } else {
        setErrorMsg(data.error || 'Failed to save payout method.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving developer payout method.');
    } finally {
      setSavingMethod(false);
    }
  };

  // 2. Delete / Reset Developer Payout Method
  const handleDeleteMethod = async () => {
    if (!window.confirm('Are you sure you want to remove your saved developer payout method?')) return;

    setSavingMethod(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/developer/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_METHOD' }),
      });

      if (res.ok) {
        setDevSettings(null);
        setAccountDetails('');
        setBeneficiaryName('');
        setSuccessMsg('Developer payout method deleted successfully.');
        await fetchPayoutData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to delete payout method.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting payout method.');
    } finally {
      setSavingMethod(false);
    }
  };

  // 3. Submit Payout Request (Amount Only)
  const handleSubmitPayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasConfiguredMethod =
      Boolean(devSettings?.payoutMethod) && Boolean(accountDetails.trim());

    if (!hasConfiguredMethod) {
      setErrorMsg('Please save your payout method first before requesting a payout.');
      setIsEditingMethod(true);
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Please enter a valid payout withdrawal amount greater than 0.');
      return;
    }

    setSubmittingPayout(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/developer/payouts/request', {
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
        setSuccessMsg(
          `Payout request for $${numAmount.toFixed(2)} submitted successfully! Aapka request settlement history table me add ho gaya hai.`
        );
        setRequestNote('');
        await fetchPayoutData();
      } else {
        setErrorMsg(data.error || 'Failed to submit payout request.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error requesting payout.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = r.payoutReference?.toLowerCase().includes(q);
      const matchGame = r.gameTitle?.toLowerCase().includes(q);
      const matchAmt = r.creatorShare?.toString().includes(q);
      return matchRef || matchGame || matchAmt;
    }
    return true;
  });

  const isMethodConfigured =
    Boolean(devSettings?.payoutMethod) && Boolean(accountDetails.trim());

  const selectedMethodObj =
    DEVELOPER_PAYMENT_METHODS.find((m) => m.id === (devSettings?.payoutMethod || methodType)) ||
    DEVELOPER_PAYMENT_METHODS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/developer"
          className="hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Studio Dashboard</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Developer Payouts & Settlement</span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
              Creator Payouts & Settlement
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-semibold text-emerald-700">
              Payout Option Active
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Save your payout method once, then simply enter your desired withdrawal amount to submit instant settlement requests.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayoutData}
            title="Refresh Status"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rate Engine Update Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3.5">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900">
            Payout Calculation & Revenue Distribution
          </h3>
          <p className="text-xs text-indigo-950 leading-relaxed">
            Developer payouts are active. Verified earnings formulas and rate tiers are finalized by platform administrators. Player traffic, gameplay sessions, and engagement durations across all your published titles are tracked in real-time.
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Payout Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Available Creator Balance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Available Balance
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                Ready to Withdraw
              </span>
            </div>
            <div className="font-heading font-black text-3xl text-emerald-600 font-mono">
              ${(summary?.availableBalance ?? 0).toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500">
              Payout option active hai. Rate calculation formula jald finalize kiya jayega.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Withdrawals Active</span>
            </span>
            <span className="font-mono text-indigo-600 font-medium">Creator Studio</span>
          </div>
        </div>

        {/* Card 2: Configured Payout Method */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Configured Method
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  isMethodConfigured
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {isMethodConfigured ? 'Ready' : 'Setup Required'}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                {devSettings?.payoutMethod === 'UPI' ? (
                  <Coins className="w-5 h-5" />
                ) : devSettings?.payoutMethod === 'PAYPAL' ? (
                  <CreditCard className="w-5 h-5" />
                ) : devSettings?.payoutMethod === 'STRIPE' ? (
                  <Zap className="w-5 h-5" />
                ) : (
                  <Building className="w-5 h-5" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {devSettings?.payoutMethod
                    ? devSettings.payoutMethod.replace('_', ' ')
                    : 'NOT CONFIGURED'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {accountDetails || 'Setup below to unlock instant payouts'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Settlement Channel:</span>
            <span className="font-semibold text-slate-800">
              {isMethodConfigured ? 'Direct Channel' : 'Pending Configuration'}
            </span>
          </div>
        </div>

        {/* Card 3: Creator Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Studio Verification
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-[10px] font-bold text-cyan-700">
                Verified
              </span>
            </div>
            <div className="font-heading font-black text-2xl text-slate-900">
              Verified Creator
            </div>
            <p className="text-[11px] text-slate-500">
              Account is in good standing and eligible for settlements.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-slate-700">
              <Shield className="w-3.5 h-3.5 text-cyan-600" />
              <span>Full Access</span>
            </span>
            <span className="font-mono text-cyan-700 font-medium">Standard Tier</span>
          </div>
        </div>
      </div>

      {/* FILTERED REVENUE BREAKDOWN (Day, Month, Year, Total - User Request) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Developer Revenue Telemetry
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Studio Earnings Analytics</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Filter verified net creator revenue across day, month, and year periods.
            </p>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold">
            {[
              { key: 'DAY', label: 'Today (24h)' },
              { key: 'MONTH', label: 'This Month' },
              { key: 'YEAR', label: 'This Year' },
              { key: 'TOTAL', label: 'All-Time' },
            ].map((tf) => (
              <button
                type="button"
                key={tf.key}
                onClick={() => setRevenueTimeframe(tf.key as any)}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  revenueTimeframe === tf.key
                    ? 'bg-white text-emerald-700 font-bold shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtered Revenue Display Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border transition-all ${revenueTimeframe === 'DAY' ? 'bg-emerald-50/60 border-emerald-300 shadow-xs' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Today (Last 24h)
            </span>
            <div className="font-heading font-black text-2xl text-slate-900 font-mono mt-1">
              ${timeframeRevenue.day.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Live ad share</span>
          </div>

          <div className={`p-5 rounded-2xl border transition-all ${revenueTimeframe === 'MONTH' ? 'bg-emerald-50/60 border-emerald-300 shadow-xs' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              This Month
            </span>
            <div className="font-heading font-black text-2xl text-emerald-700 font-mono mt-1">
              ${timeframeRevenue.month.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Current billing period</span>
          </div>

          <div className={`p-5 rounded-2xl border transition-all ${revenueTimeframe === 'YEAR' ? 'bg-emerald-50/60 border-emerald-300 shadow-xs' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              This Year
            </span>
            <div className="font-heading font-black text-2xl text-slate-900 font-mono mt-1">
              ${timeframeRevenue.year.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">YTD earnings</span>
          </div>

          <div className={`p-5 rounded-2xl border transition-all ${revenueTimeframe === 'TOTAL' ? 'bg-emerald-50/60 border-emerald-300 shadow-xs' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              All-Time Gross
            </span>
            <div className="font-heading font-black text-2xl text-indigo-700 font-mono mt-1">
              ${timeframeRevenue.total.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Cumulative platform revenue</span>
          </div>
        </div>
      </div>

      {/* STEP 1: CHOOSE, SAVE, UPDATE & DELETE PAYOUT METHOD */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>1. Payout Destination (Saved Method)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select and save your preferred payout destination once. You can update or change this destination at any time.
            </p>
          </div>

          {isMethodConfigured && !isEditingMethod && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingMethod(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Update Method</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteMethod}
                disabled={savingMethod}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* If Saved: Show the Active Saved Card */}
        {isMethodConfigured && !isEditingMethod ? (
          <div className="p-5 rounded-2xl bg-slate-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                {devSettings?.payoutMethod === 'UPI' && <Coins className="w-6 h-6" />}
                {devSettings?.payoutMethod === 'BANK_WIRE' && <Building className="w-6 h-6" />}
                {devSettings?.payoutMethod === 'PAYPAL' && <CreditCard className="w-6 h-6" />}
                {devSettings?.payoutMethod === 'STRIPE' && <Zap className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">
                    {devSettings?.payoutMethod?.replace('_', ' ') || 'BANK WIRE'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <Check className="w-3 h-3" />
                    <span>Saved & Verified</span>
                  </span>
                </div>
                <p className="text-sm font-mono text-indigo-700 font-semibold">
                  {accountDetails}
                </p>
                {beneficiaryName && (
                  <p className="text-xs text-slate-500">
                    Beneficiary / Studio: <span className="text-slate-800 font-medium">{beneficiaryName}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  Ready for automatic settlement disbursement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Ready for Direct Payout</span>
              </span>
            </div>
          </div>
        ) : !isMethodConfigured && !isEditingMethod ? (
          /* If Not Saved: Prompt Button to Choose & Save */
          <div className="py-8 px-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No Payout Method Saved</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Save your Bank Wire, UPI ID, PayPal, or Stripe account once so you can request payouts by entering the amount.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingMethod(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Choose & Save Payout Method</span>
            </button>
          </div>
        ) : (
          /* Form to Choose, Save or Update Payout Method */
          <form onSubmit={handleSaveMethod} className="space-y-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Select Developer Payment Channel
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEVELOPER_PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = methodType === pm.id;
                  return (
                    <button
                      type="button"
                      key={pm.id}
                      onClick={() => setMethodType(pm.id)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 border-amber-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-white font-bold'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div
                          className={`text-sm font-semibold ${
                            isSelected ? 'text-slate-900' : 'text-slate-800'
                          }`}
                        >
                          {pm.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  {selectedMethodObj?.fieldLabel || 'Account Details'}
                </label>
                <input
                  type="text"
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder={selectedMethodObj?.placeholder}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  {selectedMethodObj?.secondaryLabel || 'Beneficiary / Studio Legal Name'}
                </label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder={selectedMethodObj?.secondaryPlaceholder || 'e.g. PixelForge Studios'}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {isMethodConfigured && (
                <button
                  type="button"
                  onClick={() => setIsEditingMethod(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={savingMethod}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{savingMethod ? 'Saving Method...' : 'Save Payout Method'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* STEP 2: PAYOUT REQUEST (AMOUNT ONLY) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span>2. Request Payout (Enter Amount)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Your saved payout destination is automatically connected. Enter your withdrawal amount to submit the request.
          </p>
        </div>

        <form onSubmit={handleSubmitPayoutRequest} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Enter Withdrawal Amount ($)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Available:{' '}
                  <strong className="text-emerald-700 font-mono">
                    ${(summary?.availableBalance ?? 0).toFixed(2)}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setAmount(String(summary?.availableBalance ?? 0))}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                >
                  Use Max
                </button>
              </div>
            </div>
            <div className="relative max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                $
              </span>
              <input
                type="number"
                min="10"
                step="5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                required
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-3 text-lg font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
              />
            </div>

            {/* Quick Amount Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs text-slate-500">Quick Select:</span>
              {['50', '100', '250', '500', '1000'].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer ${
                    amount === amt
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Receiving Account Indicator */}
          {isMethodConfigured ? (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Receiving via Saved Method:</span>
              <span className="font-mono text-indigo-700 font-semibold">
                {devSettings?.payoutMethod} &bull; {accountDetails}
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Please save your payout destination above before submitting a withdrawal request.</span>
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Note / Reference Memo (Optional)
            </label>
            <input
              type="text"
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="e.g. Monthly creator earnings withdrawal"
              maxLength={200}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={
                submittingPayout ||
                !isMethodConfigured ||
                !amount ||
                Number(amount) <= 0
              }
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-7 py-3 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {submittingPayout
                  ? 'Submitting Request...'
                  : `Submit Payout Request ($${Number(amount || 0).toFixed(2)})`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* STEP 3: FINANCIAL LEDGER & PAYOUT HISTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900">
              History of all withdrawal requests submitted from your account
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              View live status, disbursement methods, and transaction reference IDs for all settlement requests.
            </p>
          </div>

          {/* Search + Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference or game..."
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-44"
            />

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {['ALL', 'FINALIZED', 'ESTIMATED', 'PROCESSING', 'PAID'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Settlement Period / Date</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Payout Method</th>
                <th className="px-5 py-3.5">Game / Source</th>
                <th className="px-5 py-3.5">Payout Reference</th>
                <th className="px-5 py-3.5 text-right">Status (Payout Hua ya Pending)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No payout records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isPaid = r.status === 'PAID' || r.status === 'FINALIZED';
                  const isProcessing = r.status === 'PROCESSING';
                  const isPending = r.status === 'ESTIMATED';
                  const isOnHold = r.status === 'ON_HOLD';
                  const refId = r.payoutReference || (r.paidAt ? 'PO-DEV-VERIFIED' : 'Pending Cycle Close');
                  const isCopied = copiedRef === refId;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        {r.period ||
                          (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Current Cycle')}
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                        ${(r.creatorShare || 0).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          {r.payoutMethod?.includes('UPI') ? (
                            <Coins className="w-3.5 h-3.5" />
                          ) : r.payoutMethod?.includes('PAYPAL') ? (
                            <CreditCard className="w-3.5 h-3.5" />
                          ) : (
                            <Building className="w-3.5 h-3.5" />
                          )}
                          <span>{r.payoutMethod ? r.payoutMethod.split(' ')[0].replace('_', ' ') : 'BANK WIRE'}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
                        {r.gameTitle || 'Studio Creator Share'}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {r.payoutReference || r.paidAt ? (
                          <button
                            type="button"
                            onClick={() => handleCopyRef(refId)}
                            title="Click to copy payout reference"
                            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-700 hover:text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                          >
                            <span>{refId}</span>
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <span className="text-slate-400 text-[10px]">copy</span>
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Pending Cycle Close</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Successfully Paid / Finalized</span>
                          </span>
                        )}

                        {isProcessing && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing Payout</span>
                          </span>
                        )}

                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Review / Scheduled</span>
                          </span>
                        )}

                        {isOnHold && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>On Hold</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
