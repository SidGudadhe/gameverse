'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Lock,
  Award,
  Layers,
  Cpu,
  Coins,
  Server,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LaunchReadinessReport, ProductionLaunchCertificate, LaunchGateResult } from '@/lib/launch';

export default function AdminLaunchChecklistPage() {
  const [report, setReport] = useState<LaunchReadinessReport | null>(null);
  const [certificate, setCertificate] = useState<ProductionLaunchCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [copiedSeal, setCopiedSeal] = useState(false);

  const fetchChecklist = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      // In development or admin session, Bearer token can be passed if stored or handled by cookie/server
      const res = await fetch('/api/admin/launch-sign-off', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setReport(data.evaluation);
        if (data.certificate) {
          setCertificate(data.certificate);
        }
      } else {
        // Fallback for demo / preview if unauthenticated or testing locally
        const testRes = await fetch('/api/health');
        if (testRes.ok) {
          const healthData = await testRes.json();
          // Synthesize display state if previewing without admin session
        }
      }
    } catch (err: any) {
      console.error('Failed to load launch checklist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, []);

  const handleAuthorizeLaunch = async () => {
    setAuthorizing(true);
    setActionMessage(null);
    try {
      // Call sign-off endpoint
      const res = await fetch('/api/admin/launch-sign-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCertificate(data.certificate);
        setActionMessage('Platform production launch signed off and verified successfully!');
      } else {
        setActionMessage(data.error || 'Failed to authorize launch.');
      }
    } catch (err: any) {
      setActionMessage(`Sign-off network error: ${err.message}`);
    } finally {
      setAuthorizing(false);
    }
  };

  const copySeal = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSeal(true);
    setTimeout(() => setCopiedSeal(false), 2000);
  };

  const getGateIcon = (id: string) => {
    switch (id) {
      case 'CORE_ARCHITECTURE':
        return <Cpu className="w-5 h-5 text-indigo-400" />;
      case 'SECURITY_ISOLATION':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'PRIVACY_COMPLIANCE':
        return <Lock className="w-5 h-5 text-purple-400" />;
      case 'FINANCIAL_LEDGER':
        return <Coins className="w-5 h-5 text-amber-400" />;
      case 'CATALOG_PIPELINE':
        return <Layers className="w-5 h-5 text-cyan-400" />;
      case 'EDGE_PERFORMANCE':
        return <Server className="w-5 h-5 text-blue-400" />;
      case 'CREATOR_BETA':
        return <Users className="w-5 h-5 text-pink-400" />;
      default:
        return <Rocket className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin"
              className="text-slate-500 hover:text-slate-900 text-xs flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Operations</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Rocket className="w-3 h-3" />
              Pre-Flight Gate
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
            Production Launch Readiness & Sign-Off Hub
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Strict pre-flight verification across all 7 operational security, compliance, architecture, and revenue gates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchChecklist}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Re-run Pre-Flight
          </Button>
          <Link
            href="/admin/audit-logs"
            className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
            certificate
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {certificate ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />}
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Hero Readiness Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={report?.passed ? 'success' : 'warning'}>
                {report?.passed ? 'ALL GATES CLEARED' : 'PRE-FLIGHT IN PROGRESS'}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">v1.0.0 Production Release</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Platform Release Readiness: {report ? `${report.readinessScore}%` : 'Calculating...'}
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              {report?.passed
                ? 'All 7 pre-flight architectural, security, compliance, ledger, and CDN gates have successfully passed automated validation. GameVerse is primed for global public release.'
                : 'Evaluating platform subsystems. Each operational gate must pass 100% before production release authorization can be executed.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {certificate ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 shadow-xs">
                <Award className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                    Release Sealed & Authorized
                  </div>
                  <div className="text-slate-900 font-mono text-xs mt-0.5 font-semibold">
                    {certificate.certificateId}
                  </div>
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                disabled={!report?.passed || authorizing}
                onClick={handleAuthorizeLaunch}
                leftIcon={<Rocket className={`w-4 h-4 ${authorizing ? 'animate-bounce' : ''}`} />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                {authorizing ? 'Authorizing Release...' : 'Authorize Production Launch'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cryptographic Release Certificate Details (If Sealed) */}
      {certificate && (
        <div className="bg-gradient-to-r from-emerald-50/60 to-indigo-50/60 border border-emerald-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Cryptographic Launch Certificate</h3>
            </div>
            <Badge variant="success">OFFICIALLY SIGNED</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
              <div className="text-slate-500">CERTIFICATE ID</div>
              <div className="text-slate-900 font-semibold mt-1">{certificate.certificateId}</div>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
              <div className="text-slate-500">AUTHORIZED BY</div>
              <div className="text-slate-900 font-semibold mt-1">
                {certificate.authorizedBy.name} ({certificate.authorizedBy.email})
              </div>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
              <div className="text-slate-500">TIMESTAMP</div>
              <div className="text-slate-900 font-semibold mt-1">
                {new Date(certificate.signedAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div className="overflow-hidden">
              <div className="text-[11px] text-slate-500 font-mono">SHA-256 INTEGRITY SEAL</div>
              <div className="text-xs text-emerald-700 font-mono font-semibold truncate select-all">
                {certificate.sha256Seal}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copySeal(certificate.sha256Seal)}
              leftIcon={copiedSeal ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            >
              {copiedSeal ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {/* 7 Operational Gates Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>7 Operational Pre-Flight Gates</span>
          <span className="text-xs text-slate-500 font-normal">
            ({report?.gates.filter((g) => g.passed).length || 0} / 7 verified)
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report?.gates.map((gate) => (
            <div
              key={gate.id}
              className={`p-5 rounded-2xl border transition-all ${
                gate.passed
                  ? 'bg-white border-slate-200 hover:border-emerald-500 shadow-xs'
                  : 'bg-rose-50 border-rose-200 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    {getGateIcon(gate.id)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{gate.title}</h4>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{gate.description}</p>
                  </div>
                </div>

                {gate.passed ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>PASSED</span>
                  </Badge>
                ) : (
                  <Badge variant="danger" className="flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    <span>FAILED</span>
                  </Badge>
                )}
              </div>

              {/* Technical Diagnostics */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 space-y-1">
                {Object.entries(gate.details).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400">{key}:</span>
                    <span className="text-slate-800 font-medium truncate max-w-[220px]">
                      {typeof val === 'boolean'
                        ? val
                          ? 'true'
                          : 'false'
                        : Array.isArray(val)
                        ? `${val.length} items`
                        : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
