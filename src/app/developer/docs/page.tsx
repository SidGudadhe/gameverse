'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Code2,
  Package,
  ShieldCheck,
  IndianRupee,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  FileText,
  UploadCloud,
  Cpu,
  Scale,
  Lock,
} from 'lucide-react';
import DeveloperLogo from '@/components/ui/DeveloperLogo';

interface AgreementStatus {
  agreementVersion: string;
  accountStatus: string;
  acceptedAt?: string;
}

const UPLOAD_STEPS = [
  {
    step: '01',
    title: 'Export Web Build & Package as .zip',
    badge: 'Build Format',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    description:
      'Export your game for the browser as static web files with index.html at the root of your .zip archive. Use relative asset paths (./game.js, ./Build/...) — never absolute / paths.',
    bullets: [
      'Limits: up to 100 MB compressed .zip, 350 MB uncompressed, max 5,000 files (10:1 compression ratio limit).',
      'Single wrapper folders (e.g. MyGame/index.html) and macOS __MACOSX metadata are unwrapped automatically.',
      'Prohibited: .exe, .dll, .bat, .sh, .msi, .jar, symlinks, or path traversal entries are blocked on upload.',
    ],
  },
  {
    step: '02',
    title: 'Integrate the GameVerse Client SDK',
    badge: 'postMessage API',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description:
      'Wire the lightweight GV_SDK postMessage bridge inside index.html or your main entry script so the GameVerse sandbox player can manage loading state, pause/mute, scores, and in-game ads.',
    bullets: [
      'Call GV_SDK.ready() once your engine finishes loading so the player loader clears immediately.',
      'Listen for GV_PAUSE, GV_RESUME, GV_MUTE, and GV_UNMUTE from window messages.',
      'Trigger GV_SDK.requestAd("INTERSTITIAL") or GV_SDK.requestAd("REWARDED") cleanly between levels.',
    ],
  },
  {
    step: '03',
    title: 'Complete Creator Onboarding & Studio Setup',
    badge: 'Prerequisite',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    description:
      'Before uploading builds, accept the binding GameVerse Creator Agreement v2026.1 during studio onboarding and keep your Studio Profile contact identity up to date.',
    bullets: [
      'Requires ACTIVE studio account status linked to your developer session.',
      'Creators earn 50% (organic traffic) or 70% (studio referral) of Net In-Game Ads revenue.',
      'Monthly Net-30 payout reconciliation runs through your Developer Payouts ledger.',
    ],
  },
  {
    step: '04',
    title: 'Upload Build & Game Metadata in Submit Game',
    badge: '/developer/submit',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description:
      'Go to Submit Game and upload your .zip bundle. Our pre-flight scanner verifies index.html, MIME types, and security checks automatically before saving metadata.',
    bullets: [
      'Select Catalog Group (Veg / Non-Veg), Genre Subcategory, Engine, Orientation, and Player Mode.',
      'Choose accurate Development Attribution: Human Developed, AI + Human Developed, or AI Developed.',
      'Attach crisp thumbnail/banner artwork plus a short gameplay preview video, then sign Rights & Content checkboxes.',
    ],
  },
  {
    step: '05',
    title: 'Sandbox Isolation Test & Admin QA Review',
    badge: 'QA Gate',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description:
      'GameVerse extracts every verified file into your versioned sandbox directory and queues a QA submission for the Admin Operations team.',
    bullets: [
      'Builds run in a hardened iframe sandbox (allow-scripts allow-same-origin allow-pointer-lock) with WASM & Brotli/Gzip support.',
      'Top-level redirects (allow-top-navigation) and popups are strictly disabled by browser sandbox policy.',
      'You can test the exact extracted build from My Games > Sandbox Preview while QA reviews it.',
    ],
  },
  {
    step: '06',
    title: 'Go Live on Player Portal & Push Seamless Updates',
    badge: 'Production',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    description:
      'Once approved and published by Admin, your game goes live immediately on the GameVerse Player catalog with full play-time and ad telemetry.',
    bullets: [
      'If Admin sends a Change Request on your Developer Home dashboard, click Edit Game to prefill and resubmit directly.',
      'Already-live games stay uninterrupted for players while you upload a bumped SemVer build (e.g. 1.0.1) in My Games.',
      'All approved updates promote cleanly to the active player version without breaking your game URL.',
    ],
  },
];

