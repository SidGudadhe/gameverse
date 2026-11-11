'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  CreditCard,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Check,
} from 'lucide-react';
import { FinancialLedgerRecord, PayoutSummary } from '@/types';

export default function PayoutsPage() {
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [records, setRecords] = useState<FinancialLedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  const [payoutErrorMsg, setPayoutErrorMsg] = useState<string | null>(null);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/developer/payouts');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setRecords(data.records || []);
      }
    } catch (e) {
      console.error('Failed to load payout data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const handleRequestPayout = async () => {
    if (!summary || summary.availableBalance < 50) return;

    setRequestingPayout(true);
    setPayoutSuccessMsg(null);
    setPayoutErrorMsg(null);

    try {
      const res = await fetch('/api/developer/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (res.ok) {
        setPayoutSuccessMsg(data.message || 'Payout request submitted successfully!');
        await fetchPayoutData();
      } else {
        setPayoutErrorMsg(data.error || 'Failed to submit payout request.');
      }
    } catch (err: any) {
      setPayoutErrorMsg(err.message || 'Network error requesting payout.');
    } finally {
      setRequestingPayout(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const availableBalance = summary?.availableBalance ?? 0;
  const estimatedBalance = summary?.estimatedBalance ?? 0;
  const lifetimePaid = summary?.lifetimePaid ?? 0;
  const thresholdProgress = summary?.thresholdProgress ?? 0;
  const isMethodConfigured = summary?.payoutMethod?.isConfigured ?? false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link
          href="/developer"
          className="hover:text-white transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Studio Dashboard</span>
        </Link>
        <span>/</span>
        <span className="text-slate-200">Earnings & Financial Ledger</span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
              Creator Earnings & Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-mono font-semibold text-indigo-400">
              Net-30 Settlement
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Transparent double-entry reconciliation: 50% Standard Organic & 70% Referral-Boosted
            Net Revenue.
          </p>
        </div>

        {/* Payout Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayoutData}
            title="Refresh Ledger"
            className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleRequestPayout}
            disabled={availableBalance < 50 || requestingPayout || !isMethodConfigured}
            className={`flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 ${
              availableBalance >= 50 && isMethodConfigured
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 cursor-pointer'
                : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>
              {requestingPayout
                ? 'Submitting...'
                : availableBalance >= 50
                ? `Request Payout ($${availableBalance.toFixed(2)})`
                : `Min $50.00 ($${(50 - availableBalance).toFixed(2)} remaining)`}
            </span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {payoutSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{payoutSuccessMsg}</span>
          </div>
          <button
            onClick={() => setPayoutSuccessMsg(null)}
            className="text-emerald-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {payoutErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{payoutErrorMsg}</span>
          </div>
          <button
            onClick={() => setPayoutErrorMsg(null)}
            className="text-rose-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Financial Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Available Balance */}
        <div className="bg-[#0B0F19] rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Available for Payout
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                Finalized
              </span>
            </div>
            <div className="font-heading font-black text-3xl sm:text-4xl text-emerald-400 font-mono">
              ${availableBalance.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400">
              Reconciled closed cycles ready for withdrawal.
            </p>
          </div>

          {/* Threshold Progress */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
              <span>$50.00 Payout Threshold</span>
              <span className="text-slate-200 font-bold">{thresholdProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${Math.min(100, thresholdProgress)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Estimated MTD */}
        <div className="bg-[#0B0F19] rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Estimated Current Month
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-400">
                In-Progress
              </span>
            </div>
            <div className="font-heading font-black text-3xl sm:text-4xl text-cyan-400 font-mono">
              ${estimatedBalance.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-400">
              Real-time ad share & referral bonuses this month.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next Close: Month End</span>
            </span>
            <span className="font-mono text-cyan-300">Net-30 Terms</span>
          </div>
        </div>

        {/* Card 3: Payout Method & Lifetime Disbursed */}
        <div className="bg-[#0B0F19] rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Configured Payout Method
              </span>
              <Link
                href="/developer/settings"
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Settings</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {summary?.payoutMethod?.method?.replace('_', ' ') || 'BANK WIRE'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isMethodConfigured ? 'Verified & Active' : 'Setup Required in Settings'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Lifetime Disbursed:</span>
            <span className="font-bold text-slate-200 font-mono">${lifetimePaid.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Revenue Split Promotion Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Tiered Split: Standard 50% vs Boosted 70% Referral Share</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Players acquired through your custom referral links earn you +20% bonus revenue (70%
              Net Split) on all ad impressions.
            </p>
          </div>
        </div>

        <Link
          href="/developer/referrals"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95 shrink-0"
        >
          <span>Manage Referral Links</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Financial Ledger Table */}
      <div className="bg-[#0B0F19] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-white">
              Historical Revenue Reconciliation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Audit-grade double-entry ledger with transparent platform fee deduction
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {['ALL', 'FINALIZED', 'ESTIMATED', 'PROCESSING', 'PAID'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition-all ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Period</th>
                <th className="px-5 py-3.5">Game Title</th>
                <th className="px-5 py-3.5 font-mono">Gross Revenue</th>
                <th className="px-5 py-3.5 font-mono">Platform Fee (10%)</th>
                <th className="px-5 py-3.5 font-mono">Net Revenue</th>
                <th className="px-5 py-3.5 font-mono text-emerald-400">Creator Share</th>
                <th className="px-5 py-3.5">Payout Reference</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No financial records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-4 font-semibold text-white">{r.period}</td>
                    <td className="px-5 py-4 text-slate-200">{r.gameTitle}</td>
                    <td className="px-5 py-4 font-mono text-slate-300">
                      ${r.grossRevenue.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 font-mono text-rose-400">
                      -${r.deductions.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-300">
                      ${r.netRevenue.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                      ${r.creatorShare.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                      {r.payoutReference || r.paidAt ? (
                        <span className="text-slate-300">{r.payoutReference || 'Direct Wire'}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          r.status === 'FINALIZED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : r.status === 'PAID'
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                            : r.status === 'PROCESSING'
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                            : r.status === 'ON_HOLD'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
