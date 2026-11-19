'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { GameCardSkeleton } from '@/components/ui/Skeleton';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<'prototypes' | 'components' | 'tokens'>('prototypes');

  // Prototype 1 state: Upload simulation
  const [uploadScenario, setUploadScenario] = useState<'valid' | 'no_index' | 'zip_bomb' | 'path_traversal'>('valid');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ status: 'SUCCESS' | 'ERROR'; message: string } | null>(null);

  // Prototype 2 state: QA Decision Modal
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [qaDecision, setQaDecision] = useState<'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES' | null>(null);
  const [qaNotes, setQaNotes] = useState('');

  // Prototype 3 state: Fullscreen Simulation
  const [simulatedFullscreen, setSimulatedFullscreen] = useState(false);

  // Prototype 4 state: Accessible form validation
  const [inputVal, setInputVal] = useState('');
  const [inputError, setInputError] = useState('');

  const handleTestUpload = (scenario: typeof uploadScenario) => {
    setUploadScenario(scenario);
    setUploading(true);
    setUploadResult(null);

    setTimeout(() => {
      setUploading(false);
      switch (scenario) {
        case 'valid':
          setUploadResult({
            status: 'SUCCESS',
            message: 'Archive verified: index.html present, safe MIME types, extracted size 14.2 MB (Compression ratio 2.1:1). Ready for QA submission.',
          });
          break;
        case 'no_index':
          setUploadResult({
            status: 'ERROR',
            message: 'Validation failed: Missing root index.html. Every HTML5 game build must have index.html in the root directory.',
          });
          break;
        case 'zip_bomb':
          setUploadResult({
            status: 'ERROR',
            message: 'Security trigger: Decompression ratio 184:1 exceeds safety limit of 100:1. Potential zip-bomb payload rejected.',
          });
          break;
        case 'path_traversal':
          setUploadResult({
            status: 'ERROR',
            message: 'Security trigger: Archive contains illegal relative path (../../etc/passwd). Path traversal attempt blocked.',
          });
          break;
      }
    }, 700);
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
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Grand White Design System
            </span>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-slate-900 mt-1.5">
            GameVerse UI/UX Design System & Prototypes
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            "Grand White" Design Tokens, Accessible UI Components, and Interactive Flow Prototypes across all portals.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('prototypes')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'prototypes'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Interactive Prototypes
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'components'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            UI Components
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'tokens'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
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
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-heading font-bold text-xl text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-600" />
                  <span>Prototype 1: Game Build Upload & Validation Flow</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test client-side validation, error handling, and security checks before submission.
                </p>
              </div>
              <Badge variant="cyan">Phase 1 Requirement</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="text-xs font-semibold text-slate-700">
                  Select Archive Test Scenario:
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleTestUpload('valid')}
                    className={`p-3 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                      uploadScenario === 'valid'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-emerald-600">Valid Build ZIP</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Contains index.html, clean assets</div>
                  </button>

                  <button
                    onClick={() => handleTestUpload('no_index')}
                    className={`p-3 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                      uploadScenario === 'no_index'
                        ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-rose-600">Missing index.html</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Tests entrypoint detection check</div>
                  </button>

                  <button
                    onClick={() => handleTestUpload('zip_bomb')}
                    className={`p-3 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                      uploadScenario === 'zip_bomb'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-amber-600">Zip Bomb Ratio</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Tests decompression ratio check</div>
                  </button>

                  <button
                    onClick={() => handleTestUpload('path_traversal')}
                    className={`p-3 rounded-xl border text-left transition-all text-xs font-medium cursor-pointer ${
                      uploadScenario === 'path_traversal'
                        ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-rose-600">Path Traversal</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Tests ../ relative path injection</div>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone Preview & Results */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-center space-y-4">
                <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-white">
                  <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto" />
                  <div className="text-xs font-semibold text-slate-800 mt-2">
                    {uploading ? 'Processing archive...' : 'Simulated Upload Dropzone'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Scenario active: <span className="font-mono font-semibold text-indigo-600">{uploadScenario}</span>
                  </div>
                </div>

                {uploading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-indigo-600 py-2 font-medium">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Executing pre-flight extraction & heuristic checks...</span>
                  </div>
                )}

                {uploadResult && (
                  <div
                    className={`p-4 rounded-xl border text-xs ${
                      uploadResult.status === 'SUCCESS'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {uploadResult.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>{uploadResult.status === 'SUCCESS' ? 'Upload Passed' : 'Validation Failed'}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {uploadResult.message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Prototype 2: QA Decision & Review Flow */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-heading font-bold text-xl text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <span>Prototype 2: Admin QA Decision Flow</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test review workflow modal, state transitions, rejection reasons, and admin audit logging.
                </p>
              </div>
              <Badge variant="warning">Operations UX</Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <div className="text-sm font-bold text-slate-900">Neon Cyber Runner 2088 (v1.0.4)</div>
                <div className="text-xs text-slate-500 mt-0.5">Submitted by PixelForge Studios • Automated pre-flight: 0 errors</div>
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
                  <div className="font-semibold text-slate-800">Automated Health Checklist:</div>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span>Root index.html verified</span>
                      <span className="text-emerald-600 font-bold">OK</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span>Zero console errors detected</span>
                      <span className="text-emerald-600 font-bold">OK (0 errors)</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span>Viewport 16:9 responsive scaling</span>
                      <span className="text-emerald-600 font-bold">OK</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800">Review Notes / Rejection Reason</label>
                  <textarea
                    rows={3}
                    value={qaNotes}
                    onChange={(e) => setQaNotes(e.target.value)}
                    placeholder="Enter manual feedback for developer..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 text-xs"
                  />
                </div>
              </div>
            </Modal>
          </section>

          {/* Prototype 3: Sandboxed Fullscreen & Exit HUD Flow */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-heading font-bold text-xl text-slate-900 flex items-center gap-2">
                  <Maximize2 className="w-5 h-5 text-indigo-600" />
                  <span>Prototype 3: Sandboxed Fullscreen & Parent Exit HUD</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify aspect-ratio viewport containment, parent-level discreet exit button, and Escape key dismissal.
                </p>
              </div>
              <Badge variant="cyan">Player UX</Badge>
            </div>

            <div className="space-y-4">
              <div
                className={`relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 transition-all duration-300 ${
                  simulatedFullscreen ? 'h-96' : 'aspect-video max-h-72'
                }`}
              >
                {/* Floating Parent HUD */}
                <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
                  <span className="bg-white/95 backdrop-blur-md text-slate-900 text-xs px-3 py-1 rounded-xl border border-slate-200 font-bold shadow-xs">
                    {simulatedFullscreen ? 'Fullscreen Active' : 'Standard 16:9 Viewport'}
                  </span>

                  <button
                    onClick={() => setSimulatedFullscreen(!simulatedFullscreen)}
                    className="pointer-events-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer font-semibold"
                  >
                    {simulatedFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{simulatedFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                  </button>
                </div>

                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900">
                  <Play className="w-12 h-12 text-indigo-400 mb-2 opacity-80" />
                  <div className="font-heading font-bold text-white text-lg">
                    Sandboxed Canvas Viewport
                  </div>
                  <div className="text-xs text-slate-300 max-w-sm mt-1">
                    Discreet HUD button sits on parent frame outside untrusted iframe to prevent escape capture.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Prototype 4: Form Input Validation States */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-heading font-bold text-xl text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span>Prototype 4: Accessible Form Validation States</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
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

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="font-semibold text-slate-800">Accessibility Inspection:</div>
                <div className="font-mono text-[11px] text-slate-600">
                  aria-invalid: <span className="text-indigo-600 font-bold">{inputError ? 'true' : 'false'}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600">
                  role: <span className="text-indigo-600 font-bold">alert</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600">
                  contrast ratio: <span className="text-emerald-600 font-bold">12.5:1 (Exceeds WCAG AAA)</span>
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
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="font-heading font-bold text-xl text-slate-900">Button Variants & Sizes</h2>
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

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <Button size="sm">Small Size (sm)</Button>
              <Button size="md">Medium Size (md)</Button>
              <Button size="lg">Large Size (lg)</Button>
            </div>
          </section>

          {/* Badges & Chips Showcase */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="font-heading font-bold text-xl text-slate-900">Badges & Status Indicators</h2>
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
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="font-heading font-bold text-xl text-slate-900">Zero-Layout-Shift Loading Skeletons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <GameCardSkeleton />
              <GameCardSkeleton />
              <GameCardSkeleton />
            </div>
          </section>

          {/* Empty State Showcase */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="font-heading font-bold text-xl text-slate-900">Empty State Pattern</h2>
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
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="font-heading font-bold text-xl text-slate-900">Color Tokens ("Grand White Theme")</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-slate-300 mb-2" />
                <div className="text-slate-900 font-bold font-sans">Canvas Background</div>
                <div className="text-slate-500">#F8FAFC (Slate-50)</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] border border-slate-300 mb-2" />
                <div className="text-slate-900 font-bold font-sans">Surface Pure White</div>
                <div className="text-slate-500">#FFFFFF</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] border border-slate-300 mb-2" />
                <div className="text-slate-900 font-bold font-sans">Elevated Surface</div>
                <div className="text-slate-500">#F1F5F9 (Slate-100)</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#6366F1] mb-2 rounded-lg" />
                <div className="text-slate-900 font-bold font-sans">Primary Accent</div>
                <div className="text-slate-500">#6366F1 (Indigo-600)</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#06B6D4] mb-2 rounded-lg" />
                <div className="text-slate-900 font-bold font-sans">Secondary Accent</div>
                <div className="text-slate-500">#06B6D4 (Cyan-500)</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#10B981] mb-2 rounded-lg" />
                <div className="text-slate-900 font-bold font-sans">Success / Live</div>
                <div className="text-slate-500">#10B981 (Emerald-600)</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B] mb-2 rounded-lg" />
                <div className="text-slate-900 font-bold font-sans">Warning / QA</div>
                <div className="text-slate-500">#F59E0B (Amber-500)</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="w-8 h-8 rounded-lg bg-[#F43F5E] mb-2 rounded-lg" />
                <div className="text-slate-900 font-bold font-sans">Danger / Rejection</div>
                <div className="text-slate-500">#F43F5E (Rose-500)</div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="font-heading font-bold text-xl text-slate-900">Typography Hierarchy</h2>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-heading font-black text-2xl text-slate-900">Outfit Sans (Display & Headlines)</div>
                  <div className="text-xs text-slate-500 mt-0.5">Used for Game Titles, Hero Banners, Section Headings</div>
                </div>
                <Badge variant="cyan">font-heading</Badge>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-sans text-base text-slate-800 font-semibold">Inter Sans (Body Copy & Controls)</div>
                  <div className="text-xs text-slate-500 mt-0.5">Used for Paragraphs, Forms, Buttons, and Table Data</div>
                </div>
                <Badge variant="default">font-sans</Badge>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-sm text-indigo-700 font-bold">JetBrains Mono (Telemetry & Checksums)</div>
                  <div className="text-xs text-slate-500 mt-0.5">Used for SHA-256 hashes, Engine names, Financial figures</div>
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
