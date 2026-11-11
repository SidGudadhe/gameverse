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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function DeveloperPublishingGuidePage() {
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

  const engineGuides = {
    unity: {
      title: 'Unity WebGL Export Instructions',
      steps: [
        'Open your project in Unity 2021 LTS, 2022 LTS, or Unity 6.',
        'Navigate to File > Build Settings, select "WebGL" platform, and click "Switch Platform".',
        'Open Player Settings > Publishing Settings: Set Compression Format to "Gzip" or "Brotli", and enable "Decompression Fallback".',
        'Ensure Resolution and Presentation is set to "Default" or custom responsive canvas template.',
        'Click "Build" to export into an output directory.',
        'Verify that index.html and the Build/ directory are located directly at the root of your export.',
        'Compress the folder contents (not the parent folder) into a .zip file under 50 MB.',
      ],
      tip: 'Avoid absolute URL references in Unity loader templates. GameVerse serves game builds under isolated iframe origins.',
    },
    godot: {
      title: 'Godot 4 HTML5 / WebGL Export',
      steps: [
        'In Godot 4.x, click Project > Export.',
        'Add a new export preset for "Web".',
        'Under "HTML", ensure Export Type is set to "Regular" (or Threads if SharedArrayBuffer headers are configured).',
        'Set Output File path to an empty directory as index.html.',
        'Click "Export Project" and uncheck "Export With Debug" for production release.',
        'Verify the output folder contains index.html, index.js, index.wasm, index.pck.',
        'Compress the contents of the folder directly into game-build.zip.',
      ],
      tip: 'For maximum browser compatibility across mobile and desktop, Godot 4.3+ Single-Threaded WebGL2 export is strongly recommended.',
    },
    phaser: {
      title: 'Phaser 3 / Vite / Webpack Export',
      steps: [
        'In your Phaser 3 project package.json, configure your build tool (e.g. Vite, Webpack, Parcel).',
        'Set base path to relative: base: "./" in vite.config.js or publicPath: "./" in webpack.',
        'Run your production build script: npm run build.',
        'Verify that the dist/ folder has index.html at its top level.',
        'Test locally using an HTTP server to confirm assets load via relative paths without 404 errors.',
        'Zip the contents of dist/ directly into a single archive.',
      ],
      tip: 'Do not bundle node_modules in your final ZIP. Keep bundle files minified with terser.',
    },
    construct: {
      title: 'Construct 3 Web Export',
      steps: [
        'In Construct 3, click Menu > Project > Export.',
        'Choose "HTML5 (web)" and click Next.',
        'Select "Standard HTML5 website" format.',
        'Enable "Deduplicate images" and "Minify script" options for optimal download speed.',
        'Download the generated ZIP file directly from Construct 3 editor.',
        'Ensure the ZIP archive contains index.html at root level before uploading to GameVerse.',
      ],
      tip: 'Construct 3 exports are 100% compliant with GameVerse postMessage protocol out-of-the-box.',
    },
    html5: {
      title: 'Custom HTML5 / Canvas / Vanilla JS Games',
      steps: [
        'Structure your game directory with index.html at the root.',
        'Keep all asset references relative (e.g. <script src="./js/game.js"> and img.src = "./assets/player.png").',
        'Do not reference external CDNs or unvetted scripts; all game assets must be self-contained in the ZIP.',
        'Implement window.parent.postMessage({ type: "GV_READY" }, "*") upon game loop start.',
        'Zip your files directly (index.html, styles, scripts, assets) into a .zip file.',
      ],
      tip: 'Self-contained zero-dependency vanilla JS games enjoy the fastest load times (<250ms) on GameVerse Edge CDN.',
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb & Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/developer"
            className="text-gray-400 hover:text-white text-xs transition-colors"
          >
            Developer Studio
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-indigo-400 text-xs font-semibold">Documentation & SDK</span>
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-white">
          Game Publishing Guide & SDK Specification
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-3xl">
          Complete instructions for packaging, sandboxing, monetization, and integrating your WebGL/HTML5 games with the GameVerse host protocol.
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-elevated/40 border border-white/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Packaging Rules</h3>
          </div>
          <p className="text-gray-400 text-xs">
            ZIP archive limits (50 MB), entry file requirements, and strict relative file paths.
          </p>
        </div>

        <div className="bg-elevated/40 border border-white/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">postMessage SDK</h3>
          </div>
          <p className="text-gray-400 text-xs">
            Ready signals, score reporting, ad triggers, and responsive pause/mute handling.
          </p>
        </div>

        <div className="bg-elevated/40 border border-white/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-sm">Origin Isolation</h3>
          </div>
          <p className="text-gray-400 text-xs">
            Sandboxed iframes, CSP policies, and zero parent window access for untrusted code.
          </p>
        </div>

        <div className="bg-elevated/40 border border-white/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Monetization</h3>
          </div>
          <p className="text-gray-400 text-xs">
            50%–70% creator revenue share, Net-30 monthly settlements, and $50 payout threshold.
          </p>
        </div>
      </div>

      {/* 1. ZIP Packaging Specifications */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-400" />
          <span>1. ZIP Packaging Specifications</span>
        </h2>
        <div className="bg-elevated/30 border border-white/10 rounded-2xl p-6 space-y-4">
          <p className="text-sm text-gray-300">
            GameVerse automated QA pipeline inspects every uploaded archive prior to review. To pass automated pre-flight security scans:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Mandatory Requirements</span>
              </div>
              <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">Root entry point:</strong> Must contain <code className="text-indigo-300 bg-white/5 px-1 py-0.5 rounded">index.html</code> at archive root.</li>
                <li><strong className="text-white">Relative asset paths:</strong> Use <code className="text-indigo-300 bg-white/5 px-1 py-0.5 rounded">./assets/file.png</code>, never absolute paths like <code className="text-red-300 bg-white/5 px-1 py-0.5 rounded">/assets/file.png</code>.</li>
                <li><strong className="text-white">Size limits:</strong> Max 50 MB compressed, max 250 MB uncompressed.</li>
                <li><strong className="text-white">Compression ratio:</strong> Must not exceed 10:1 (anti-ZIP-bomb protection).</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Strictly Prohibited</span>
              </div>
              <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                <li>Native executable binaries (<code className="text-red-300">.exe</code>, <code className="text-red-300">.dll</code>, <code className="text-red-300">.so</code>, <code className="text-red-300">.dylib</code>).</li>
                <li>Shell or batch scripts (<code className="text-red-300">.bat</code>, <code className="text-red-300">.cmd</code>, <code className="text-red-300">.sh</code>).</li>
                <li>Nested root folders (e.g. <code className="text-gray-400">my-game/index.html</code> inside the ZIP instead of <code className="text-gray-400">index.html</code>).</li>
                <li>Third-party crypto-mining or telemetry tracking scripts.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Game Engine Export Instructions */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-indigo-400" />
          <span>2. Game Engine Export Instructions</span>
        </h2>

        {/* Engine Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
          {(['unity', 'godot', 'phaser', 'construct', 'html5'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-elevated hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'html5' ? 'HTML5 Canvas' : tab}
            </button>
          ))}
        </div>

        <div className="bg-elevated/30 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base">
            {engineGuides[activeTab].title}
          </h3>
          <ol className="space-y-2.5 text-xs text-gray-300 list-decimal list-inside">
            {engineGuides[activeTab].steps.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                <span className="text-gray-200">{step}</span>
              </li>
            ))}
          </ol>
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded">
              Engine Tip
            </span>
            <span>{engineGuides[activeTab].tip}</span>
          </div>
        </div>
      </section>

      {/* 3. GameVerse postMessage SDK Protocol */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <span>3. GameVerse postMessage SDK Protocol</span>
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(sdkProtocolCode, 'sdk-code')}
            leftIcon={copiedSnippet === 'sdk-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedSnippet === 'sdk-code' ? 'Copied' : 'Copy SDK Code'}
          </Button>
        </div>

        <div className="bg-black/60 border border-white/10 rounded-2xl p-5 overflow-x-auto">
          <pre className="font-mono text-xs text-indigo-200 leading-relaxed">
            <code>{sdkProtocolCode}</code>
          </pre>
        </div>

        {/* Protocol Event Reference Table */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4">Payload</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-3 px-4 font-mono text-indigo-300">GV_READY</td>
                <td className="py-3 px-4"><Badge variant="cyan">Game → Host</Badge></td>
                <td className="py-3 px-4 font-mono text-gray-400">-</td>
                <td className="py-3 px-4">Dispatched when assets load. Hides the cyber loading skeleton.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-indigo-300">GV_GAME_OVER</td>
                <td className="py-3 px-4"><Badge variant="cyan">Game → Host</Badge></td>
                <td className="py-3 px-4 font-mono text-gray-400">{`{ score, level }`}</td>
                <td className="py-3 px-4">Submits player high score to the global platform leaderboard.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-indigo-300">GV_REQUEST_AD</td>
                <td className="py-3 px-4"><Badge variant="cyan">Game → Host</Badge></td>
                <td className="py-3 px-4 font-mono text-gray-400">{`{ adType: 'rewarded' }`}</td>
                <td className="py-3 px-4">Requests an interstitial or rewarded video ad break.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-amber-300">GV_PAUSE</td>
                <td className="py-3 px-4"><Badge variant="warning">Host → Game</Badge></td>
                <td className="py-3 px-4 font-mono text-gray-400">-</td>
                <td className="py-3 px-4">Fired when the player switches tabs or opens the platform menu.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-amber-300">GV_RESUME</td>
                <td className="py-3 px-4"><Badge variant="warning">Host → Game</Badge></td>
                <td className="py-3 px-4 font-mono text-gray-400">-</td>
                <td className="py-3 px-4">Fired when player focuses back on the game container.</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-amber-300">GV_MUTE / GV_UNMUTE</td>
                <td className="py-3 px-4"><Badge variant="warning">Host → Game</Badge></td>
                <td className="py-3 px-4 font-mono text-gray-400">-</td>
                <td className="py-3 px-4">Syncs platform global sound mute toggle with game audio bus.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Monetization & Payout Terms */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-400" />
          <span>4. Revenue Sharing & Payout Terms</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-elevated/30 border border-white/10 p-5 rounded-2xl space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">REVENUE SHARE</div>
            <div className="text-2xl font-black text-white">50% – 70%</div>
            <p className="text-xs text-gray-400">
              50% base creator revenue share, increasing up to 70% based on monthly retention tiers and referral traffic volume.
            </p>
          </div>

          <div className="bg-elevated/30 border border-white/10 p-5 rounded-2xl space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">SETTLEMENT WINDOW</div>
            <div className="text-2xl font-black text-white">Net-30 Monthly</div>
            <p className="text-xs text-gray-400">
              Monthly ad revenue is finalized on the 1st of the following month, with automatic settlement within 30 days.
            </p>
          </div>

          <div className="bg-elevated/30 border border-white/10 p-5 rounded-2xl space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">MINIMUM THRESHOLD</div>
            <div className="text-2xl font-black text-emerald-400">$50.00 USD</div>
            <p className="text-xs text-gray-400">
              Disbursements initiate automatically to Stripe Connect, PayPal, or Wire Transfer once eligible balance reaches $50.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-white">Ready to publish your first game?</h3>
          <p className="text-gray-300 text-xs sm:text-sm mt-1">
            Package your build, submit to the QA sandbox queue, and launch to players worldwide.
          </p>
        </div>
        <Link
          href="/developer/submit"
          className="flex-shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
        >
          <span>Submit Game Build</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
