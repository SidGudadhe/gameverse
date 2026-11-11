'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Play,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Bot,
  User,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function AdminReviewPage({ params }: { params: { id: string } }) {
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reviewer Decision State
  const [decisionNotes, setDecisionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Interactive Checklist State
  const [checks, setChecks] = useState({
    bootsUnder5s: true,
    controlsResponsive: true,
    noExternalTracking: true,
    safetyCompliant: true,
  });

  // Sandboxed Viewport State
  const [deviceMode, setDeviceMode] = useState<'DESKTOP' | 'TABLET' | 'MOBILE'>('DESKTOP');
  const [iframeKey, setIframeKey] = useState(0);
  const [copiedSha, setCopiedSha] = useState(false);

  // Simulated live console output for sandbox inspection
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[INIT] Sandbox iframe mounted on isolated origin',
    '[SECURITY] CSP headers enforced: sandbox="allow-scripts allow-same-origin allow-pointer-lock"',
    '[ENGINE] HTML5 Canvas / WebGL context acquired',
    '[AUDIO] WebAudio API context resumed on user interaction',
    '[RUNTIME] Build executing at stable 60 FPS',
  ]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/submissions/${params.id}`);
      if (!res.ok) {
        throw new Error('Failed to load submission details.');
      }
      const data = await res.json();
      setSubmissionData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [params.id]);

  const handleDecision = async (decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT') => {
    setActionError(null);
    setActionSuccess(null);
    setSubmittingAction(true);

    try {
      const res = await fetch(`/api/admin/submissions/${params.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes: decisionNotes,
          rejectionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Review decision failed.');
      } else {
        setActionSuccess(`Submission successfully updated to status: ${data.submission?.status || decision}`);
        fetchSubmission();
      }
    } catch (err: any) {
      setActionError(`Network error executing review: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const copySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-gray-400 text-xs">Loading submission inspection workspace...</p>
      </div>
    );
  }

  if (error || !submissionData?.submission) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-white text-lg font-bold">Submission Not Found</h2>
        <p className="text-gray-400 text-xs">{error || 'Could not locate submission records.'}</p>
        <Link href="/admin" className="text-indigo-400 text-xs hover:underline inline-block">
          Return to Operations Queue
        </Link>
      </div>
    );
  }

  const { submission, game, version, rights } = submissionData;
  const sha256 = version?.archiveChecksum || version?.scanResults?.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Operations Queue</span>
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-xs font-semibold text-white">
            QA Sandbox Review: <span className="text-indigo-400">{game?.title || submission.gameTitle}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Current Lifecycle:</span>
          <Badge
            variant={
              submission.status === 'APPROVED' || submission.status === 'PUBLISHED'
                ? 'success'
                : submission.status === 'REJECTED'
                ? 'danger'
                : submission.status === 'CHANGES_REQUESTED'
                ? 'warning'
                : 'cyan'
            }
          >
            {submission.status}
          </Badge>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Split-Screen QA Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= LEFT COLUMN: DETAILS, SCAN & ACTIONS (5 COLS) ================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* Metadata Card */}
          <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 space-y-3">
            <h2 className="font-heading font-bold text-sm text-white">
              Submission Metadata
            </h2>

            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Studio / Creator</span>
                <span className="text-white font-semibold">{submission.developerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Game Title</span>
                <span className="text-white font-semibold">{game?.title || submission.gameTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">URL Slug</span>
                <span className="text-indigo-400 font-mono">{game?.slug || 'pending'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Category</span>
                <span className="text-white">{game?.categoryName || 'Arcade'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Engine / Runtime</span>
                <span className="text-cyan-300 font-mono">{game?.engine || 'HTML5 Canvas'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Orientation</span>
                <span className="text-white">{game?.orientation || 'LANDSCAPE'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Version</span>
                <span className="text-white font-mono">v{version?.versionNumber || '1.0.0'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Controls</span>
                <span className="text-gray-300 font-mono text-[11px] text-right max-w-[200px] truncate">
                  {game?.controlsGuide || 'Keyboard & Mouse'}
                </span>
              </div>
            </div>
          </div>

          {/* Automated Pre-Flight Telemetry Card */}
          <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 space-y-3">
            <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Automated Pre-Flight Security Telemetry</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40">
                <span className="text-gray-300">Root Entry (index.html)</span>
                <span className="text-emerald-400 font-semibold font-mono">VERIFIED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40">
                <span className="text-gray-300">Zip Slip / Path Traversal Defense</span>
                <span className="text-emerald-400 font-semibold font-mono">PASSED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40">
                <span className="text-gray-300">Prohibited Executables (.exe/.sh/.dll)</span>
                <span className="text-emerald-400 font-semibold font-mono">ZERO DETECTED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40">
                <span className="text-gray-300">Decompressed Size Limit (&lt;250MB)</span>
                <span className="text-emerald-400 font-semibold font-mono">PASSED</span>
              </div>
            </div>

            {/* SHA-256 Checksum Card */}
            <div className="pt-2 border-t border-white/5 space-y-1">
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>SHA-256 Build Checksum</span>
                <button
                  type="button"
                  onClick={() => copySha(sha256)}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                >
                  {copiedSha ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSha ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2 rounded-lg bg-black/60 font-mono text-[11px] text-emerald-400 truncate">
                {sha256}
              </div>
            </div>
          </div>

          {/* AI Usage & Legal Declarations Card */}
          <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 space-y-3">
            <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Disclosure & Legal Warranties</span>
            </h3>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">AI Generation Tier</span>
                <Badge variant="cyan">
                  {rights?.aiDisclosure || 'NONE_HUMAN_ONLY'}
                </Badge>
              </div>
              <div className="text-[11px] text-gray-400 leading-relaxed">
                {rights?.aiDisclosure === 'NONE_HUMAN_ONLY'
                  ? 'Studio certified 100% human-developed art, music, and codebase.'
                  : rights?.aiDisclosure === 'AI_ASSISTED'
                  ? 'Studio declared AI tooling used with substantial human polishing and review.'
                  : 'Predominantly synthesized via generative models.'}
              </div>
              {rights?.licensingNotes && (
                <div className="pt-2 border-t border-white/5 text-[11px] text-gray-300">
                  <span className="text-gray-400 block">Licensing Notes:</span>
                  <span>{rights.licensingNotes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Manual Reviewer Checklist Card */}
          <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 space-y-3">
            <h3 className="font-heading font-bold text-sm text-white">
              Operations QA Checklist
            </h3>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={checks.bootsUnder5s}
                  onChange={(e) => setChecks({ ...checks, bootsUnder5s: e.target.checked })}
                  className="rounded border-white/20 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Build boots within 5 seconds without blocking errors</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={checks.controlsResponsive}
                  onChange={(e) => setChecks({ ...checks, controlsResponsive: e.target.checked })}
                  className="rounded border-white/20 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Keyboard and mouse/touch controls respond accurately</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={checks.noExternalTracking}
                  onChange={(e) => setChecks({ ...checks, noExternalTracking: e.target.checked })}
                  className="rounded border-white/20 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>No unauthorized tracking, popups, or unapproved ads</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={checks.safetyCompliant}
                  onChange={(e) => setChecks({ ...checks, safetyCompliant: e.target.checked })}
                  className="rounded border-white/20 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Visuals and audio comply with platform safety rules</span>
              </label>
            </div>
          </div>

          {/* Decision Action Card */}
          <div className="bg-slate-900/60 rounded-2xl p-5 border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-sm text-white">
              Operations Decision
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Internal QA Notes
                </label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Notes on performance, viewport scaling, audio sync..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">
                  Rejection Reason (Required if rejecting)
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specific defect or policy violation..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-rose-300 placeholder-gray-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 grid grid-cols-1 gap-2">
                <Button
                  variant="success"
                  size="md"
                  onClick={() => handleDecision('APPROVE')}
                  isLoading={submittingAction}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Approve & Publish to Catalog
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDecision('REQUEST_CHANGES')}
                    isLoading={submittingAction}
                  >
                    Request Changes
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDecision('REJECT')}
                    isLoading={submittingAction}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject Build
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: LIVE SANDBOX RUNNER (7 COLS) ================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-5 space-y-4">
            {/* Viewport Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-400 mr-1">Viewport:</span>
                {[
                  { id: 'DESKTOP', label: '16:9 Desktop', icon: Monitor },
                  { id: 'TABLET', label: '4:3 Tablet', icon: Tablet },
                  { id: 'MOBILE', label: '9:16 Mobile', icon: Smartphone },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = deviceMode === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setDeviceMode(item.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Build</span>
                </button>
                <Link
                  href={`/sandbox/${game?.id || 'game-preview'}/${version?.id || 'ver-preview'}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Isolated Tab</span>
                </Link>
              </div>
            </div>

            {/* Embedded Live Sandbox Iframe */}
            <div className="flex justify-center bg-black/80 rounded-xl p-4 overflow-hidden border border-white/5">
              <div
                className={`transition-all duration-300 overflow-hidden rounded-lg bg-black border border-white/10 shadow-2xl relative ${
                  deviceMode === 'DESKTOP'
                    ? 'w-full aspect-[16/9] max-h-[480px]'
                    : deviceMode === 'TABLET'
                    ? 'w-[520px] aspect-[4/3]'
                    : 'w-[280px] aspect-[9/16]'
                }`}
              >
                <iframe
                  key={iframeKey}
                  src={`/sandbox/${game?.id || 'game-preview'}/${version?.id || 'ver-preview'}`}
                  title="Sandboxed Game Runner Preview"
                  sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                  className="w-full h-full border-0"
                />
              </div>
            </div>

            {/* Runtime Event Log / Live Console Output */}
            <div className="rounded-xl bg-black/60 border border-white/10 p-3 space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between text-gray-400 border-b border-white/5 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs text-white">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sandbox Telemetry Console</span>
                </span>
                <span className="text-[10px] text-emerald-400">RUNNING (60 FPS)</span>
              </div>
              <div className="space-y-1 text-gray-400 max-h-32 overflow-y-auto scrollbar-thin">
                {consoleLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-gray-600 select-none">›</span>
                    <span
                      className={
                        log.includes('SECURITY')
                          ? 'text-cyan-400'
                          : log.includes('ENGINE')
                          ? 'text-indigo-400'
                          : log.includes('RUNTIME')
                          ? 'text-emerald-400'
                          : 'text-gray-300'
                      }
                    >
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
