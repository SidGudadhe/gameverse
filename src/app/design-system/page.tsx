'use client';

import React, { useState } from 'react';
import {
  Palette,
  Type,
  Layers,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Search,
  Inbox,
  ShieldCheck,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, GameCardSkeleton, HeroSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'components' | 'prototypes'>('prototypes');

  // Prototype 1: Upload validation state
  const [uploadScenario, setUploadScenario] = useState<string>('valid');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Prototype 2: Modal QA state
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [qaDecision, setQaDecision] = useState<'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED' | null>(null);
  const [qaNotes, setQaNotes] = useState('');

  // Prototype 3: Fullscreen state
  const [simulatedFullscreen, setSimulatedFullscreen] = useState(false);

  // Prototype 4: Input validation state
  const [inputVal, setInputVal] = useState('');
  const [inputError, setInputError] = useState('');

  const handleTestUpload = (scenario: string) => {
    setUploadScenario(scenario);
    setUploading(true);
    setUploadResult(null);

    setTimeout(() => {
      setUploading(false);
      if (scenario === 'valid') {
        setUploadResult({
          status: 'SUCCESS',
          message: 'Archive verified: contains index.html, 42 assets, SHA-256 computed.',
        });
      } else if (scenario === 'no_index') {
        setUploadResult({
          status: 'ERROR',
          message: 'Validation Error: Missing required entry file "index.html" in archive root.',
        });
      } else if (scenario === 'zip_bomb') {
        setUploadResult({
          status: 'ERROR',
          message: 'Security Violation: Decompressed size (312 MB) exceeds the 250 MB safety limit.',
        });
      } else if (scenario === 'path_traversal') {
        setUploadResult({
          status: 'ERROR',
          message: 'Security Violation: Path traversal attack detected ("../../etc/passwd").',
        });
      }
    }, 800);
  };

  const handleInputValidation = (text: string) => {
    setInputVal(text);
    if (text.length > 0 && text.length < 3) {
      setInputError('Game title must be at least 3 characters long.');
    } else {
      setInputError('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Phase 1 Deliverable
            </span>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-white mt-1.5">
            GameVerse UI/UX Design System & Prototypes
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            "Cyber-Slate" Design Tokens, Accessible UI Components, and Interactive Flow Prototypes across all three portals.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-2xl border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('prototypes')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'prototypes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Interactive Prototypes
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'components'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            UI Components
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'tokens'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Design Tokens
          </button>
        </div>
      </div>

      {/* ================= TAB 1: INTERACTIVE PROTOTYPES ================= */}
      {activeTab === 'prototypes' && (
        <div className="space-y-10">
          {/* Prototype 1: Upload & File Validation Flow */}
          <section className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div>
                <h2 className="font-heading font-bold text-xl text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-400" />
                  <span>Prototype 1: Game Build Upload & Validation Flow</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Test client-side validation, error handling, and security checks before submission.
                </p>
              </div>
              <Badge variant="cyan">Phase 1 Requirement</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="text-xs font-semibold text-gray-300">
                  Select Archive Test Scenario:
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleTestUpload('valid')}
                    className={`p-3 rounded-xl border text-left transition-all text-xs font-medium ${
                      uploadScenario === 'valid'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-emerald-400">Valid Build ZIP</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Contains index.html, clean assets</div>
                  </button>

                  <button
                    onClick={() => handleTestUpload('no_index')}
                    className={`p-3 rounded-xl border text-left transition-all text-xs font-medium ${
                      uploadScenario === 'no_index'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-amber-400">Missing index.html</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Tests entry file validation</div>
                  </button>

                  <button
                    onClick={() => handleTestUpload('zip_bomb')}
                    className={`p-3 rounded-xl border text-left transition-all text-xs font-medium ${
                      uploadScenario === 'zip_bomb'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-rose-400">ZIP Bomb (&gt;250MB)</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Tests decompression ratio check</div>
                  </button>

                  <button
                    onClick={() => handleTestUpload('path_traversal')}
                    className={`p-3 rounded-xl border text-left transition-all text-xs font-medium ${
                      uploadScenario === 'path_traversal'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-rose-400">Path Traversal</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Tests ../ relative path injection</div>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone Preview & Results */}
              <div className="bg-black/40 rounded-2xl p-6 border border-white/10 flex flex-col justify-center space-y-4">
                <div className="border border-dashed border-white/15 rounded-xl p-6 text-center">
                  <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto" />
                  <div className="text-xs font-semibold text-white mt-2">
                    {uploading ? 'Processing archive...' : 'Simulated Upload Dropzone'}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Scenario active: <span className="font-mono text-indigo-300">{uploadScenario}</span>
                  </div>
                </div>

                {uploading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 py-2">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Executing pre-flight extraction & heuristic checks...</span>
                  </div>
                )}

                {uploadResult && (
                  <div
                    className={`p-4 rounded-xl border text-xs ${
                      uploadResult.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {uploadResult.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>{uploadResult.status === 'SUCCESS' ? 'Upload Passed' : 'Validation Failed'}</span>
                    </div>
                    <div className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                      {uploadResult.message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Prototype 2: QA Decision & Review Flow */}
          <section className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div>
                <h2 className="font-heading font-bold text-xl text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>Prototype 2: Admin QA Decision Flow</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Test review workflow modal, state transitions, rejection reasons, and admin audit logging.
                </p>
              </div>
              <Badge variant="warning">Operations UX</Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/40 p-5 rounded-2xl border border-white/5">
              <div>
                <div className="text-sm font-bold text-white">Neon Cyber Runner 2088 (v1.0.4)</div>
                <div className="text-xs text-gray-400 mt-0.5">Submitted by PixelForge Studios • Automated pre-flight: 0 errors</div>
              </div>

              <div className="flex items-center gap-3">
                {qaDecision && (
                  <Badge
                    variant={
                      qaDecision === 'APPROVED' ? 'success' : qaDecision === 'REJECTED' ? 'danger' : 'warning'
                    }
                  >
                    Decision: {qaDecision}
                  </Badge>
                )}
                <Button size="sm" variant="primary" onClick={() => setQaModalOpen(true)}>
                  Launch Review Modal
                </Button>
              </div>
            </div>

            {/* QA Decision Modal Component */}
            <Modal
              isOpen={qaModalOpen}
              onClose={() => setQaModalOpen(false)}
              title="QA Review & Decision Workspace"
              description="Review automated checks and assign workflow state."
              footer={
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setQaModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setQaDecision('REJECTED');
                      setQaModalOpen(false);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      setQaDecision('APPROVED');
                      setQaModalOpen(false);
                    }}
                  >
                    Approve & Publish
                  </Button>
                </div>
              }
            >
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="font-semibold text-gray-300">Automated Health Checklist:</div>
                  <div className="space-y-1.5 text-gray-300">
                    <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg">
                      <span>Root index.html verified</span>
                      <span className="text-emerald-400 font-semibold">OK</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg">
                      <span>Zero console errors detected</span>
                      <span className="text-emerald-400 font-semibold">OK (0 errors)</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg">
                      <span>Viewport 16:9 responsive scaling</span>
                      <span className="text-emerald-400 font-semibold">OK</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-300">Review Notes / Rejection Reason</label>
                  <textarea
                    rows={3}
                    value={qaNotes}
                    onChange={(e) => setQaNotes(e.target.value)}
                    placeholder="Enter manual feedback for developer..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>
            </Modal>
          </section>

          {/* Prototype 3: Sandboxed Fullscreen & Exit HUD Flow */}
          <section className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div>
                <h2 className="font-heading font-bold text-xl text-white flex items-center gap-2">
                  <Maximize2 className="w-5 h-5 text-cyan-400" />
                  <span>Prototype 3: Sandboxed Fullscreen & Parent Exit HUD</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Verify aspect-ratio viewport containment, parent-level discreet exit button, and Escape key dismissal.
                </p>
              </div>
              <Badge variant="cyan">Player UX</Badge>
            </div>

            <div className="space-y-4">
              <div
                className={`relative w-full rounded-2xl overflow-hidden bg-black border border-white/10 transition-all duration-300 ${
                  simulatedFullscreen ? 'h-96' : 'aspect-video max-h-72'
                }`}
              >
                {/* Floating Parent HUD */}
                <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
                  <span className="bg-black/80 backdrop-blur-md text-white text-xs px-3 py-1 rounded-xl border border-white/10 font-semibold">
                    {simulatedFullscreen ? 'Fullscreen Active' : 'Standard 16:9 Viewport'}
                  </span>

                  <button
                    onClick={() => setSimulatedFullscreen(!simulatedFullscreen)}
                    className="pointer-events-auto bg-black/80 hover:bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-lg transition-colors"
                  >
                    {simulatedFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{simulatedFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                  </button>
                </div>

                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-tr from-indigo-950/40 via-black to-slate-900">
                  <Play className="w-12 h-12 text-indigo-400 mb-2 opacity-80" />
                  <div className="font-heading font-bold text-white text-lg">
                    Sandboxed Canvas Viewport
                  </div>
                  <div className="text-xs text-gray-400 max-w-sm mt-1">
                    Discreet HUD button sits on parent frame outside untrusted iframe to prevent escape capture.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Prototype 4: Form Input Validation States */}
          <section className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div>
                <h2 className="font-heading font-bold text-xl text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <span>Prototype 4: Accessible Form Validation States</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Verify dynamic aria-invalid and real-time error announcement.
                </p>
              </div>
              <Badge variant="danger">A11y Standards</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Game Title (Interactive Validation)"
                  required
                  value={inputVal}
                  onChange={(e) => handleInputValidation(e.target.value)}
                  placeholder="Type 1-2 letters to trigger error..."
                  error={inputError}
                  helperText="Must be 3 or more characters."
                />
              </div>

              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                <div className="font-semibold text-gray-300">Accessibility Inspection:</div>
                <div className="font-mono text-[11px] text-gray-400">
                  aria-invalid: <span className="text-white">{inputError ? 'true' : 'false'}</span>
                </div>
                <div className="font-mono text-[11px] text-gray-400">
                  role: <span className="text-white">alert</span>
                </div>
                <div className="font-mono text-[11px] text-gray-400">
                  contrast ratio: <span className="text-emerald-400 font-bold">7.2:1 (Exceeds WCAG AAA)</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ================= TAB 2: UI COMPONENTS ================= */}
      {activeTab === 'components' && (
        <div className="space-y-10">
          {/* Buttons Showcase */}
          <section className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h2 className="font-heading font-bold text-xl text-white">Button Variants & Sizes</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Action</Button>
              <Button variant="success">Success Action</Button>
              <Button variant="primary" isLoading>Loading State</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <Button size="sm">Small Size (sm)</Button>
              <Button size="md">Medium Size (md)</Button>
              <Button size="lg">Large Size (lg)</Button>
            </div>
          </section>

          {/* Badges & Chips Showcase */}
          <section className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h2 className="font-heading font-bold text-xl text-white">Badges & Status Indicators</h2>
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="default">Default Badge</Badge>
              <Badge variant="featured">Featured Game</Badge>
              <Badge variant="success">Published (Live)</Badge>
              <Badge variant="warning">In QA Review</Badge>
              <Badge variant="danger">Changes Required</Badge>
              <Badge variant="cyan">WebGL 2.0</Badge>
              <Badge variant="engine">Phaser 3</Badge>
            </div>
          </section>

          {/* Skeletons Showcase */}
          <section className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h2 className="font-heading font-bold text-xl text-white">Zero-Layout-Shift Loading Skeletons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <GameCardSkeleton />
              <GameCardSkeleton />
              <GameCardSkeleton />
            </div>
          </section>

          {/* Empty State Showcase */}
          <section className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h2 className="font-heading font-bold text-xl text-white">Empty State Pattern</h2>
            <EmptyState
              icon={Inbox}
              title="No pending submissions"
              description="All uploaded game builds have been reviewed and published to the live portal."
              actionLabel="Refresh Queue"
              onAction={() => alert('Queue refreshed')}
            />
          </section>
        </div>
      )}

      {/* ================= TAB 3: DESIGN TOKENS ================= */}
      {activeTab === 'tokens' && (
        <div className="space-y-10">
          <section className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h2 className="font-heading font-bold text-xl text-white">Color Tokens ("Cyber-Slate")</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-[#090D16] border border-white/10 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#090D16] border border-white/20 mb-2" />
                <div className="text-white font-bold font-sans">Background Deep</div>
                <div className="text-gray-400">#090D16</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#111827] border border-white/10 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#111827] border border-white/20 mb-2" />
                <div className="text-white font-bold font-sans">Surface Slate</div>
                <div className="text-gray-400">#111827</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1F2937] border border-white/10 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#1F2937] border border-white/20 mb-2" />
                <div className="text-white font-bold font-sans">Elevated Surface</div>
                <div className="text-gray-400">#1F2937</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-white/10 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#6366F1] mb-2" />
                <div className="text-white font-bold font-sans">Primary Accent</div>
                <div className="text-gray-400">#6366F1 (Indigo)</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-white/10 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#06B6D4] mb-2" />
                <div className="text-white font-bold font-sans">Secondary Accent</div>
                <div className="text-gray-400">#06B6D4 (Cyan)</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-white/10 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#10B981] mb-2" />
                <div className="text-white font-bold font-sans">Success / Live</div>
                <div className="text-gray-400">#10B981 (Emerald)</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-white/10 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B] mb-2" />
                <div className="text-white font-bold font-sans">Warning / QA</div>
                <div className="text-gray-400">#F59E0B (Amber)</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-white/10 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#EF4444] mb-2" />
                <div className="text-white font-bold font-sans">Danger / Rejection</div>
                <div className="text-gray-400">#EF4444 (Rose)</div>
              </div>
            </div>
          </section>

          <section className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h2 className="font-heading font-bold text-xl text-white">Typography Hierarchy</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-heading font-black text-2xl text-white">Outfit Sans (Display & Headlines)</div>
                  <div className="text-xs text-gray-400">Used for Game Titles, Hero Banners, Section Headings</div>
                </div>
                <Badge variant="cyan">font-heading</Badge>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-sans text-base text-gray-200">Inter Sans (Body Copy & Controls)</div>
                  <div className="text-xs text-gray-400">Used for Paragraphs, Forms, Buttons, and Table Data</div>
                </div>
                <Badge variant="default">font-sans</Badge>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-sm text-cyan-300">JetBrains Mono (Telemetry & Checksums)</div>
                  <div className="text-xs text-gray-400">Used for SHA-256 hashes, Engine names, Financial figures</div>
                </div>
                <Badge variant="cyan">font-mono</Badge>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
