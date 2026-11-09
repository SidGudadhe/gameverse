'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UploadCloud, CheckCircle, AlertTriangle, ArrowLeft, Shield, FileArchive, Sparkles } from 'lucide-react';

export default function GameSubmitPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('cat-arcade');
  const [engine, setEngine] = useState('HTML5 Canvas');
  const [orientation, setOrientation] = useState('LANDSCAPE');
  const [description, setDescription] = useState('');
  const [controls, setControls] = useState('');
  const [aiDisclosure, setAiDisclosure] = useState('NONE_HUMAN_ONLY');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setScanResult(null);

    // Run client-side archive security inspection simulation
    setTimeout(() => {
      setUploading(false);
      setScanResult({
        passed: true,
        fileName: file.name,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2),
        extractedFilesCount: 34,
        hasIndexHtml: true,
        sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      });
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rightsConfirmed) {
      alert('You must confirm copyright ownership and third-party asset licenses.');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="font-heading font-black text-3xl text-white">
          Submission Sent to Admin QA
        </h1>
        <p className="text-gray-300 text-sm leading-relaxed">
          Your game build <span className="font-semibold text-white">{title || 'New Game'}</span> has been safely archived, scanned, and queued in the Operations Workspace. Our QA team will test gameplay, sandbox security, and orientation before publishing.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Link
            href="/developer"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
          >
            Back to Studio Hub
          </Link>
          <Link
            href="/admin"
            className="bg-elevated hover:bg-white/10 text-gray-200 text-xs font-semibold px-5 py-2.5 rounded-xl border border-white/10 transition-colors"
          >
            Inspect in Admin QA Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/developer" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Studio Dashboard</span>
        </Link>
        <span>/</span>
        <span className="text-gray-200">Submit New Game</span>
      </div>

      <div>
        <h1 className="font-heading font-black text-3xl text-white">
          Submit Game Build & Metadata
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          Upload your runnable HTML5/WebGL ZIP archive. Files are scanned and isolated from the main website origin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Archive Upload Zone */}
        <div className="bg-surface rounded-2xl p-6 border border-white/10 space-y-4">
          <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-indigo-400" />
            <span>Game Build Archive (ZIP)</span>
          </h2>

          <div className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center hover:border-indigo-500/50 transition-colors relative">
            <input
              type="file"
              accept=".zip"
              onChange={handleSimulatedUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-white">
                Drag and drop your game ZIP archive here, or <span className="text-indigo-400">browse</span>
              </div>
              <p className="text-xs text-gray-400 max-w-sm">
                Must contain <code className="text-indigo-300">index.html</code> at root. Max 50 MB compressed, 250 MB unpacked. Executables (.exe, .dll) prohibited.
              </p>
            </div>
          </div>

          {uploading && (
            <div className="bg-elevated p-4 rounded-xl border border-white/5 text-xs text-indigo-300 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Scanning archive structure, unpacking index.html, and verifying checksum...</span>
            </div>
          )}

          {scanResult && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Archive Passed Pre-Flight Security Check</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-300 text-[11px] pt-1">
                <div>File: <span className="text-white font-mono">{scanResult.fileName}</span></div>
                <div>Size: <span className="text-white font-mono">{scanResult.sizeMb} MB</span></div>
                <div>Files Count: <span className="text-white font-mono">{scanResult.extractedFilesCount}</span></div>
                <div>Entry: <span className="text-emerald-400 font-mono">index.html (OK)</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Game Details */}
        <div className="bg-surface rounded-2xl p-6 border border-white/10 space-y-5">
          <h2 className="font-heading font-bold text-base text-white">
            Metadata & Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Game Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Galactic Strike 3D"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Primary Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="cat-arcade">Arcade</option>
                <option value="cat-action">Action</option>
                <option value="cat-puzzle">Puzzle</option>
                <option value="cat-strategy">Strategy</option>
                <option value="cat-rpg">RPG</option>
                <option value="cat-sports">Sports</option>
                <option value="cat-casual">Casual</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Game Engine / Framework *</label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Phaser 3 / Canvas">Phaser 3</option>
                <option value="Godot 4 WebGL">Godot 4 (HTML5/WebGL)</option>
                <option value="Unity WebGL">Unity WebGL (WASM)</option>
                <option value="Construct 3">Construct 3</option>
                <option value="Three.js / WebGL">Three.js / Custom WebGL</option>
                <option value="HTML5 Canvas">Pure HTML5 / JavaScript</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Target Orientation *</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="LANDSCAPE">Landscape (16:9 Recommended)</option>
                <option value="PORTRAIT">Portrait (Mobile First)</option>
                <option value="ANY">Responsive / Adaptive</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Game Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell players what makes your game exciting..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Controls & Instructions</label>
            <textarea
              rows={2}
              value={controls}
              onChange={(e) => setControls(e.target.value)}
              placeholder="e.g. WASD / Arrow keys to move, Space to jump, Left-click to shoot"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* AI & Rights Disclosure */}
        <div className="bg-surface rounded-2xl p-6 border border-white/10 space-y-4">
          <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>AI Disclosure & Rights Declaration</span>
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">AI Usage Disclosure *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'NONE_HUMAN_ONLY', label: 'Human-Developed Only', desc: 'No generative AI code or art' },
                { id: 'AI_ASSISTED', label: 'AI-Assisted', desc: 'Assisted with code/concepting' },
                { id: 'AI_GENERATED', label: 'Substantially AI-Generated', desc: 'AI generated graphics or audio' },
              ].map((tier) => (
                <button
                  type="button"
                  key={tier.id}
                  onClick={() => setAiDisclosure(tier.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    aiDisclosure === tier.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">{tier.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{tier.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={rightsConfirmed}
                onChange={(e) => setRightsConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-black/40 text-indigo-600 focus:ring-0"
              />
              <span className="text-xs text-gray-300 leading-relaxed">
                I hereby declare that I hold all intellectual property rights, commercial licenses for 3rd-party assets, music, fonts, and engines, and accept the GameVerse Creator Terms and 50% Net Monetization Agreement.
              </span>
            </label>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end gap-3">
          <Link
            href="/developer"
            className="px-5 py-2.5 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl border border-indigo-400/30 shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
          >
            Submit for QA Approval
          </button>
        </div>
      </form>
    </div>
  );
}
