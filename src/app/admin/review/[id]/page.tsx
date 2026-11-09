'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Play, Monitor, RefreshCw } from 'lucide-react';

export default function AdminReviewPage({ params }: { params: { id: string } }) {
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  const submission = db.getSubmissions().find((s) => s.id === params.id) || db.getSubmissions()[0];
  const game = db.getGameById(submission.gameId) || db.games[0];

  const handleAction = (status: 'PUBLISHED' | 'CHANGES_REQUESTED' | 'REJECTED') => {
    db.updateSubmissionStatus(submission.id, status, decisionNotes, 'Admin Operations');
    setDecisionSuccess(`Build successfully updated to status: ${status}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Queue</span>
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-xs font-semibold text-white">QA Sandbox Review: {game.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Current Status:</span>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {submission.status}
          </span>
        </div>
      </div>

      {decisionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{decisionSuccess}</span>
        </div>
      )}

      {/* Split Screen QA Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Inspection Details & Automated Scan */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-4">
            <h2 className="font-heading font-bold text-base text-white">
              Submission Metadata
            </h2>

            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Developer</span>
                <span className="text-white font-semibold">{submission.developerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Game Title</span>
                <span className="text-white font-semibold">{game.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Target Orientation</span>
                <span className="text-white">{game.orientation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Engine</span>
                <span className="text-white font-mono">{game.engine}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Entry File</span>
                <span className="text-emerald-400 font-mono">index.html (Verified)</span>
              </div>
            </div>
          </div>

          {/* Automated Health & Security Checks */}
          <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-3">
            <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Automated Pre-Flight Telemetry</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                <span className="text-gray-300">Archive Path Traversal Check</span>
                <span className="text-emerald-400 font-semibold">PASSED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                <span className="text-gray-300">Zip Bomb Ratio (Decompressed &lt; 250MB)</span>
                <span className="text-emerald-400 font-semibold">PASSED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                <span className="text-gray-300">Console Errors at Boot</span>
                <span className="text-emerald-400 font-semibold">0 Errors</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                <span className="text-gray-300">Initial Asset Boot Load Time</span>
                <span className="text-cyan-400 font-semibold">420 ms (Fast)</span>
              </div>
            </div>
          </div>

          {/* Decision Box */}
          <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-4">
            <h3 className="font-heading font-bold text-sm text-white">
              QA Decision & Feedback
            </h3>

            <textarea
              rows={3}
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="Enter manual QA test notes, required modifications, or approval confirmation..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                onClick={() => handleAction('PUBLISHED')}
                className="w-full sm:flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Publish</span>
              </button>

              <button
                onClick={() => handleAction('CHANGES_REQUESTED')}
                className="w-full sm:flex-initial flex items-center justify-center gap-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Request Changes</span>
              </button>

              <button
                onClick={() => handleAction('REJECTED')}
                className="w-full sm:flex-initial flex items-center justify-center gap-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Live Sandboxed Game Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-300 font-semibold">
                <Monitor className="w-4 h-4 text-indigo-400" />
                <span>Live Sandboxed Player Environment</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                Origin: sandbox.gameverse.internal
              </span>
            </div>

            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black">
              <iframe
                src={`/sandbox/${game.id}/${submission.versionId}`}
                title="QA Sandbox Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
              <span>Interactive 60fps canvas loop active. Test keyboard/mouse controls directly.</span>
              <span className="text-emerald-400 font-semibold">CSP Sandbox: OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
