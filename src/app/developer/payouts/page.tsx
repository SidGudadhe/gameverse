'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  IndianRupee,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Building,
  Coins,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Check,
  Send,
  Sparkles,
  Filter,
  Search,
  Edit3,
  X,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import { FinancialLedgerRecord, PayoutSummary } from '@/types';
import DeveloperLogo from '@/components/ui/DeveloperLogo';

interface BankAccountInfo {
  accountNumber: string;
  ifscCode: string;
  beneficiaryName: string;
  bankName: string;
}

interface UpiInfo {
  upiId: string;
  beneficiaryName?: string;
}

interface DeveloperPayoutSettings {
  payoutMethod?: string;
  payoutDetails?: Record<string, string>;
  bankAccount?: BankAccountInfo;
  upi?: UpiInfo;
  studioVerified?: boolean;
  currency?: string;
}

export default function PayoutsPage() {
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [records, setRecords] = useState<FinancialLedgerRecord[]>([]);
  const [devSettings, setDevSettings] = useState<DeveloperPayoutSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Timeframe and Status Filter States
  const [revenueTimeframe, setRevenueTimeframe] = useState<'DAY' | 'MONTH' | 'YEAR' | 'TOTAL'>('MONTH');
  const [timeframeRevenue, setTimeframeRevenue] = useState<{
    day: number;
    month: number;
    year: number;
    total: number;
  }>({ day: 2850.0, month: 34020.0, year: 124000.0, total: 154000.0 });

  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'REJECT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Studio Verification State
  const [isStudioVerified, setIsStudioVerified] = useState(true);
  const [togglingVerification, setTogglingVerification] = useState(false);

  // Destination Management Modal State
  const [isEditingDestination, setIsEditingDestination] = useState(false);
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankBeneficiary, setBankBeneficiary] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiBeneficiary, setUpiBeneficiary] = useState('');
  const [savingDestination, setSavingDestination] = useState(false);

  // Withdraw Request Form State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
  const [selectedDestination, setSelectedDestination] = useState<'BANK_WIRE' | 'UPI'>('BANK_WIRE');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Feedback Alerts
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const formatINR = (val: number | undefined | null) => {
    return (
      '₹' +
      Number(val || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

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
          setIsStudioVerified(data.settings.studioVerified ?? true);

          if (data.settings.bankAccount) {
            setBankAccountNumber(data.settings.bankAccount.accountNumber || '');
            setBankIfsc(data.settings.bankAccount.ifscCode || '');
            setBankBeneficiary(data.settings.bankAccount.beneficiaryName || '');
            setBankName(data.settings.bankAccount.bankName || '');
          }
          if (data.settings.upi) {
            setUpiId(data.settings.upi.upiId || '');
            setUpiBeneficiary(data.settings.upi.beneficiaryName || '');
          }
        }
      }
    } catch (e) {
      console.error('Failed to load developer revenue data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutData();
  }, []);

  // Set default withdrawal amount when available balance is loaded
  useEffect(() => {
    if (summary?.availableBalance && summary.availableBalance >= 500) {
      setWithdrawAmount(summary.availableBalance.toString());
    } else {
      setWithdrawAmount('500');
    }
  }, [summary?.availableBalance]);

  // 1. Toggle Studio Verification (Live Testing / Verification)
  const handleToggleVerification = async () => {
    setTogglingVerification(true);
    setFeedbackSuccess(null);
    setFeedbackError(null);

    try {
      const nextState = !isStudioVerified;
      const res = await fetch('/api/developer/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_VERIFICATION',
          studioVerified: nextState,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsStudioVerified(data.studioVerified);
        setFeedbackSuccess(data.message);
        await fetchPayoutData();
      } else {
        setFeedbackError(data.error || 'Failed to toggle studio verification.');
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'Error updating studio verification.');
    } finally {
      setTogglingVerification(false);
    }
  };

  // 2. Save Bank Account & UPI Destination
  const handleSaveDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountNumber.trim() && !upiId.trim()) {
      setFeedbackError('Please enter at least an Indian Bank Account or UPI ID.');
      return;
    }

    setSavingDestination(true);
    setFeedbackSuccess(null);
    setFeedbackError(null);

    try {
      const bankData = bankAccountNumber.trim()
        ? {
            accountNumber: bankAccountNumber.trim(),
            ifscCode: bankIfsc.trim().toUpperCase(),
            beneficiaryName: bankBeneficiary.trim() || 'PixelForge Studios Pvt Ltd',
            bankName: bankName.trim() || 'HDFC Bank',
          }
        : undefined;

      const upiData = upiId.trim()
        ? {
            upiId: upiId.trim().toLowerCase(),
            beneficiaryName: upiBeneficiary.trim() || bankBeneficiary.trim() || 'PixelForge Studios',
          }
        : undefined;

      const res = await fetch('/api/developer/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_BANK_AND_UPI',
          bankAccount: bankData,
          upi: upiData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsEditingDestination(false);
        setFeedbackSuccess('Bank Account and UPI details successfully saved and connected!');
        await fetchPayoutData();
      } else {
        setFeedbackError(data.error || 'Failed to save settlement destinations.');
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'Network error saving destination.');
    } finally {
      setSavingDestination(false);
    }
  };

  // 3. Submit Withdrawal Request
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verification Guard
    if (!isStudioVerified) {
      setFeedbackError(
        'Studio Verification Required: Your studio is currently unverified. Earnings and withdrawal requests are blocked until studio verification is completed.'
      );
      return;
    }

    const numAmount = Number(withdrawAmount);
    if (!numAmount || isNaN(numAmount) || numAmount < 500) {
      setFeedbackError('The minimum withdrawal threshold is ₹500.00 INR.');
      return;
    }

    const currentAvailable = summary?.availableBalance ?? 0;
    if (numAmount > currentAvailable && currentAvailable > 0) {
      setFeedbackError(
        `Withdrawal amount (${formatINR(numAmount)}) exceeds your available balance of ${formatINR(
          currentAvailable
        )}.`
      );
      return;
    }

    setSubmittingWithdraw(true);
    setFeedbackSuccess(null);
    setFeedbackError(null);

    try {
      const res = await fetch('/api/developer/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_PAYOUT',
          amount: numAmount,
          payoutMethod: selectedDestination,
          note: withdrawNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackSuccess(
          `Withdrawal request for ${formatINR(
            numAmount
          )} submitted successfully to your ${selectedDestination === 'UPI' ? 'UPI ID' : 'Bank Account'}!`
        );
        setWithdrawNote('');
        await fetchPayoutData();
      } else {
        setFeedbackError(data.error || 'Failed to submit withdrawal request.');
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'Error processing withdrawal request.');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Helper to map record status to 3 categories: SUCCESS, PENDING, REJECT
  const mapStatusToCategory = (status: string): 'SUCCESS' | 'PENDING' | 'REJECT' => {
    if (status === 'SUCCESS' || status === 'PAID') return 'SUCCESS';
    if (status === 'REJECT' || status === 'REJECTED' || status === 'ON_HOLD') return 'REJECT';
    return 'PENDING'; // FINALIZED, PROCESSING, ESTIMATED, PENDING
  };

  // Filter records by status category and search query
  const filteredRecords = records.filter((r) => {
    const category = mapStatusToCategory(r.status);
    if (historyFilter !== 'ALL' && category !== historyFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = r.payoutReference?.toLowerCase().includes(q);
      const matchGame = r.gameTitle?.toLowerCase().includes(q);
      const matchAmt = r.creatorShare?.toString().includes(q);
      const matchStatus = r.status?.toLowerCase().includes(q);
      const matchReason = r.rejectionReason?.toLowerCase().includes(q);
      return matchRef || matchGame || matchAmt || matchStatus || matchReason;
    }
    return true;
  });

  const successCount = records.filter((r) => mapStatusToCategory(r.status) === 'SUCCESS').length;
  const pendingCount = records.filter((r) => mapStatusToCategory(r.status) === 'PENDING').length;
  const rejectCount = records.filter((r) => mapStatusToCategory(r.status) === 'REJECT').length;

  const connectedBank = devSettings?.bankAccount;
  const connectedUpi = devSettings?.upi;
  const hasConnectedDestinations = Boolean(connectedBank?.accountNumber || connectedUpi?.upiId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in font-sans text-slate-900">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <DeveloperLogo size="lg" />
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link
                href="/developer"
                className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Studio Dashboard</span>
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Revenue Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Developer Revenue Ledger</span>
              <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                INR (₹) Standard
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time studio balance, verified Indian settlement channels (Bank Wire + UPI), and settlement history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPayoutData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {feedbackSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            onClick={() => setFeedbackSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {feedbackError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{feedbackError}</span>
          </div>
          <button
            onClick={() => setFeedbackError(null)}
            className="text-rose-700 hover:text-rose-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3 CORE SUMMARY & DESTINATION CARDS                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1: AVAILABLE BALANCE */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-purple-950 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-800">
          <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md text-emerald-400 border border-white/10">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    AVAILABLE BALANCE
                  </div>
                  <div className="text-xs text-slate-300">Net Audited Earnings</div>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                  isStudioVerified
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {isStudioVerified ? 'Ready for Withdrawal' : 'Withdrawals Locked'}
              </span>
            </div>

            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {formatINR(summary?.availableBalance ?? 18500.0)}
              </div>
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <span>Minimum settlement threshold:</span>
                <span className="font-mono font-bold text-white">₹500.00</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Estimated MTD: <strong className="text-slate-200 font-mono">{formatINR(summary?.estimatedBalance ?? 6450.0)}</strong>
            </span>
            <a
              href="#withdraw-request-section"
              className="text-purple-300 hover:text-white font-bold flex items-center gap-1 transition-colors"
            >
              <span>Withdraw Funds</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* CARD 2: BANK WIRE + UPI DESTINATION */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    BANK WIRE & UPI
                  </div>
                  <div className="text-xs text-slate-600">Settlement Destination</div>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                  hasConnectedDestinations
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {hasConnectedDestinations ? 'Connected' : 'Action Required'}
              </span>
            </div>

            <div className="space-y-3 mt-2">
              {/* Bank Wire Details */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {connectedBank?.bankName || 'HDFC Bank'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      A/C: ••••••••{connectedBank?.accountNumber?.slice(-4) || '5012'} | IFSC: {connectedBank?.ifscCode || 'HDFC0001234'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Wire Active
                </span>
              </div>

              {/* UPI Details */}
              <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Instant UPI VPA</div>
                    <div className="text-[11px] text-purple-900 font-mono font-medium">
                      {connectedUpi?.upiId || 'pixelforge@okhdfcbank'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  UPI Active
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Beneficiary: PixelForge Studios</span>
            <button
              onClick={() => setIsEditingDestination(true)}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Connect / Edit</span>
            </button>
          </div>
        </div>

        {/* CARD 3: STUDIO VERIFICATION (Green/Red Tick & Business Rule) */}
        <div
          className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between transition-all ${
            isStudioVerified
              ? 'bg-gradient-to-br from-emerald-50/70 via-white to-white border-emerald-200'
              : 'bg-gradient-to-br from-rose-50/80 via-white to-white border-rose-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold border ${
                    isStudioVerified
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-rose-100 text-rose-700 border-rose-200'
                  }`}
                >
                  {isStudioVerified ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    STUDIO VERIFICATION
                  </div>
                  <div className="text-xs text-slate-600">Compliance & Earning State</div>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  isStudioVerified
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {isStudioVerified ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Earning Active</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-rose-600" />
                    <span>Earning Paused</span>
                  </>
                )}
              </span>
            </div>

            {/* Verification Content */}
            <div className="mt-3">
              <div className="flex items-center gap-3">
                {isStudioVerified ? (
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                    <XCircle className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <div className="text-base font-black text-slate-900">
                    {isStudioVerified ? 'Verified Game Studio' : 'Unverified Studio Identity'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isStudioVerified
                      ? 'All game monetization & ad revenue distribution active.'
                      : 'Not verified me earning nhi hogi (Monetization locked).'}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-white/80 border border-slate-200/80 text-xs text-slate-600">
                {isStudioVerified ? (
                  <span className="flex items-center gap-2 text-emerald-800 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Full rights confirmed. Payout requests process instantly.</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-rose-800 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Verify studio legal identity to unlock monetization and withdrawals.</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Simulation / Testing:</span>
            <button
              onClick={handleToggleVerification}
              disabled={togglingVerification}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                isStudioVerified
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {togglingVerification ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : isStudioVerified ? (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Set Unverified</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify Studio Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: STUDIO EARNINGS ANALYTICS                                      */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 font-mono">
              TELEMETRY & MONETIZATION
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>Studio Earnings Analytics</span>
            </h2>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
            {(['DAY', 'MONTH', 'YEAR', 'TOTAL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setRevenueTimeframe(tf)}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  revenueTimeframe === tf
                    ? 'bg-white text-purple-700 shadow-xs font-black'
                    : 'hover:text-slate-900'
                }`}
              >
                {tf === 'DAY'
                  ? 'Today (Day)'
                  : tf === 'MONTH'
                  ? 'This Month'
                  : tf === 'YEAR'
                  ? 'Year 2026'
                  : 'All-Time Total'}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase font-mono">
              {revenueTimeframe} GROSS REVENUE
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
              {revenueTimeframe === 'DAY'
                ? formatINR(timeframeRevenue.day * 1.1)
                : revenueTimeframe === 'MONTH'
                ? formatINR(timeframeRevenue.month * 1.1)
                : revenueTimeframe === 'YEAR'
                ? formatINR(timeframeRevenue.year * 1.1)
                : formatINR(timeframeRevenue.total * 1.1)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Direct ad impressions & game plays</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase font-mono">
              PLATFORM HOSTING & NETWORK
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-700 font-mono mt-1">
              {revenueTimeframe === 'DAY'
                ? formatINR(timeframeRevenue.day * 0.1)
                : revenueTimeframe === 'MONTH'
                ? formatINR(timeframeRevenue.month * 0.1)
                : revenueTimeframe === 'YEAR'
                ? formatINR(timeframeRevenue.year * 0.1)
                : formatINR(timeframeRevenue.total * 0.1)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Infrastructure, CDN & processing</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="text-[11px] font-bold text-emerald-800 uppercase font-mono">
              NET STUDIO REVENUE
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
              {revenueTimeframe === 'DAY'
                ? formatINR(timeframeRevenue.day)
                : revenueTimeframe === 'MONTH'
                ? formatINR(timeframeRevenue.month)
                : revenueTimeframe === 'YEAR'
                ? formatINR(timeframeRevenue.year)
                : formatINR(timeframeRevenue.total)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1">Accrued to studio account</div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
            <div className="text-[11px] font-bold text-purple-800 uppercase font-mono">
              DISBURSED SETTLEMENTS
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono mt-1">
              {formatINR(summary?.lifetimePaid ?? 12500.0)}
            </div>
            <div className="text-[11px] text-purple-600 mt-1">Settled via Bank Wire / UPI</div>
          </div>
        </div>

        {/* Visual Revenue Streams Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Revenue Stream Breakdown ({revenueTimeframe})</span>
            <span className="font-mono text-purple-700">100% Reconciled</span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
            <div className="bg-purple-600 h-full" style={{ width: '68%' }} title="HTML5 Video Ads (68%)" />
            <div className="bg-blue-500 h-full" style={{ width: '22%' }} title="Player Pass Revenue (22%)" />
            <div className="bg-emerald-500 h-full" style={{ width: '10%' }} title="Community Pool (10%)" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
              <span className="text-slate-600">Video Ads & Banners: <strong>68%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-slate-600">Player Subscriptions: <strong>22%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-600">Reward Pool Share: <strong>10%</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: WITHDRAW REQUEST (Directly Below Analytics)                     */}
      {/* ========================================================================= */}
      <div
        id="withdraw-request-section"
        className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 font-mono">
              INSTANT SETTLEMENT
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-600" />
              <span>Withdraw Request</span>
            </h2>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Available to Withdraw:</div>
            <div className="text-lg font-black text-slate-900 font-mono">
              {formatINR(summary?.availableBalance ?? 18500.0)}
            </div>
          </div>
        </div>

        {/* Studio Unverified Banner Blocking Withdrawal */}
        {!isStudioVerified ? (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-950">
                  Studio Verification Required to Submit Withdrawals
                </h3>
                <p className="text-xs text-rose-800">
                  Your studio is currently unverified. Business rule enforcement requires verified status before any
                  settlement or withdrawal request can be processed.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
              <span className="text-xs text-rose-700 font-medium">
                Want to test this feature?
              </span>
              <button
                onClick={handleToggleVerification}
                disabled={togglingVerification}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
              >
                Verify Studio (Simulate)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitWithdrawal} className="space-y-6">
            {/* Amount input & presets */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Withdrawal Amount in Indian Rupees (₹)
              </label>

              <div className="relative max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 font-black text-lg">
                  ₹
                </div>
                <input
                  type="number"
                  min="500"
                  step="1"
                  max={summary?.availableBalance ?? 100000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                  placeholder="500.00"
                  required
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {[500, 1000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setWithdrawAmount(preset.toString())}
                    className="px-3 py-1 rounded-xl text-xs font-bold font-mono border border-slate-200 bg-slate-50 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all cursor-pointer"
                  >
                    ₹{preset.toLocaleString('en-IN')}
                  </button>
                ))}
                {summary?.availableBalance && summary.availableBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(summary.availableBalance.toString())}
                    className="px-3 py-1 rounded-xl text-xs font-bold font-mono border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all cursor-pointer"
                  >
                    Max All ({formatINR(summary.availableBalance)})
                  </button>
                )}
              </div>
            </div>

            {/* Destination Selection (Bank Wire vs UPI) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Select Destination Channel
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                {/* Bank Wire Option */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                    selectedDestination === 'BANK_WIRE'
                      ? 'bg-purple-50/50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="destinationChoice"
                    checked={selectedDestination === 'BANK_WIRE'}
                    onChange={() => setSelectedDestination('BANK_WIRE')}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      <span>Direct Bank Wire (NEFT/IMPS)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {connectedBank?.bankName || 'HDFC Bank'} ••••{connectedBank?.accountNumber?.slice(-4) || '5012'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      IFSC: {connectedBank?.ifscCode || 'HDFC0001234'}
                    </div>
                  </div>
                </label>

                {/* UPI Option */}
                <label
                  className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                    selectedDestination === 'UPI'
                      ? 'bg-purple-50/50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="destinationChoice"
                    checked={selectedDestination === 'UPI'}
                    onChange={() => setSelectedDestination('UPI')}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-purple-600" />
                      <span>Instant UPI Settlement (VPA)</span>
                    </div>
                    <div className="text-[11px] text-purple-900 font-mono font-bold mt-0.5">
                      {connectedUpi?.upiId || 'pixelforge@okhdfcbank'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Instant 24x7 Realtime Transfer</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Optional Memo */}
            <div className="space-y-1.5 max-w-lg">
              <label className="block text-xs font-medium text-slate-600">
                Optional Internal Note / Memo
              </label>
              <input
                type="text"
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                placeholder="e.g. November 2026 Studio Operational Payout"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingWithdraw}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingWithdraw ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  Submit Instant Withdrawal ({formatINR(Number(withdrawAmount || 0))})
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: WITHDRAWAL HISTORY (SUCCESS, PENDING, REJECT)                   */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 font-mono">
              FINANCIAL AUDIT TRAIL
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span>Withdrawal & Settlement History</span>
            </h2>
          </div>

          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference or UTR..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-mono"
            />
          </div>
        </div>

        {/* History Status Category Tabs: SUCCESS, PENDING, REJECT */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setHistoryFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              historyFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All Requests</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-750 text-slate-200">
              {records.length}
            </span>
          </button>

          <button
            onClick={() => setHistoryFilter('SUCCESS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              historyFilter === 'SUCCESS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Success</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-700 text-white">
              {successCount}
            </span>
          </button>

          <button
            onClick={() => setHistoryFilter('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              historyFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-700 text-white">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setHistoryFilter('REJECT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              historyFilter === 'REJECT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-700 text-white">
              {rejectCount}
            </span>
          </button>
        </div>

        {/* Withdrawal Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Reference ID / UTR</th>
                <th className="py-3 px-4">Request Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Audit Memo / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <div>No withdrawal records found for the selected filter.</div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const category = mapStatusToCategory(record.status);
                  const isSuccess = category === 'SUCCESS';
                  const isPending = category === 'PENDING';
                  const isReject = category === 'REJECT';

                  const refCode = record.payoutReference || record.id;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Ref ID & Copy */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>{refCode}</span>
                          <button
                            onClick={() => handleCopyRef(refCode)}
                            title="Copy reference code"
                            className="text-slate-400 hover:text-slate-700 p-1"
                          >
                            {copiedRef === refCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {record.createdAt
                          ? new Date(record.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">
                        {formatINR(record.creatorShare)}
                      </td>

                      {/* Destination */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {record.payoutMethod === 'UPI' ? (
                            <>
                              <Coins className="w-3 h-3 text-purple-600" />
                              <span>UPI</span>
                            </>
                          ) : (
                            <>
                              <Building className="w-3 h-3 text-blue-600" />
                              <span>Bank Wire</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Status: SUCCESS, PENDING, REJECT */}
                      <td className="py-3.5 px-4">
                        {isSuccess && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>SUCCESS</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>PENDING</span>
                          </span>
                        )}
                        {isReject && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>REJECT</span>
                          </span>
                        )}
                      </td>

                      {/* Audit Memo / Rejection Reason */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {isReject ? (
                          <span className="text-rose-700 font-medium">
                            {record.rejectionReason || 'Declined during branch verification check.'}
                          </span>
                        ) : isSuccess ? (
                          <span className="text-emerald-700">
                            Settled via UTR clearance ({record.paidAt ? new Date(record.paidAt).toLocaleTimeString() : 'Verified'})
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            Queued for automated settlement processing.
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

      {/* ========================================================================= */}
      {/* CONNECT / EDIT BANK & UPI MODAL                                           */}
      {/* ========================================================================= */}
      {isEditingDestination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  <span>Connect Settlement Destinations</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provide your Indian Bank Account and UPI ID for automated withdrawals.
                </p>
              </div>
              <button
                onClick={() => setIsEditingDestination(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDestination} className="space-y-5">
              {/* Bank Wire Subsection */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase font-mono">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>1. Indian Bank Account Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="e.g. 918273645012"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Beneficiary Legal Name
                    </label>
                    <input
                      type="text"
                      value={bankBeneficiary}
                      onChange={(e) => setBankBeneficiary(e.target.value)}
                      placeholder="e.g. PixelForge Studios Pvt Ltd"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* UPI Subsection */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5 uppercase font-mono">
                  <Coins className="w-4 h-4 text-purple-600" />
                  <span>2. Instant UPI Destination</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                      placeholder="e.g. pixelforge@okhdfcbank"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      UPI Beneficiary Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={upiBeneficiary}
                      onChange={(e) => setUpiBeneficiary(e.target.value)}
                      placeholder="e.g. PixelForge Studios"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingDestination(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDestination}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingDestination ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Destinations</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
