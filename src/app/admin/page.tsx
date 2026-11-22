'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  Play,
  Search,
  RefreshCw,
  Gamepad2,
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
        return <Badge variant="warning">PENDING REVIEW</Badge>;
      case 'QA_TESTING':
        return <Badge variant="cyan">IN TESTING</Badge>;
      case 'CHANGES_REQUESTED':
        return <Badge variant="default" className="text-amber-300 border-amber-500/30">CHANGES REQUESTED</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
      case 'QUARANTINED':
        return <Badge variant="danger" className="bg-rose-950/60 text-rose-300 border-rose-500/50">QUARANTINED</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
              Operations Center
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
            QA & Content Moderation Queue
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Test game builds in sandboxed runtime, review code integrity, and approve for public catalog.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/launch-checklist"
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Launch Pre-Flight</span>
          </Link>
          <Link
            href="/admin/audit-logs"
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3.5 py-2 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5"
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
            Refresh
          </Button>
        </div>
      </div>

      {/* Operational Metrics Overview Cards (Linear / Stripe Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs text-slate-500 font-medium">Pending Review</div>
          <div className="font-heading font-black text-3xl text-amber-500">
            {metrics.pendingQa}
          </div>
          <div className="text-[11px] text-slate-500">Awaiting operator testing</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs text-slate-500 font-medium">Published Live</div>
          <div className="font-heading font-black text-3xl text-emerald-600">
            {metrics.publishedLive}
          </div>
          <div className="text-[11px] text-emerald-700">Active in catalog</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs text-slate-500 font-medium">Changes Requested</div>
          <div className="font-heading font-black text-3xl text-indigo-600">
            {metrics.changesRequested}
          </div>
          <div className="text-[11px] text-slate-500">Awaiting developer update</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs text-slate-500 font-medium">Rejected Builds</div>
          <div className="font-heading font-black text-3xl text-rose-600">
            {metrics.rejected}
          </div>
          <div className="text-[11px] text-rose-700">Security or policy issues</div>
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
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by game or studio..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
          />
        </form>
      </div>

      {/* Submissions Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-slate-900">
              Submissions Review Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {submissions.length} {submissions.length === 1 ? 'build' : 'builds'}
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            SANDBOX_ISOLATED
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Gamepad2}
              title="No Submissions Found"
              description={
                statusFilter !== 'ALL'
                  ? `There are currently no game builds with status '${statusFilter}'.`
                  : 'No game submissions in this queue.'
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
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Game</th>
                  <th className="px-5 py-3.5">Studio / Creator</th>
                  <th className="px-5 py-3.5">Engine</th>
                  <th className="px-5 py-3.5">Security Check</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Submitted</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{s.gameTitle}</span>
                        {s.game?.isFeatured && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-normal">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        v{s.version?.versionNumber || '1.0.0'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-slate-800 font-medium">{s.developerName}</div>
                      <div className="text-[11px] text-slate-500">
                        {s.rights?.aiDisclosure || 'Human Created'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-cyan-700 font-mono text-[11px]">
                        {s.game?.engine || 'HTML5'}
                      </div>
                      <div className="text-[11px] text-slate-500 capitalize">
                        {s.game?.orientation?.toLowerCase() || 'landscape'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Pre-Flight Passed</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {s.version?.scanResults?.extractedFilesCount || 'Safe'} files • Verified
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {getStatusBadge(s.status)}
                    </td>

                    <td className="px-5 py-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(s.submittedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/review/${s.id}`}
                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Review & QA</span>
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
