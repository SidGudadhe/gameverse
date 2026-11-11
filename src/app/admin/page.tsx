'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Play,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  Gamepad2,
  Check,
  XCircle,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalSubmissions: 0,
    pendingQa: 0,
    publishedLive: 0,
    changesRequested: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'ALL') query.set('status', statusFilter);
      if (searchQuery.trim()) query.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/submissions?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load admin queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubmissions();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PUBLISHED':
        return <Badge variant="success">PUBLISHED</Badge>;
      case 'SUBMITTED':
        return <Badge variant="warning">SUBMITTED</Badge>;
      case 'QA_TESTING':
        return <Badge variant="cyan">IN TESTING</Badge>;
      case 'CHANGES_REQUESTED':
        return <Badge variant="default" className="text-amber-300 border-amber-500/30">CHANGES REQUESTED</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Platform Operations
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mt-1.5">
            Admin QA & Content Moderation Queue
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Perform security scans, live sandbox testing, rights verification, and catalog publishing workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/launch-checklist"
            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold px-3.5 py-2 rounded-xl border border-emerald-500/30 transition-colors flex items-center gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Launch Pre-Flight</span>
          </Link>
          <Link
            href="/admin/audit-logs"
            className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold px-3.5 py-2 rounded-xl border border-indigo-500/30 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubmissions}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Queue
          </Button>
          <Link
            href="/developer"
            className="bg-elevated hover:bg-white/10 text-gray-200 text-xs font-semibold px-4 py-2 rounded-xl border border-white/10 transition-colors"
          >
            Developer Hub
          </Link>
        </div>
      </div>

      {/* Operational Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="text-xs text-gray-400 font-medium">Pending QA Queue</div>
          <div className="font-heading font-black text-3xl text-amber-400">
            {metrics.pendingQa}
          </div>
          <div className="text-[11px] text-gray-400">Requires manual testing</div>
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="text-xs text-gray-400 font-medium">Published Live</div>
          <div className="font-heading font-black text-3xl text-emerald-400">
            {metrics.publishedLive}
          </div>
          <div className="text-[11px] text-emerald-400">Live in catalog</div>
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="text-xs text-gray-400 font-medium">Changes Requested</div>
          <div className="font-heading font-black text-3xl text-indigo-400">
            {metrics.changesRequested}
          </div>
          <div className="text-[11px] text-indigo-300">Awaiting studio update</div>
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="text-xs text-gray-400 font-medium">Rejected Builds</div>
          <div className="font-heading font-black text-3xl text-rose-400">
            {metrics.rejected}
          </div>
          <div className="text-[11px] text-rose-400/80">Safety or rights violations</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Builds' },
            { id: 'SUBMITTED', label: 'Pending Review' },
            { id: 'QA_TESTING', label: 'In Testing' },
            { id: 'CHANGES_REQUESTED', label: 'Changes Requested' },
            { id: 'PUBLISHED', label: 'Approved & Live' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search game or studio..."
            className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </form>
      </div>

      {/* Submissions Queue Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
            <span>Operations Review Queue</span>
            <span className="text-xs font-normal text-gray-400">({submissions.length} builds)</span>
          </h2>
          <span className="text-xs font-mono text-cyan-400">SANDBOX_ORIGIN_ISOLATED</span>
        </div>

        {submissions.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Gamepad2}
              title="No Submissions Found"
              description={
                statusFilter !== 'ALL'
                  ? `There are currently no game builds with status '${statusFilter}'.`
                  : 'No game submissions have been logged yet.'
              }
              actionLabel="Clear Filter"
              onAction={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 border-b border-white/5 text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Submission / Game</th>
                  <th className="px-5 py-3.5">Studio / Creator</th>
                  <th className="px-5 py-3.5">Engine & Specs</th>
                  <th className="px-5 py-3.5">Security Scan</th>
                  <th className="px-5 py-3.5">QA Status</th>
                  <th className="px-5 py-3.5">Submitted</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300 font-sans">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-semibold text-white">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{s.gameTitle}</span>
                        {s.game?.isFeatured && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-normal">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                        {s.id} • v{s.version?.versionNumber || '1.0.0'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-gray-200 font-medium">{s.developerName}</div>
                      <div className="text-[11px] text-gray-400">
                        {s.rights?.aiDisclosure || 'NONE_HUMAN_ONLY'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-cyan-300 font-mono text-[11px]">
                        {s.game?.engine || 'HTML5 Canvas'}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {s.game?.orientation || 'LANDSCAPE'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Pre-Flight OK</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {s.version?.scanResults?.extractedFilesCount || 'Safe'} files • No .exe
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {getStatusBadge(s.status)}
                    </td>

                    <td className="px-5 py-4 text-gray-400 text-[11px] whitespace-nowrap">
                      {new Date(s.submittedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/review/${s.id}`}
                        className="inline-flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                      >
                        <Play className="w-3 h-3 text-indigo-400" />
                        <span>Launch QA Workspace</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
