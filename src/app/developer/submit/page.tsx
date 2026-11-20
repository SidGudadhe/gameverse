'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Shield,
  FileArchive,
  Sparkles,
  Bot,
  User,
  Layers,
  Gamepad2,
  Image as ImageIcon,
  Check,
  Hash,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export default function GameSubmitPage() {
  // Build & File state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [tempUploadId, setTempUploadId] = useState<string | null>(null);

  // Metadata state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('cat-arcade');
  const [categoryName, setCategoryName] = useState('Arcade');
  const [engine, setEngine] = useState('HTML5 Canvas / Custom JS');
  const [orientation, setOrientation] = useState<'LANDSCAPE' | 'PORTRAIT' | 'ANY'>('LANDSCAPE');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [controls, setControls] = useState('WASD / Arrow Keys: Move\nSpace: Action\nP: Pause');
  const [versionNumber, setVersionNumber] = useState('1.0.0');
  const [changelog, setChangelog] = useState('Initial public release build.');

  // Visual Assets state
  const [thumbnailUrl, setThumbnailUrl] = useState(
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'
  );
  const [bannerUrl, setBannerUrl] = useState(
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80'
  );

  // Legal & AI state
  const [aiDisclosure, setAiDisclosure] = useState<'NONE_HUMAN_ONLY' | 'AI_ASSISTED' | 'AI_GENERATED'>('NONE_HUMAN_ONLY');
  const [licensingNotes, setLicensingNotes] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [prohibitedConfirmed, setProhibitedConfirmed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Draft persistence & Submissions Status tab
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'status'>('upload');
  const [statusGames, setStatusGames] = useState<any[]>([]);

  // Load existing draft and catalog status on mount
  React.useEffect(() => {
    fetch('/api/developer/games')
      .then((r) => r.json())
      .then((data) => setStatusGames(data.games || data.data || []))
      .catch(() => {});

    try {
      const saved = localStorage.getItem('gv_pending_game_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.shortDescription) {
          setShowDraftBanner(true);
        }
      }
    } catch {}
  }, []);

  // Auto-save draft whenever user fills information
  React.useEffect(() => {
    if (title || shortDescription || fullDescription) {
      const draft = {
        title,
        slug,
        category,
        categoryName,
        engine,
        orientation,
        shortDescription,
        fullDescription,
        controls,
        versionNumber,
        changelog,
        thumbnailUrl,
        bannerUrl,
        aiDisclosure,
        licensingNotes,
        savedAt: new Date().toLocaleTimeString(),
      };
      localStorage.setItem('gv_pending_game_draft', JSON.stringify(draft));
    }
  }, [
    title,
    slug,
    category,
    categoryName,
    engine,
    orientation,
    shortDescription,
    fullDescription,
    controls,
    versionNumber,
    changelog,
    thumbnailUrl,
    bannerUrl,
    aiDisclosure,
    licensingNotes,
  ]);

  const handleResumeDraft = () => {
    try {
      const saved = localStorage.getItem('gv_pending_game_draft');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.title) setTitle(d.title);
        if (d.slug) setSlug(d.slug);
        if (d.category) setCategory(d.category);
        if (d.categoryName) setCategoryName(d.categoryName);
        if (d.engine) setEngine(d.engine);
        if (d.orientation) setOrientation(d.orientation);
        if (d.shortDescription) setShortDescription(d.shortDescription);
        if (d.fullDescription) setFullDescription(d.fullDescription);
        if (d.controls) setControls(d.controls);
        if (d.versionNumber) setVersionNumber(d.versionNumber);
        if (d.changelog) setChangelog(d.changelog);
        if (d.thumbnailUrl) setThumbnailUrl(d.thumbnailUrl);
        if (d.bannerUrl) setBannerUrl(d.bannerUrl);
        if (d.aiDisclosure) setAiDisclosure(d.aiDisclosure);
        if (d.licensingNotes) setLicensingNotes(d.licensingNotes);
        setShowDraftBanner(false);
      }
    } catch {}
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('gv_pending_game_draft');
    setShowDraftBanner(false);
  };

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generated);
  };

  // Real upload to /api/developer/upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setUploading(true);
    setUploadError(null);
    setScanResult(null);

    const formData = new FormData();
    formData.append('file', selected);

    try {
      const res = await fetch('/api/developer/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed security scan.');
        if (data.scanResult) setScanResult(data.scanResult);
      } else {
        setScanResult(data.scanResult);
        setTempUploadId(data.tempUploadId);
      }
    } catch (err: any) {
      setUploadError(`Upload connection error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Submit complete metadata to /api/developer/submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!rightsConfirmed || !prohibitedConfirmed || !termsAgreed) {
      setSubmitError('You must confirm copyright ownership, certify no prohibited content, and agree to distribution terms.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title,
        slug,
        shortDescription,
        fullDescription,
        categoryId: category,
        categoryName,
        engine,
        orientation,
        controlsGuide: controls,
        versionNumber,
        changelog,
        thumbnailUrl,
        bannerUrl,
        screenshots: [thumbnailUrl],
        aiDisclosure,
        licensingNotes,
        rightsConfirmed: true,
        prohibitedContentConfirmed: true,
        tempUploadId: tempUploadId || undefined,
      };

      const res = await fetch('/api/developer/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit game build.');
      } else {
        localStorage.removeItem('gv_pending_game_draft');
        setSubmittedData(data);
      }
    } catch (err: any) {
      setSubmitError(`Submission request error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="success">Build Queued for QA Review</Badge>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-slate-900">
            Submission Received!
          </h1>
          <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
            Your game <span className="font-semibold text-slate-900">{submittedData.game?.title || title}</span> (v{submittedData.version?.versionNumber || versionNumber}) has been stored in our isolated runtime directory and queued for QA review.
          </p>
        </div>

        {/* Build Verification Summary Card */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 text-left max-w-xl mx-auto space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-2">
            <span>Reference ID</span>
            <span className="text-indigo-600 font-bold">{submittedData.submission?.id}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-2">
            <span>SHA-256 Checksum</span>
            <span className="text-emerald-700 truncate max-w-[260px] font-bold">
              {submittedData.version?.archiveChecksum || 'Computed'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-2">
            <span>AI Disclosure</span>
            <span className="text-cyan-700 font-bold">{submittedData.rights?.aiDisclosure || aiDisclosure}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500">
            <span>Current State</span>
            <span className="text-amber-800 font-bold">SUBMITTED (Pending Operations QA)</span>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <Link
            href="/developer/games"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-3 rounded-xl transition-all shadow-xs"
          >
            View in My Games
          </Link>
          <Link
            href="/developer"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-6 py-3 rounded-xl border border-slate-200 transition-colors"
          >
            Return to Studio Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/developer" className="hover:text-slate-900 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Studio Hub</span>
        </Link>
        <span>/</span>
        <Link href="/developer/games" className="hover:text-slate-900 transition-colors">
          My Games
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Submit New Build</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-heading font-black text-3xl text-slate-900">
            Game Upload & Review Pipeline
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Upload HTML5/WebGL ZIP archives, monitor review stages, and resume pending drafts.
          </p>
        </div>

        {/* Tab Switcher (Upload vs Status Pipeline) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-700 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload New Build
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-white text-indigo-700 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Submissions & Status</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold">
              {statusGames.length}
            </span>
          </button>
        </div>
      </div>

      {/* Draft Persistence Banner (Requested by User) */}
      {showDraftBanner && activeTab === 'upload' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-amber-950">
                Pending Draft Found!
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed">
                You have an unfinished draft from your previous session. Resume editing or discard to start fresh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleResumeDraft}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Continue Draft</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SUBMISSIONS & STATUS VIEW (When on 'status' tab) */}
      {activeTab === 'status' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Live in Catalog</span>
              <div className="font-heading font-black text-2xl text-emerald-600">
                {statusGames.filter((g) => g.status === 'PUBLISHED').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Under Review (QA)</span>
              <div className="font-heading font-black text-2xl text-amber-600">
                {statusGames.filter((g) => g.status === 'QA_TESTING').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Drafts & Pending</span>
              <div className="font-heading font-black text-2xl text-indigo-600">
                {statusGames.filter((g) => g.status === 'DRAFT').length + (showDraftBanner ? 1 : 0)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Suspended / Action</span>
              <div className="font-heading font-black text-2xl text-rose-600">
                {statusGames.filter((g) => g.status === 'SUSPENDED' || g.status === 'REJECTED').length}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="font-heading font-bold text-base text-slate-900">
                All Submissions & Review Pipeline
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track whether each title is Live, Pending Review, in Draft state, or Suspended.
              </p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {showDraftBanner && (
                <div className="p-5 bg-amber-50/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <FileArchive className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        Unsaved Local Draft (Incomplete Submission)
                      </div>
                      <span className="text-[11px] text-amber-800 font-medium">
                        User back gaya tha — click continue to finish upload
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleResumeDraft();
                      setActiveTab('upload');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    Continue Draft
                  </button>
                </div>
              )}

              {statusGames.map((game) => (
                <div key={game.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={game.thumbnailUrl}
                      alt=""
                      className="w-14 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{game.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {game.categoryName} &bull; {game.engine} &bull; {game.currentVersionId || 'v1.0.0'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                        game.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : game.status === 'QA_TESTING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : game.status === 'SUSPENDED' || game.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {game.status === 'PUBLISHED'
                        ? 'Live in Catalog'
                        : game.status === 'QA_TESTING'
                        ? 'Pending Review'
                        : game.status}
                    </span>

                    <Link
                      href={`/developer/submit?edit=${game.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors"
                    >
                      Update Build
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'upload' && submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-bold">Submission Incomplete</p>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <form onSubmit={handleSubmit} className="space-y-8">
        {/* ================= SECTION 1: ARCHIVE UPLOAD ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Game Build Package</span>
                <span className="text-xs font-normal text-slate-500">(Required ZIP Bundle)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Must contain an <code className="text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-200">index.html</code> at the root or main folder. Limit 50MB (max 250MB uncompressed).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100/60">
              <input
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 mx-auto flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {uploading
                      ? 'Scanning & staging archive...'
                      : file
                      ? file.name
                      : 'Choose or drag & drop game ZIP archive'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Accepts HTML5, WebGL, Phaser, Godot, and Unity WebGL exports (.zip)
                  </p>
                </div>
              </div>
            </label>

            {uploadError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <p className="font-bold">Security Scan Rejected Archive</p>
                  <p>{uploadError}</p>
                </div>
              </div>
            )}

            {scanResult && scanResult.passed && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Archive Verified & Scanned Successfully</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 text-slate-700 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Entry Point:</span>
                    <span className="text-emerald-700 font-bold">index.html (OK)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Files Count:</span>
                    <span>{scanResult.extractedFilesCount} files</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Decompressed:</span>
                    <span>{(scanResult.uncompressedSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SHA-256:</span>
                    <span className="truncate block" title={scanResult.sha256}>
                      {scanResult.sha256.substring(0, 12)}...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= SECTION 2: GAME METADATA ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Game Details & Discovery Metadata</h2>
              <p className="text-xs text-slate-500">Configure how players find and read about your game.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Game Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Neon Cyber Runner 2088"
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL Slug <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="neon-cyber-runner-2088"
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-indigo-700 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category <span className="text-rose-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  const names: Record<string, string> = {
                    'cat-arcade': 'Arcade',
                    'cat-action': 'Action',
                    'cat-puzzle': 'Puzzle',
                    'cat-strategy': 'Strategy',
                    'cat-rpg': 'RPG',
                    'cat-sports': 'Sports',
                    'cat-casual': 'Casual',
                  };
                  setCategoryName(names[e.target.value] || 'Arcade');
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
              >
                <option value="cat-arcade">Arcade (Retro, Endless Runner, 2D)</option>
                <option value="cat-action">Action (Shooter, Combat, Platformer)</option>
                <option value="cat-puzzle">Puzzle (Match-3, Brain, Physics)</option>
                <option value="cat-strategy">Strategy (Tower Defense, Tactical)</option>
                <option value="cat-rpg">RPG (Adventures, Dungeons, Stats)</option>
                <option value="cat-sports">Sports & Racing</option>
                <option value="cat-casual">Casual (Hypercasual, Relaxing)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Version Release String <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                placeholder="1.0.0"
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Short Pitch / Tagline (Max 160 characters)
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Dash, jump, and dodge laser barriers in this synthwave endless runner."
              maxLength={160}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Game Description
            </label>
            <textarea
              rows={4}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed description of lore, gameplay mechanics, and objective..."
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        {/* ================= SECTION 3: SPECS & CONTROLS ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Technical Specs & Controls</h2>
              <p className="text-xs text-slate-500">Configure viewport orientation and player inputs.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Game Engine / Framework
              </label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
              >
                <option value="HTML5 Canvas / Custom JS">HTML5 Canvas / Custom JS</option>
                <option value="Phaser 3 / HTML5 Canvas">Phaser 3</option>
                <option value="Godot 4 / WebGL">Godot 4 (WASM / WebGL)</option>
                <option value="Unity 2022+ / WebGL">Unity WebGL (WASM)</option>
                <option value="Three.js / WebGL">Three.js / WebGL 2.0</option>
                <option value="Construct 3 / HTML5">Construct 3</option>
                <option value="PlayCanvas / WebGL">PlayCanvas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Orientation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['LANDSCAPE', 'PORTRAIT', 'ANY'] as const).map((orient) => (
                  <button
                    key={orient}
                    type="button"
                    onClick={() => setOrientation(orient)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      orientation === orient
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {orient}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Player Controls Guide
            </label>
            <textarea
              rows={3}
              value={controls}
              onChange={(e) => setControls(e.target.value)}
              placeholder="e.g. WASD: Move&#10;Spacebar: Jump / Boost&#10;Mouse Click: Attack / Interact"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Release Notes / Changelog
            </label>
            <textarea
              rows={2}
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="What changes or improvements are in this version?"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        {/* ================= SECTION 4: VISUAL ASSETS ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Visual Branding & Thumbnails</h2>
              <p className="text-xs text-slate-500">High-res artwork ensures maximum player click-through rates.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Thumbnail Image URL (1:1 Ratio, 512x512)
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Banner Artwork URL (16:9 Ratio, 1920x1080)
              </label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
              <div className="w-48 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                <img
                  src={bannerUrl}
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 5: LEGAL & AI DISCLOSURES ================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-sm">
              5
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Legal Warranties & AI Disclosures</h2>
              <p className="text-xs text-slate-500">Strict transparency regarding AI tooling and copyright ownership.</p>
            </div>
          </div>

          {/* AI Disclosure Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              AI Generation Disclosure Tier <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'NONE_HUMAN_ONLY',
                  title: 'Human-Developed',
                  desc: 'Zero AI tools used for assets, sound, or code.',
                  icon: User,
                  color: 'text-emerald-700',
                },
                {
                  id: 'AI_ASSISTED',
                  title: 'AI-Assisted',
                  desc: 'AI assisted with drafting or concept art with human polishing.',
                  icon: Sparkles,
                  color: 'text-indigo-700',
                },
                {
                  id: 'AI_GENERATED',
                  title: 'AI-Generated',
                  desc: 'Visuals, sound, or code predominantly synthesized by AI.',
                  icon: Bot,
                  color: 'text-cyan-700',
                },
              ].map((tier) => {
                const Icon = tier.icon;
                const isSelected = aiDisclosure === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setAiDisclosure(tier.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-5 h-5 ${tier.color}`} />
                      {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-xs font-bold text-slate-900">{tier.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{tier.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Third-Party Asset & Music Licensing Proofs (Optional)
            </label>
            <input
              type="text"
              value={licensingNotes}
              onChange={(e) => setLicensingNotes(e.target.value)}
              placeholder="e.g. Kenney.nl CC0 assets; Incompetech Kevin MacLeod CC-BY 3.0"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          {/* Legal Warranties Checkboxes */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(e) => setRightsConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Copyright & IP Warranty:</strong> I certify that our studio owns or holds valid commercial distribution licenses for all code, graphics, audio, fonts, and assets in this package.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prohibitedConfirmed}
                onChange={(e) => setProhibitedConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Safety & Prohibited Content Certification:</strong> This build contains no malware, cryptominers, real-money gambling, adult/NSFW content, or hate speech.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I agree to the <strong className="text-slate-900">Gameverse Creator Distribution Agreement v1.0-2026</strong> and the 50% net advertising revenue sharing model.
              </span>
            </label>
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/developer/games"
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            Cancel and Discard
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={submitting}
            disabled={submitting || uploading}
          >
            Submit Build for QA Review
          </Button>
        </div>
      </form>
      )}
    </div>
  );
}
