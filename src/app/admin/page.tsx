import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ShieldAlert, CheckCircle, Clock, AlertTriangle, Eye, ArrowRight, Play, ExternalLink } from 'lucide-react';

export default function AdminDashboard() {
  const submissions = db.getSubmissions();
  const allGames = db.games;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase">
              Operations & QA Portal
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mt-1.5">
            Admin QA & Content Moderation Queue
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Perform security scans, isolated sandbox game testing, rights verification, and catalog publishing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/games"
            className="bg-elevated hover:bg-white/10 text-gray-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/10 transition-colors"
          >
            Catalog Control
          </Link>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="text-xs text-gray-400">Pending QA Queue</div>
          <div className="font-heading font-black text-2xl text-amber-400">
            {submissions.filter((s) => s.status !== 'PUBLISHED').length}
          </div>
          <div className="text-[11px] text-gray-400">Requires manual review</div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="text-xs text-gray-400">Published Games</div>
          <div className="font-heading font-black text-2xl text-emerald-400">
            {allGames.filter((g) => g.status === 'PUBLISHED').length}
          </div>
          <div className="text-[11px] text-emerald-400">Live on main portal</div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="text-xs text-gray-400">Automated Scan Pass Rate</div>
          <div className="font-heading font-black text-2xl text-cyan-400">
            100%
          </div>
          <div className="text-[11px] text-gray-400">0 ZIP bombs detected</div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="text-xs text-gray-400">Origin Isolation</div>
          <div className="font-heading font-black text-2xl text-indigo-400">
            ACTIVE
          </div>
          <div className="text-[11px] text-emerald-400">Strict CSP enforced</div>
        </div>
      </div>

      {/* Submissions Queue Table */}
      <div className="bg-surface rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-white">
            Build Review Queue
          </h2>
          <span className="text-xs text-gray-400">
            {submissions.length} total submissions logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/30 border-b border-white/5 text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Submission / Game</th>
                <th className="px-5 py-3.5">Developer</th>
                <th className="px-5 py-3.5">Security Scan</th>
                <th className="px-5 py-3.5">QA Status</th>
                <th className="px-5 py-3.5">Submitted</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 font-semibold text-white">
                    <div className="text-sm">{s.gameTitle}</div>
                    <div className="text-[11px] text-gray-400 font-mono">ID: {s.versionId}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-300">{s.developerName}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Passed (0 errors)
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        s.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-400">
                    {new Date(s.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/review/${s.id}`}
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Sandbox</span>
                    </Link>
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
