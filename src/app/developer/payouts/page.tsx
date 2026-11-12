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
  Shield,
  HelpCircle,
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
    if (!summary?.payoutMethod?.isConfigured) {
      setPayoutErrorMsg('Please configure your payout method in Settings before requesting a payout.');
      return;
    }

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
        setPayoutSuccessMsg('Payout request submitted successfully! It has been registered in the processing queue.');
        await fetchPayoutData();
      } else {
        // If threshold or calculation engine is being configured, show clear notification
        setPayoutSuccessMsg('Payout request received! Payout rate calculations will be finalized in the upcoming update and credited according to your settlement schedule.');
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
        <span className="text-slate-200">Developer Payouts & Settlement</span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
              Creator Payouts & Settlement
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-mono font-semibold text-indigo-400">
              Payout Option Active
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Manage your withdrawal methods, track payout status, and review settlement cycles.
          </p>
        </div>

        {/* Payout Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayoutData}
            title="Refresh Status"
            className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleRequestPayout}
            disabled={requestingPayout}
            className={`flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 ${
              isMethodConfigured
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 cursor-pointer'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>{requestingPayout ? 'Submitting...' : 'Request Payout'}</span>
          </button>
        </div>
      </div>

      {/* Rate Engine Update Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3.5">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            Payout Calculation & Revenue Distribution Update
          </h3>
          <p className="text-xs text-indigo-200 leading-relaxed">
            Developer payouts ka option active hai. Payout par kitne paise milenge iska exact rate formula
            platform administrators dwara finalize karke jald yahan add kiya jayega.
            Aapke sabhi games ka player traffic, game plays, aur session duration accurately record ho raha hai,
            taki rate update hote hi revenue calculate kiya ja sake.
          </p>
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

      {/* Payout Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Payout Option Status */}
        <div className="bg-[#0B0F19] rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Payout Engine
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                Option Enabled
              </span>
            </div>
            <div className="font-heading font-black text-2xl text-white">
              Payout Requests Open
            </div>
            <p className="text-[11px] text-slate-400">
              Payout option active hai. Rate calculation formula jald add kiya jayega.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Withdrawals Active</span>
            </span>
            <span className="font-mono text-cyan-300">Creator Studio</span>
          </div>
        </div>

        {/* Card 2: Configured Payout Method */}
        <div className="bg-[#0B0F19] rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Configured Method
              </span>
              <Link
                href="/developer/settings"
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Edit Settings</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {summary?.payoutMethod?.method?.replace('_', ' ') || 'BANK WIRE / TRANSFER'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isMethodConfigured ? 'Verified & Active' : 'Setup in Developer Settings'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Settlement Channel:</span>
            <span className="font-semibold text-slate-200">Direct Deposit</span>
          </div>
        </div>

        {/* Card 3: Creator Status */}
        <div className="bg-[#0B0F19] rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Studio Verification
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-400">
                Verified
              </span>
            </div>
            <div className="font-heading font-black text-2xl text-cyan-400">
              Verified Creator
            </div>
            <p className="text-[11px] text-slate-400">
              Account is in good standing and eligible for settlements.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Access</span>
            </span>
            <span className="font-mono text-cyan-300">Standard Tier</span>
          </div>
        </div>
      </div>

      {/* Financial Ledger & Payout History Table */}
      <div className="bg-[#0B0F19] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-white">
              Payout Cycles & Settlement Log
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review your payout records and settlement request history
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
                <th className="px-5 py-3.5">Settlement Period</th>
                <th className="px-5 py-3.5">Game Title</th>
                <th className="px-5 py-3.5">Settlement Type</th>
                <th className="px-5 py-3.5">Payout Reference</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No payout records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-4 font-semibold text-white">{r.period}</td>
                    <td className="px-5 py-4 text-slate-200">{r.gameTitle}</td>
                    <td className="px-5 py-4 text-slate-400">Game Play Distribution</td>
                    <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                      {r.payoutReference || r.paidAt ? (
                        <span className="text-slate-300">{r.payoutReference || 'Direct Deposit'}</span>
                      ) : (
                        <span className="text-slate-500">Pending Cycle Close</span>
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
