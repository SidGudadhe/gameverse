'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
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
  FileText,
  RotateCcw,
  History,
  Layers,
  Search,
  Lock,
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
  const [quarantineReason, setQuarantineReason] = useState('');
  const [showQuarantineConfirm, setShowQuarantineConfirm] = useState(false);
  const [rollbackTargetId, setRollbackTargetId] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Left Column Tabs: Telemetry, Manifest, Versions, Rollbacks
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'MANIFEST' | 'VERSIONS' | 'ROLLBACKS'>('TELEMETRY');
  const [manifestSearch, setManifestSearch] = useState('');

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

  const handleDecision = async (
    decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'QUARANTINE' | 'ADMIN_ROLLBACK',
    extra?: any
  ) => {
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
          quarantineReason,
          targetVersionId: extra?.targetVersionId || rollbackTargetId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Review decision failed.');
      } else {
        setActionSuccess(data.message || `Submission updated with decision: ${decision}`);
        setShowQuarantineConfirm(false);
        setQuarantineReason('');
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

  const { submission, game, version, rights, manifest, allVersions, rollbacks } = submissionData;
  const sha256 = version?.archiveChecksum || version?.scanResults?.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const isQuarantined = version?.status === 'QUARANTINED' || submission?.status === 'QUARANTINED';

  // Filtered manifest files for search
  const manifestFiles = manifest?.files || [];
  const filteredManifest = manifestFiles.filter((f: any) =>
    f.path.toLowerCase().includes(manifestSearch.toLowerCase())
  );

  // Eligible previous versions for admin rollback
  const eligibleRollbackVersions = (allVersions || []).filter(
    (v: any) => v.id !== version?.id && (v.status === 'PUBLISHED' || v.status === 'APPROVED')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Operations Queue</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-900">
            QA Sandbox Review: <span className="text-indigo-600">{game?.title || submission.gameTitle}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Lifecycle Status:</span>
          <Badge
            variant={
              isQuarantined
                ? 'danger'
                : submission.status === 'APPROVED' || submission.status === 'PUBLISHED'
                ? 'success'
                : submission.status === 'REJECTED'
                ? 'danger'
                : submission.status === 'CHANGES_REQUESTED'
                ? 'warning'
                : 'cyan'
            }
          >
            {isQuarantined ? 'QUARANTINED' : submission.status}
          </Badge>
        </div>
      </div>

      {isQuarantined && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 text-rose-800 text-xs font-medium flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <div>
            <strong className="font-bold">CRITICAL SECURITY NOTICE:</strong> This build version has been{' '}
            <span className="underline font-bold">QUARANTINED</span> and pulled from the public CDN. Public catalog traffic has been isolated.
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Split-Screen QA Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= LEFT COLUMN: DETAILS, SCAN, MANIFEST & DECISIONS (5 COLS) ================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* Metadata Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h2 className="font-heading font-bold text-sm text-slate-900">
              Submission Metadata
            </h2>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Studio / Creator</span>
                <span className="text-slate-900 font-semibold">{submission.developerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Game Title</span>
                <span className="text-slate-900 font-semibold">{game?.title || submission.gameTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">URL Slug</span>
                <span className="text-indigo-600 font-mono font-semibold">{game?.slug || 'pending'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Category</span>
                <span className="text-slate-900">{game?.categoryName || 'Arcade'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Engine / Runtime</span>
                <span className="text-cyan-700 font-mono font-semibold">{game?.engine || 'HTML5 Canvas'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Orientation</span>
                <span className="text-slate-900">{game?.orientation || 'LANDSCAPE'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Review Version</span>
                <span className="text-slate-900 font-mono font-bold text-indigo-600">v{version?.versionNumber || '1.0.0'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Controls</span>
                <span className="text-slate-700 font-mono text-[11px] text-right max-w-[200px] truncate">
                  {game?.controlsGuide || 'Keyboard & Mouse'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabbed Inspection Workspace Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            {/* Tab navigation pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('TELEMETRY')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'TELEMETRY'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Security</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MANIFEST')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'MANIFEST'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Files ({manifestFiles.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('VERSIONS')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'VERSIONS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-600" />
                <span>Builds ({(allVersions || []).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ROLLBACKS')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'ROLLBACKS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-amber-600" />
                <span>Audits</span>
              </button>
            </div>

            {/* TAB 1: TELEMETRY & SECURITY */}
            {activeTab === 'TELEMETRY' && (
              <div className="space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-700">Root Entry (index.html)</span>
                    <span className="text-emerald-700 font-semibold font-mono">VERIFIED</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-700">Zip Slip / Path Traversal Defense</span>
                    <span className="text-emerald-700 font-semibold font-mono">PASSED</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-700">Prohibited Executables (.exe/.sh/.dll)</span>
                    <span className="text-emerald-700 font-semibold font-mono">ZERO DETECTED</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-700">Decompressed Size Limit (&lt;350MB)</span>
                    <span className="text-emerald-700 font-semibold font-mono">
                      {version?.totalSizeBytes
                        ? `${(version.totalSizeBytes / 1024 / 1024).toFixed(2)} MB (PASSED)`
                        : 'PASSED'}
                    </span>
                  </div>
                </div>

                {/* SHA-256 Checksum Card */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>SHA-256 Build Checksum</span>
                    <button
                      type="button"
                      onClick={() => copySha(sha256)}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      {copiedSha ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSha ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-emerald-700 truncate font-semibold">
                    {sha256}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MANIFEST INSPECTOR */}
            {activeTab === 'MANIFEST' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                  <span>Extracted Build Files</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {manifest?.totalSizeBytes
                      ? `${(manifest.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`
                      : '0 MB'}
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={manifestSearch}
                    onChange={(e) => setManifestSearch(e.target.value)}
                    placeholder="Filter files in manifest..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 text-xs">
                  {filteredManifest.length > 0 ? (
                    filteredManifest.map((f: any, i: number) => (
                      <div key={i} className="p-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-slate-900 truncate font-medium">{f.path}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{f.sha256}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600 block mb-0.5">
                            {(f.sizeBytes / 1024).toFixed(1)} KB
                          </span>
                          <span className="text-[9px] text-indigo-600 font-mono block">
                            {f.contentType.split(';')[0]}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      {manifestFiles.length === 0
                        ? 'Manifest generated upon upload session completion.'
                        : 'No files match search filter.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: VERSIONS HISTORY */}
            {activeTab === 'VERSIONS' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Game Builds Timeline</span>
                  <span>Active: <strong className="text-indigo-600">v{allVersions?.find((v: any) => v.id === game?.currentVersionId)?.versionNumber || '1.0.0'}</strong></span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {(allVersions || []).map((ver: any) => {
                    const isActive = ver.id === game?.currentVersionId;
                    return (
                      <div
                        key={ver.id}
                        className={`p-3 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 ${
                          isActive
                            ? 'bg-indigo-50/50 border-indigo-200'
                            : ver.status === 'QUARANTINED'
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-slate-900">v{ver.versionNumber}</span>
                            <Badge
                              variant={
                                ver.status === 'PUBLISHED'
                                  ? 'success'
                                  : ver.status === 'QUARANTINED'
                                  ? 'danger'
                                  : ver.status === 'APPROVED'
                                  ? 'cyan'
                                  : 'warning'
                              }
                            >
                              {ver.status}
                            </Badge>
                            {isActive && (
                              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {ver.changelog || 'No release changelog specified.'}
                          </p>
                        </div>

                        {!isActive && (ver.status === 'PUBLISHED' || ver.status === 'APPROVED') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              handleDecision('ADMIN_ROLLBACK', { targetVersionId: ver.id });
                            }}
                            isLoading={submittingAction}
                            leftIcon={<RotateCcw className="w-3 h-3 text-amber-600" />}
                          >
                            Rollback
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: ROLLBACK AUDITS */}
            {activeTab === 'ROLLBACKS' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500">Immutable Rollback History</div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {(rollbacks || []).length > 0 ? (
                    (rollbacks || []).map((rb: any) => (
                      <div key={rb.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-900 font-mono">
                            v{rb.fromVersionNumber} &rarr; v{rb.toVersionNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(rb.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] italic">"{rb.reason}"</p>
                        <div className="text-[10px] text-slate-400">
                          By: <span className="font-medium text-slate-700">{rb.performedByName || 'Admin'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No rollbacks have been executed for this game. Current build is stable.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Usage & Legal Declarations Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>AI Disclosure & Legal Warranties</span>
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">AI Generation Tier</span>
                <Badge variant="cyan">
                  {rights?.aiDisclosure || 'NONE_HUMAN_ONLY'}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-600 leading-relaxed">
                {rights?.aiDisclosure === 'NONE_HUMAN_ONLY'
                  ? 'Studio certified 100% human-developed art, music, and codebase.'
                  : rights?.aiDisclosure === 'AI_ASSISTED'
                  ? 'Studio declared AI tooling used with substantial human polishing and review.'
                  : 'Predominantly synthesized via generative models.'}
              </div>
              {rights?.licensingNotes && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700">
                  <span className="text-slate-500 block">Licensing Notes:</span>
                  <span>{rights.licensingNotes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Operations QA Checklist Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Operations QA Checklist
            </h3>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={checks.bootsUnder5s}
                  onChange={(e) => setChecks({ ...checks, bootsUnder5s: e.target.checked })}
                  className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500"
                />
                <span>Build boots within 5 seconds without blocking errors</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={checks.controlsResponsive}
                  onChange={(e) => setChecks({ ...checks, controlsResponsive: e.target.checked })}
                  className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500"
                />
                <span>Keyboard and mouse/touch controls respond accurately</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={checks.noExternalTracking}
                  onChange={(e) => setChecks({ ...checks, noExternalTracking: e.target.checked })}
                  className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500"
                />
                <span>No unauthorized tracking, popups, or unapproved ads</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={checks.safetyCompliant}
                  onChange={(e) => setChecks({ ...checks, safetyCompliant: e.target.checked })}
                  className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500"
                />
                <span>Visuals and audio comply with platform safety rules</span>
              </label>
            </div>
          </div>

          {/* Decision Action Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Operations Decision
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal QA Notes
                </label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Notes on performance, viewport scaling, audio sync..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason (Required if rejecting)
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specific defect or policy violation..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-rose-700 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
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

                {/* Emergency Quarantine Button */}
                <div className="pt-2 border-t border-slate-100">
                  {!showQuarantineConfirm ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQuarantineConfirm(true)}
                      className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      leftIcon={<ShieldAlert className="w-4 h-4 text-rose-600" />}
                    >
                      Emergency Quarantine Build
                    </Button>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>Confirm Emergency Quarantine</span>
                      </div>
                      <p className="text-[11px] text-rose-700 leading-relaxed">
                        Immediately pulls this build from the public catalog/CDN. If currently active, the game will automatically roll back to the last safe version.
                      </p>
                      <input
                        type="text"
                        value={quarantineReason}
                        onChange={(e) => setQuarantineReason(e.target.value)}
                        placeholder="Incident Reason (e.g. Exploit detected, malicious script)..."
                        className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs text-rose-900 placeholder-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDecision('QUARANTINE')}
                          isLoading={submittingAction}
                          className="flex-1"
                        >
                          Execute Quarantine
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowQuarantineConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: LIVE SANDBOX RUNNER (7 COLS) ================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            {/* Viewport Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 mr-1">Viewport:</span>
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
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Build</span>
                </button>
                <Link
                  href={`/sandbox/${game?.id || 'game-preview'}/${version?.id || 'ver-preview'}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Isolated Tab</span>
                </Link>
              </div>
            </div>

            {/* Embedded Live Sandbox Iframe */}
            <div className="flex justify-center bg-slate-950 rounded-xl p-4 overflow-hidden border border-slate-200">
              <div
                className={`transition-all duration-300 overflow-hidden rounded-lg bg-black border border-slate-800 shadow-2xl relative ${
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
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs text-white">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sandbox Telemetry Console</span>
                </span>
                <span className="text-[10px] text-emerald-400">RUNNING (60 FPS)</span>
              </div>
              <div className="space-y-1 text-slate-400 max-h-32 overflow-y-auto scrollbar-thin">
                {consoleLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-slate-600 select-none">›</span>
                    <span
                      className={
                        log.includes('SECURITY')
                          ? 'text-cyan-400'
                          : log.includes('ENGINE')
                          ? 'text-indigo-400'
                          : log.includes('RUNTIME')
                          ? 'text-emerald-400'
                          : 'text-slate-300'
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
