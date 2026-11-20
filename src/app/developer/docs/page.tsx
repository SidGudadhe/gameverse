'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Code2,
  Package,
  ShieldCheck,
  DollarSign,
  Layers,
  FileCode,
  Terminal,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function DeveloperDocsPage() {
  const [activeTab, setActiveTab] = useState<'unity' | 'godot' | 'phaser' | 'construct' | 'html5'>('unity');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

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

  // 2. Submit high score and gameplay completion metrics
  gameOver(data = { score: 0, level: 1 }) {
    window.parent.postMessage({
      type: 'GV_GAME_OVER',
      score: data.score,
      level: data.level,
      timestamp: Date.now()
    }, '*');
  },

  // 3. Request a rewarded or interstitial ad break
  requestAd(adType = 'interstitial') {
    return new Promise((resolve) => {
      const handleAdResponse = (event) => {
        if (event.data?.type === 'GV_AD_COMPLETED') {
          window.removeEventListener('message', handleAdResponse);
          resolve(event.data.rewardEarned);
        }
      };
      window.addEventListener('message', handleAdResponse);
      window.parent.postMessage({ type: 'GV_REQUEST_AD', adType }, '*');
    });
  },

  // 4. Listen for GameVerse host events (Pause/Resume/Mute)
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

// Call when engine is ready:
GV_SDK.ready();`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-600" />
            <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider">
              Developer Studio Documentation
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
            GameVerse SDK & Publishing Guide
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5 max-w-2xl">
            Integrate the postMessage SDK, package your HTML5 or WebGL builds correctly, and monetize with automated ad impressions.
          </p>
        </div>

        <Link
          href="/developer/submit"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Upload Build Now</span>
        </Link>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">ZIP Archive Structure</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your ZIP archive must contain an <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">index.html</code> at its root.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Code2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">postMessage API</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Communicate with the GameVerse iframe runner securely using standard HTML5 postMessage events.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Automated Monetization</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Automated monetization with transparent monthly ledger reconciliation and direct payouts.
          </p>
        </div>
      </div>

      {/* Core SDK Code Example */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <span>Universal Client-Side SDK Protocol</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Copy this standard snippet into your game client to support host lifecycle events and ad monetization.
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
      </div>

      {/* Engine Guides */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="font-heading font-bold text-lg text-slate-900">
            Engine Export Guides
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
                <li>In <strong className="text-slate-900">Player Settings &gt; Publishing Settings</strong>, enable Compression Format: <em>Gzip</em> or <em>Disabled</em>.</li>
                <li>Build your project to an empty folder. You will get an <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">index.html</code> and a <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">Build/</code> directory.</li>
                <li>Zip the contents of this folder directly (ensuring index.html is at root) and upload to GameVerse Studio.</li>
              </ol>
            </div>
          )}

          {activeTab === 'godot' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Godot 4.x HTML5 Export Instructions:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                <li>Go to <strong className="text-slate-900">Project &gt; Export...</strong></li>
                <li>Add a preset for <strong className="text-slate-900">Web</strong>.</li>
                <li>Set the export path to <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">index.html</code>.</li>
                <li>Click <strong className="text-slate-900">Export Project</strong> and zip the resulting files together.</li>
              </ol>
            </div>
          )}

          {activeTab === 'phaser' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Phaser 3 / PixiJS Bundling:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                <li>Run your build command (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">npm run build</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">vite build</code>).</li>
                <li>Ensure the output directory (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">dist/</code>) contains <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">index.html</code>.</li>
                <li>Verify all assets (sprites, audio, fonts) are loaded with relative paths.</li>
                <li>Zip the <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">dist/</code> contents and upload.</li>
              </ol>
            </div>
          )}

          {activeTab === 'construct' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Construct 3 Export:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                <li>Go to <strong className="text-slate-900">Menu &gt; Project &gt; Export</strong>.</li>
                <li>Select <strong className="text-slate-900">HTML5</strong>.</li>
                <li>Choose "Standard HTML5 website" and uncheck "Deduplicate images" if not needed.</li>
                <li>Download the generated zip file and upload directly to GameVerse Studio.</li>
              </ol>
            </div>
          )}

          {activeTab === 'html5' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Pure HTML5 Canvas / JavaScript:</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                <li>Ensure your main entry file is named <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">index.html</code>.</li>
                <li>All script files, styles, and audio must be linked with relative paths (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">./game.js</code>).</li>
                <li>Call <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">window.parent.postMessage(&#123; type: 'GV_READY' &#125;, '*')</code> once assets are loaded.</li>
                <li>Zip your game directory and upload.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
