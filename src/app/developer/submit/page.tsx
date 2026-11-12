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
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="success">Build Queued for QA Review</Badge>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-white">
            Submission Received!
          </h1>
          <p className="text-gray-300 text-sm max-w-xl mx-auto leading-relaxed">
            Your game <span className="font-semibold text-white">{submittedData.game?.title || title}</span> (v{submittedData.version?.versionNumber || versionNumber}) has been stored in our isolated runtime directory and queued for QA review.
          </p>
        </div>

        {/* Build Verification Summary Card */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 text-left max-w-xl mx-auto space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-gray-400 border-b border-white/5 pb-2">
            <span>Reference ID</span>
            <span className="text-indigo-400">{submittedData.submission?.id}</span>
          </div>
          <div className="flex justify-between items-center text-gray-400 border-b border-white/5 pb-2">
            <span>SHA-256 Checksum</span>
            <span className="text-emerald-400 truncate max-w-[260px]">
              {submittedData.version?.archiveChecksum || 'Computed'}
            </span>
          </div>
          <div className="flex justify-between items-center text-gray-400 border-b border-white/5 pb-2">
            <span>AI Disclosure</span>
            <span className="text-cyan-400">{submittedData.rights?.aiDisclosure || aiDisclosure}</span>
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span>Current State</span>
            <span className="text-amber-400 font-bold">SUBMITTED (Pending Operations QA)</span>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <Link
            href="/developer/games"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
          >
            View in My Games
          </Link>
          <Link
            href="/developer"
            className="bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-semibold px-6 py-3 rounded-xl border border-white/10 transition-colors"
          >
            Return to Studio Overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/developer" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Studio Hub</span>
        </Link>
        <span>/</span>
        <Link href="/developer/games" className="hover:text-white transition-colors">
          My Games
        </Link>
        <span>/</span>
        <span className="text-gray-200">Submit New Build</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-white">
          Submit Game Build & Metadata
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          Upload your runnable HTML5/WebGL ZIP archive. Files are scanned, hashed with SHA-256, and isolated on our sandbox runtime.
        </p>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-bold">Submission Incomplete</p>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ================= SECTION 1: ARCHIVE UPLOAD ================= */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Game Build Package</span>
                <span className="text-xs font-normal text-gray-400">(Required ZIP Bundle)</span>
              </h2>
              <p className="text-xs text-gray-400">
                Must contain an <code className="text-indigo-400">index.html</code> at the root or main folder. Limit 50MB (max 250MB uncompressed).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block border-2 border-dashed border-white/20 hover:border-indigo-500/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04]">
              <input
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mx-auto flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {uploading
                      ? 'Scanning & staging archive...'
                      : file
                      ? file.name
                      : 'Choose or drag & drop game ZIP archive'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Accepts HTML5, WebGL, Phaser, Godot, and Unity WebGL exports (.zip)
                  </p>
                </div>
              </div>
            </label>

            {uploadError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <p className="font-bold">Security Scan Rejected Archive</p>
                  <p>{uploadError}</p>
                </div>
              </div>
            )}

            {scanResult && scanResult.passed && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Archive Verified & Scanned Successfully</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-gray-300 font-mono text-[11px]">
                  <div>
                    <span className="text-gray-400 block">Entry Point:</span>
                    <span className="text-emerald-400">index.html (OK)</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Files Count:</span>
                    <span>{scanResult.extractedFilesCount} files</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Decompressed:</span>
                    <span>{(scanResult.uncompressedSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">SHA-256:</span>
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
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Game Details & Discovery Metadata</h2>
              <p className="text-xs text-gray-400">Configure how players find and read about your game.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Game Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Neon Cyber Runner 2088"
                required
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                URL Slug <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="neon-cyber-runner-2088"
                required
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-indigo-300 font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Category <span className="text-rose-400">*</span>
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
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Version Release String <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                placeholder="1.0.0"
                required
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Short Pitch / Tagline (Max 160 characters)
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Dash, jump, and dodge laser barriers in this synthwave endless runner."
              maxLength={160}
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Full Game Description
            </label>
            <textarea
              rows={4}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed description of lore, gameplay mechanics, and objective..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* ================= SECTION 3: SPECS & CONTROLS ================= */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Technical Specs & Controls</h2>
              <p className="text-xs text-gray-400">Configure viewport orientation and player inputs.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Game Engine / Framework
              </label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Target Orientation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['LANDSCAPE', 'PORTRAIT', 'ANY'] as const).map((orient) => (
                  <button
                    key={orient}
                    type="button"
                    onClick={() => setOrientation(orient)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      orientation === orient
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {orient}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Player Controls Guide
            </label>
            <textarea
              rows={3}
              value={controls}
              onChange={(e) => setControls(e.target.value)}
              placeholder="e.g. WASD: Move&#10;Spacebar: Jump / Boost&#10;Mouse Click: Attack / Interact"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Release Notes / Changelog
            </label>
            <textarea
              rows={2}
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="What changes or improvements are in this version?"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* ================= SECTION 4: VISUAL ASSETS ================= */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Visual Branding & Thumbnails</h2>
              <p className="text-xs text-gray-400">High-res artwork ensures maximum player click-through rates.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-300">
                Thumbnail Image URL (1:1 Ratio, 512x512)
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 bg-slate-950">
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
              <label className="block text-xs font-semibold text-gray-300">
                Banner Artwork URL (16:9 Ratio, 1920x1080)
              </label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="w-48 h-24 rounded-xl overflow-hidden border border-white/10 bg-slate-950">
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
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              5
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Legal Warranties & AI Disclosures</h2>
              <p className="text-xs text-gray-400">Strict transparency regarding AI tooling and copyright ownership.</p>
            </div>
          </div>

          {/* AI Disclosure Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300">
              AI Generation Disclosure Tier <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'NONE_HUMAN_ONLY',
                  title: 'Human-Developed',
                  desc: 'Zero AI tools used for assets, sound, or code.',
                  icon: User,
                  color: 'text-emerald-400',
                },
                {
                  id: 'AI_ASSISTED',
                  title: 'AI-Assisted',
                  desc: 'AI assisted with drafting or concept art with human polishing.',
                  icon: Sparkles,
                  color: 'text-indigo-400',
                },
                {
                  id: 'AI_GENERATED',
                  title: 'AI-Generated',
                  desc: 'Visuals, sound, or code predominantly synthesized by AI.',
                  icon: Bot,
                  color: 'text-cyan-400',
                },
              ].map((tier) => {
                const Icon = tier.icon;
                const isSelected = aiDisclosure === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setAiDisclosure(tier.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-600/20'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-5 h-5 ${tier.color}`} />
                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-xs font-bold text-white">{tier.title}</p>
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">{tier.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Third-Party Asset & Music Licensing Proofs (Optional)
            </label>
            <input
              type="text"
              value={licensingNotes}
              onChange={(e) => setLicensingNotes(e.target.value)}
              placeholder="e.g. Kenney.nl CC0 assets; Incompetech Kevin MacLeod CC-BY 3.0"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Legal Warranties Checkboxes */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(e) => setRightsConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-white">Copyright & IP Warranty:</strong> I certify that our studio owns or holds valid commercial distribution licenses for all code, graphics, audio, fonts, and assets in this package.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prohibitedConfirmed}
                onChange={(e) => setProhibitedConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-white">Safety & Prohibited Content Certification:</strong> This build contains no malware, cryptominers, real-money gambling, adult/NSFW content, or hate speech.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-300 leading-relaxed">
                I agree to the <strong className="text-white">Gameverse Creator Distribution Agreement v1.0-2026</strong> and the 50% net advertising revenue sharing model.
              </span>
            </label>
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/developer/games"
            className="text-xs text-gray-400 hover:text-white transition-colors"
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
    </div>
  );
}
