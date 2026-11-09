import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ArrowLeft, DollarSign, Wallet, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function PayoutsPage() {
  const records = db.financialRecords;
  const availableBalance = records
    .filter((r) => r.status === 'FINALIZED')
    .reduce((acc, r) => acc + r.creatorShare, 0);
  const estimatedMtd = records
    .filter((r) => r.status === 'ESTIMATED')
    .reduce((acc, r) => acc + r.creatorShare, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/developer" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Studio Dashboard</span>
        </Link>
        <span>/</span>
        <span className="text-gray-200">Earnings & Financial Ledger</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
            Creator Earnings & Ledger
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Transparent revenue-sharing calculations: 50% Net Game Revenue after third-party ad-network deductions.
          </p>
        </div>

        <button
          disabled={availableBalance < 50}
          className={`flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg ${
            availableBalance >= 50
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Request Payout ({availableBalance >= 50 ? `$${availableBalance.toFixed(2)}` : 'Min $50.00'})</span>
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-surface rounded-2xl p-6 border border-white/10 space-y-2">
          <div className="text-xs text-gray-400">Available for Payout</div>
          <div className="font-heading font-black text-3xl text-emerald-400 font-mono">
            ${availableBalance.toFixed(2)}
          </div>
          <div className="text-[11px] text-gray-400">
            Reconciled through October 2026
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-6 border border-white/10 space-y-2">
          <div className="text-xs text-gray-400">Estimated MTD (Unfinalized)</div>
          <div className="font-heading font-black text-3xl text-cyan-400 font-mono">
            ${estimatedMtd.toFixed(2)}
          </div>
          <div className="text-[11px] text-gray-400">
            Finalizes on Net-30 cycle
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-6 border border-white/10 space-y-2">
          <div className="text-xs text-gray-400">Revenue Split Tier</div>
          <div className="font-heading font-black text-3xl text-indigo-400">
            50% Net
          </div>
          <div className="text-[11px] text-indigo-300">
            Standard Developer Agreement v1.0
          </div>
        </div>
      </div>

      {/* Financial Ledger Table */}
      <div className="bg-surface rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-white">
            Historical Revenue Reconciliation
          </h2>
          <span className="text-xs text-gray-400 font-mono">
            Audit-Grade Double Entry
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 border-b border-white/5 text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Period</th>
                <th className="px-5 py-3.5">Game Title</th>
                <th className="px-5 py-3.5 font-mono">Gross Ad Rev</th>
                <th className="px-5 py-3.5 font-mono">Deductions (IVT)</th>
                <th className="px-5 py-3.5 font-mono">Net Revenue</th>
                <th className="px-5 py-3.5 font-mono text-emerald-400">Creator Share (50%)</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 font-semibold text-white">{r.period}</td>
                  <td className="px-5 py-4">{r.gameTitle}</td>
                  <td className="px-5 py-4 font-mono">${r.grossRevenue.toFixed(2)}</td>
                  <td className="px-5 py-4 font-mono text-rose-400">-${r.deductions.toFixed(2)}</td>
                  <td className="px-5 py-4 font-mono">${r.netRevenue.toFixed(2)}</td>
                  <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                    ${r.creatorShare.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        r.status === 'FINALIZED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
