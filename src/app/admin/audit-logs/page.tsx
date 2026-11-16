'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  ArrowLeft,
  Filter,
  Eye,
  Lock,
  Key,
  Calendar,
  User,
  Hash,
  X,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AuditLog } from '@/types';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [integrityStatus, setIntegrityStatus] = useState<{
    valid: boolean;
    totalChecked: number;
    reason?: string;
  }>({ valid: true, totalChecked: 0 });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'ALL') params.set('action', actionFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('limit', '100');

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.integrity) {
          setIntegrityStatus(data.integrity);
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    if (action.includes('ERASURE') || action.includes('DELETE') || action.includes('REJECT')) {
      return <Badge variant="danger">{action}</Badge>;
    }
    if (action.includes('APPROVE') || action.includes('PUBLISH') || action.includes('PAID')) {
      return <Badge variant="success">{action}</Badge>;
    }
    if (action.includes('DSAR') || action.includes('EXPORT') || action.includes('SETTLE')) {
      return <Badge variant="cyan">{action}</Badge>;
    }
    if (action.includes('LOGIN') || action.includes('AUTH') || action.includes('2FA')) {
      return <Badge variant="default" className="text-indigo-300 border-indigo-500/30">{action}</Badge>;
    }
    return <Badge variant="warning">{action}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Queue</span>
            </Link>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1.5 flex items-center gap-3">
            <span>Cryptographic Security Audit Log</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Tamper-evident, SHA-256 chained administrative activity trail conforming to ISO 27001, GDPR, and DPDP mandates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Cryptographic Chain Integrity Indicator */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-medium ${
              integrityStatus.valid
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
            }`}
          >
            {integrityStatus.valid ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            )}
            <span>
              {integrityStatus.valid
                ? `100% Chain Intact (${integrityStatus.totalChecked} verified)`
                : 'Integrity Violation Detected!'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          {['ALL', 'AUTH', 'APPROVE', 'SETTLE', 'PRIVACY', 'REJECT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActionFilter(cat)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                actionFilter === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by actor, target, or action..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
          <Button type="submit" size="sm" variant="primary">
            Filter
          </Button>
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Action</th>
                <th className="py-3.5 px-4 font-semibold">Actor</th>
                <th className="py-3.5 px-4 font-semibold">Target</th>
                <th className="py-3.5 px-4 font-semibold">IP / Host</th>
                <th className="py-3.5 px-4 font-semibold">Chain Hash</th>
                <th className="py-3.5 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.actorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actorId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{log.targetType}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.targetId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-cyan-700 font-medium">
                      {log.tamperHash ? log.tamperHash.substring(0, 10) + '...' : 'Genesis'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1 text-[11px]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Detail Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-indigo-600 font-mono uppercase tracking-wider font-semibold">
                  Audit Record Inspector
                </span>
                <h3 className="font-heading font-bold text-lg text-slate-900 mt-0.5">
                  {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Log ID</span>
                <span className="font-mono text-slate-900 text-[11px] font-semibold">{selectedLog.id}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Timestamp</span>
                <span className="text-slate-900 font-medium">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Actor Identity</span>
                <span className="text-slate-900 font-medium">{selectedLog.actorName} ({selectedLog.actorId})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block text-[11px]">Target Resource</span>
                <span className="text-slate-900 font-medium">{selectedLog.targetType} • {selectedLog.targetId}</span>
              </div>
            </div>

            {/* Cryptographic Hashes */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  SHA-256 Tamper Proof
                </span>
                <span className="text-emerald-700 font-semibold">Immutable</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Previous Hash:</span>
                <span className="text-slate-700 text-[11px] break-all">{selectedLog.previousHash || 'Genesis Record'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Current Record Hash:</span>
                <span className="text-indigo-600 text-[11px] break-all font-semibold">{selectedLog.tamperHash || 'Genesis Record'}</span>
              </div>
            </div>

            {/* Structured Details JSON */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Action Payload & Context:</span>
              <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-[11px] font-mono overflow-x-auto max-h-48">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="primary" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
    </div>
  );
}