const SDK_EVENTS = [
  { direction: 'Game -> Host', type: 'GV_READY', payload: '{}', purpose: 'Signals engine assets finished loading' },
  { direction: 'Game -> Host', type: 'GV_GAME_OVER', payload: '{ score, level }', purpose: 'Reports round end metrics & score' },
  { direction: 'Game -> Host', type: 'GV_GAME_WIN', payload: '{ score, level }', purpose: 'Reports level or stage completion' },
  {
    direction: 'Game -> Host',
    type: 'GV_REQUEST_AD',
    payload: '{ format: "INTERSTITIAL" | "REWARDED" }',
    purpose: 'Requests an in-game ad break and awaits completion',
  },
  { direction: 'Host -> Game', type: 'GV_PAUSE / GV_RESUME', payload: '{}', purpose: 'Pauses or resumes gameplay loop during overlays/ads' },
  { direction: 'Host -> Game', type: 'GV_MUTE / GV_UNMUTE', payload: '{}', purpose: 'Mutes or restores master WebAudio sound bus' },
  { direction: 'Host -> Game', type: 'GV_AD_COMPLETED', payload: '{ rewardEarned: boolean }', purpose: 'Notifies game after in-game ad finishes' },
];

export default function DeveloperDocsPage() {
  const [activeTab, setActiveTab] = useState<'unity' | 'godot' | 'phaser' | 'construct' | 'html5'>('unity');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [agreement, setAgreement] = useState<AgreementStatus | null>(null);

  useEffect(() => {
    let active = true;
    const loadAgreementStatus = async () => {
      try {
        const res = await fetch('/api/developer/profile');
        if (!res.ok) return;
        const data = await res.json();
        const ag = data?.agreement || data?.data?.agreement;
        if (active && ag) {
          setAgreement(ag);
        }
      } catch {
        // Docs page also renders cleanly for visitors before studio login
      }
    };
    loadAgreementStatus();
    return () => {
      active = false;
    };
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const sdkProtocolCode = `// GameVerse Client-Side postMessage SDK Integration
// Add this snippet to your game client (index.html or main game script)

const GV_SDK = {
  // 1. Notify GameVerse host that your engine and assets are fully loaded
  ready() {
    window.parent.postMessage({ type: 'GV_READY' }, '*');
    console.log('[GameVerse SDK] Ready signal dispatched.');
  },

  // 2. Submit score when a round or match ends
  gameOver(data = { score: 0, level: 1 }) {
    window.parent.postMessage({
      type: 'GV_GAME_OVER',
      score: data.score,
      level: data.level,
      timestamp: Date.now()
    }, '*');
  },

  // 3. Report level victory / completion
  gameWin(data = { score: 0, level: 1 }) {
    window.parent.postMessage({
      type: 'GV_GAME_WIN',
      score: data.score,
      level: data.level,
      timestamp: Date.now()
    }, '*');
  },

  // 4. Request an in-game REWARDED or INTERSTITIAL ad break
  requestAd(adType = 'INTERSTITIAL') {
    const format = String(adType || 'INTERSTITIAL').toUpperCase();
    return new Promise((resolve) => {
      const handleAdResponse = (event) => {
        if (event.data?.type === 'GV_AD_COMPLETED') {
          window.removeEventListener('message', handleAdResponse);
          resolve(Boolean(event.data.rewardEarned));
        }
      };
      window.addEventListener('message', handleAdResponse);
      window.parent.postMessage({ type: 'GV_REQUEST_AD', format, adType: format }, '*');
    });
  },

  // 5. Listen for GameVerse host lifecycle events (Pause/Resume/Mute)
  initListeners({ onPause, onResume, onMute, onUnmute }) {
    window.addEventListener('message', (event) => {
      switch (event.data?.type) {
        case 'GV_PAUSE':
          if (onPause) onPause();
          break;
        case 'GV_RESUME':
          if (onResume) onResume();
          break;
        case 'GV_MUTE':
          if (onMute) onMute();
          break;
        case 'GV_UNMUTE':
          if (onUnmute) onUnmute();
          break;
      }
    });
  }
};

// Initialize listeners on launch
GV_SDK.initListeners({
  onPause: () => { /* Pause game loop / physics */ },
  onResume: () => { /* Resume game loop */ },
  onMute: () => { /* Mute master WebAudio bus */ },
  onUnmute: () => { /* Restore master audio */ },
});

// Call once assets & canvas are ready:
GV_SDK.ready();`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <DeveloperLogo size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-600" />
              <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider">
                Developer Studio Documentation
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
              GameVerse Docs, Upload Guide & SDK
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5 max-w-2xl">
              Step-by-step packaging, postMessage SDK integration, creator agreements, and live publishing workflow.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="#upload-guide"
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            Upload Steps
          </a>
          <a
            href="#sdk-protocol"
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            SDK Reference
          </a>
          <a
            href="#creator-agreements"
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            Creator Agreements
          </a>
          <Link
            href="/developer/submit"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upload Build Now</span>
          </Link>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Supported Game Format (.zip)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Static HTML5 / WebGL <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">.zip</code> containing{' '}
            <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">index.html</code> at root (or single wrapper folder). Up to 100 MB ZIP / 350 MB extracted.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Code2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Sandbox postMessage SDK</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Communicate securely with the GameVerse Player iframe via standard window <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">postMessage</code> calls.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <IndianRupee className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">In-Game Ads Revenue Share</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Earn 50% organic / 70% studio-referred share strictly from in-game ads, settled automatically via Net-30 ledger reconciliation.
          </p>
        </div>
      </div>

      {/* STEP-BY-STEP GAME UPLOAD & PUBLISHING GUIDE */}
      <section id="upload-guide" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-600" />
              <span>Step-by-Step Guide: How to Upload & Publish a Game</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow these 6 verified steps from engine export to live player release on GameVerse.
            </p>
          </div>
          <Link
            href="/developer/submit"
            className="text-xs font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 border border-cyan-200 px-3.5 py-2 rounded-xl self-start sm:self-auto"
          >
            Open Submit Game Form
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {UPLOAD_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-mono font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${item.badgeClass}`}>
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              <ul className="space-y-1.5 text-[11px] text-slate-700">
                {item.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Core SDK Code Example */}
      <section id="sdk-protocol" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <span>Universal Client-Side SDK Protocol</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Copy this standard snippet into your game client to support host lifecycle events and in-game ad monetization.
            </p>
          </div>

          <button
            onClick={() => copyToClipboard(sdkProtocolCode, 'sdk-protocol')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            {copiedSnippet === 'sdk-protocol' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SDK Code</span>
              </>
            )}
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-sm">
          <div className="bg-slate-800/90 px-4 py-2.5 border-b border-slate-700/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-slate-300 font-semibold">gv-sdk.js</span>
            </div>
            <span>JavaScript postMessage</span>
          </div>
          <div className="p-5 font-mono text-xs overflow-x-auto text-slate-100 leading-relaxed">
            <pre>{sdkProtocolCode}</pre>
          </div>
        </div>

        {/* Event Reference Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-mono">
                <th className="py-2.5 px-4">Direction</th>
                <th className="py-2.5 px-4">Message Type</th>
                <th className="py-2.5 px-4">Payload</th>
                <th className="py-2.5 px-4">Behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SDK_EVENTS.map((ev) => (
                <tr key={ev.type} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">{ev.direction}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">{ev.type}</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700">{ev.payload}</td>
                  <td className="py-2.5 px-4 text-slate-600">{ev.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Engine Guides */}
      <section id="engine-guides" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-600" />
            <span>Engine Export Guides</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step instructions for exporting HTML5 and WebGL builds across popular game engines.
          </p>
        </div>

        {/* Engine Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none text-xs">
          {[
            { id: 'unity', label: 'Unity WebGL' },
            { id: 'godot', label: 'Godot 4.x HTML5' },
            { id: 'phaser', label: 'Phaser 3 / PixiJS' },
            { id: 'construct', label: 'Construct 3' },
            { id: 'html5', label: 'Pure HTML5 / Canvas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          {activeTab === 'unity' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Unity WebGL Export Instructions:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                <li>In Unity, go to <strong className="text-slate-900">File &gt; Build Settings</strong>.</li>
                <li>Select <strong className="text-slate-900">WebGL</strong> as the platform and click Switch Platform.</li>
                <li>In <strong className="text-slate-900">Player Settings &gt; Publishing Settings</strong>, choose Compression Format: <em>Brotli</em>, <em>Gzip</em>, or <em>Disabled</em> (GameVerse serves matching Content-Encoding headers automatically).</li>
                <li>Build your project to an empty folder. You will get an <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">index.html</code> and a <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">Build/</code> directory.</li>
                <li>Zip the contents of this folder and upload directly to GameVerse Studio.</li>
              </ol>
            </div>
          )}

          {activeTab === 'godot' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Godot 4.x HTML5 Export Instructions:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                <li>Go to <strong className="text-slate-900">Project &gt; Export...</strong></li>
                <li>Add a preset for <strong className="text-slate-900">Web</strong> and verify relative asset paths.</li>
                <li>Set the export file name to <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">index.html</code> in a dedicated folder.</li>
                <li>Click <strong className="text-slate-900">Export Project</strong> and zip the resulting files together (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">.html</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">.js</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">.wasm</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">.pck</code>).</li>
              </ol>
            </div>
          )}

          {activeTab === 'phaser' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Phaser 3 / PixiJS Bundling:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                <li>Configure Vite / Webpack with <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">base: &apos;./&apos;</code> so all chunk and sprite URLs resolve cleanly inside the sandbox path.</li>
                <li>Run your production build command (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">npm run build</code>).</li>
                <li>Ensure the output directory (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">dist/</code>) contains <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">index.html</code> at root.</li>
                <li>Zip the <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">dist/</code> contents and upload.</li>
              </ol>
            </div>
          )}

          {activeTab === 'construct' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Construct 3 Export:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                <li>Go to <strong className="text-slate-900">Menu &gt; Project &gt; Export</strong>.</li>
                <li>Select <strong className="text-slate-900">HTML5</strong> (&quot;Web / HTML5 website&quot;).</li>
                <li>Export cleanly without external host dependencies and confirm <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">index.html</code> exists at root.</li>
                <li>Download the generated zip file and upload directly to GameVerse Studio.</li>
              </ol>
            </div>
          )}

          {activeTab === 'html5' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Pure HTML5 Canvas / JavaScript:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                <li>Ensure your main entry file is named <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">index.html</code>.</li>
                <li>All script files, styles, textures, and audio must use relative paths (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">./game.js</code>).</li>
                <li>Call <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">window.parent.postMessage(&#123; type: &apos;GV_READY&apos; &#125;, &apos;*&apos;)</code> once assets finish loading.</li>
                <li>Zip your game directory and upload via Submit Game.</li>
              </ol>
            </div>
          )}
        </div>
      </section>

      {/* CREATOR AGREEMENT & DEVELOPER PUBLISHING AGREEMENTS */}
      <section id="creator-agreements" className="space-y-6">
        {/* Live Creator Agreement Card (moved cleanly from Studio Profile) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>GameVerse Creator Agreement</span>
              </h2>
              <p className="text-xs text-slate-500">
                Your binding terms governing game distribution, in-game ad revenue splits, Net-30 settlements, and sandbox compliance.
              </p>
            </div>
            <Link
              href="/developer/agreement"
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View Full Agreement</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Agreement Version</div>
              <div className="text-sm font-bold text-slate-900 mt-1 font-mono">
                {agreement?.agreementVersion || 'v1.0-2026'}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Account Status</div>
              <div className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{agreement?.accountStatus || 'ACTIVE'}</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Accepted Date</div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {agreement?.acceptedAt ? new Date(agreement.acceptedAt).toLocaleDateString() : 'Onboarding Complete'}
              </div>
            </div>
          </div>
        </div>

        {/* All Required Agreements & Policy Summary */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" />
              <span>Required Developer Agreements & Policies</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every build submitted to GameVerse Studio is governed by these binding creator agreements and technical compliance rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  1. Creator Distribution & Monetization Agreement
                </span>
                <Link href="/developer/agreement" className="text-purple-600 hover:underline font-semibold">
                  Read Terms
                </Link>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Non-exclusive web hosting license allowing GameVerse to serve your submitted builds to players, pay Net-30 monthly settlements strictly from verified in-game ad impressions (50% organic / 70% referral), and retain a 30-day archive recovery window upon studio deletion.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-600" />
                  2. Copyright, Third-Party Assets & AI Disclosure
                </span>
                <Link href="/developer/submit" className="text-cyan-700 hover:underline font-semibold">
                  Signed Per Upload
                </Link>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Required on every new release and update: studio certifies full IP ownership or valid commercial licenses for all code, sprites, fonts, audio, and SDKs, plus truthful disclosure of Human, AI + Human, or AI generation.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  3. Developer Terms & Sandbox Security Rules
                </span>
                <Link href="/developer/terms" className="text-indigo-600 hover:underline font-semibold">
                  Developer Terms
                </Link>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Prohibits executables, miners, trackers, malicious scripts, and top-frame redirects inside the game iframe. Requires honest Veg / Non-Veg catalog classification before Admin QA approval.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  4. Invalid Traffic (IVT) & Privacy Integrity
                </span>
                <Link href="/developer/privacy" className="text-emerald-700 hover:underline font-semibold">
                  Developer Privacy
                </Link>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Zero tolerance for scripted bots, forced/hidden ad triggers, or telemetry manipulation. Keeps developer identity, payouts, and agreements isolated exclusively inside GameVerse Studio.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
