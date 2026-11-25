'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  Upload,
  Sparkles,
  IndianRupee,
  Star,
  Copy,
  Check,
  ExternalLink,
  BarChart3,
  TrendingUp,
  AlertCircle,
  FileCode,
  Shield,
  History,
  RotateCcw,
  Sliders,
  X,
  Layers,
  AlertTriangle,
  UploadCloud,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import DeveloperLogo from '@/components/ui/DeveloperLogo';
import WebAdBanner from '@/components/ads/WebAdBanner';

export default function MyGamesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAvgBreakdown, setShowAvgBreakdown] = useState(true);

  // ================= MODAL STATE (IN-PAGE WORKFLOWS) =================
  // 1. Game Versions & Rollback Modal
  const [versionsModalGame, setVersionsModalGame] = useState<any | null>(null);
  const [versionsList, setVersionsList] = useState<any[]>([]);
  const [rollbackHistory, setRollbackHistory] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<any | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollbackSubmitting, setRollbackSubmitting] = useState(false);
  const [rollbackFeedback, setRollbackFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2. Update Build Modal
  const [updateModalGame, setUpdateModalGame] = useState<any | null>(null);
  const [updateVersionNum, setUpdateVersionNum] = useState('');
  const [updateChangelog, setUpdateChangelog] = useState('');
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [updateUploading, setUpdateUploading] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStage, setUpdateStage] = useState<'IDLE' | 'SESSION' | 'UPLOADING' | 'SCANNING' | 'COMPLETE' | 'FAILED'>('IDLE');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateScanResult, setUpdateScanResult] = useState<any | null>(null);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);

  // 3. Settings Modal
  const [settingsModalGame, setSettingsModalGame] = useState<any | null>(null);
  const [settingsTitle, setSettingsTitle] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsControls, setSettingsControls] = useState('');
  const [settingsOrientation, setSettingsOrientation] = useState('LANDSCAPE');
  const [settingsMainCategory, setSettingsMainCategory] = useState<'VEG' | 'NON_VEG'>('VEG');
  const [settingsPlayerMode, setSettingsPlayerMode] = useState<'SINGLEPLAYER' | 'MULTIPLAYER' | 'BOTH'>('SINGLEPLAYER');
  const [settingsVideoUrl, setSettingsVideoUrl] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadGames = () => {
    fetch('/api/developer/games')
      .then((res) => res.json())
      .then((data) => {
        setGames(data.games || data.data || []);
      })
      .catch((err) => {
        console.error('Failed to load studio games:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadGames();
  }, []);

  const handleCopyLink = (game: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const fullUrl = `${origin}/sandbox/${game.id}/${game.currentVersionId || 'v1'}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(game.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === game.id ? null : prev));
    }, 2000);
  };

  // ================= VERSIONS & ROLLBACK HANDLERS =================
  const openVersionsModal = async (game: any) => {
    setVersionsModalGame(game);
    setLoadingVersions(true);
    setRollbackTarget(null);
    setRollbackFeedback(null);
    try {
      const res = await fetch(`/api/developer/games/${game.id}/versions`);
      const data = await res.json();
      if (res.ok) {
        setVersionsList(data.versions || []);
        setRollbackHistory(data.rollbacks || []);
      }
    } catch (err) {
      console.error('Error fetching versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleExecuteRollback = async () => {
    if (!versionsModalGame || !rollbackTarget || !rollbackReason.trim()) return;
    setRollbackSubmitting(true);
    setRollbackFeedback(null);

    try {
      const res = await fetch(`/api/developer/games/${versionsModalGame.id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetVersionId: rollbackTarget.id,
          reason: rollbackReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRollbackFeedback({ type: 'error', text: data.error || 'Rollback failed.' });
      } else {
        setRollbackFeedback({
          type: 'success',
          text: `Successfully rolled back to version ${rollbackTarget.versionNumber}! All users now receive this stable build.`,
        });
        setRollbackTarget(null);
        setRollbackReason('');
        // Refresh versions and games list
        openVersionsModal(versionsModalGame);
        loadGames();
      }
    } catch (err: any) {
      setRollbackFeedback({ type: 'error', text: `Rollback network error: ${err.message}` });
    } finally {
      setRollbackSubmitting(false);
    }
  };

  const handlePublishApprovedVersion = async (ver: any) => {
    if (!versionsModalGame || !ver) return;
    setRollbackSubmitting(true);
    setRollbackFeedback(null);
    try {
      const res = await fetch(`/api/developer/games/${versionsModalGame.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: ver.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRollbackFeedback({ type: 'error', text: data.error || 'Failed to publish version.' });
      } else {
        setRollbackFeedback({
          type: 'success',
          text: `Version ${ver.versionNumber} is now live on GameVerse!`,
        });
        openVersionsModal(versionsModalGame);
        loadGames();
      }
    } catch (err: any) {
      setRollbackFeedback({ type: 'error', text: `Publish error: ${err.message}` });
    } finally {
      setRollbackSubmitting(false);
    }
  };

  // ================= UPDATE BUILD HANDLERS =================
  const openUpdateModal = (game: any) => {
    setUpdateModalGame(game);
    const existingVer = game.versionNumber || '1.0.0';
    const parts = existingVer.split('.');
    let nextMinor = '1.1.0';
    if (parts.length === 3 && !isNaN(Number(parts[1]))) {
      nextMinor = `${parts[0]}.${Number(parts[1]) + 1}.0`;
    }
    setUpdateVersionNum(nextMinor);
    setUpdateChangelog('Optimized game asset loading, bug fixes, and stability improvements.');
    setUpdateFile(null);
    setUpdateUploading(false);
    setUpdateProgress(0);
    setUpdateStage('IDLE');
    setUpdateError(null);
    setUpdateScanResult(null);
    setUpdateSuccessMsg(null);
  };

  const handleUpdateFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected || !updateModalGame) return;

    setUpdateFile(selected);
    setUpdateUploading(true);
    setUpdateError(null);
    setUpdateScanResult(null);
    setUpdateProgress(0);
    setUpdateStage('SESSION');

    try {
      // Step 1: Create Presigned Session
      const sessionRes = await fetch('/api/developer/upload/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: updateModalGame.id,
          fileName: selected.name,
          fileSizeBytes: selected.size,
          versionNumber: updateVersionNum,
        }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        throw new Error(sessionData.error || 'Failed to initialize upload session.');
      }

      setUpdateStage('UPLOADING');

      // Step 2: Upload to Cloud Storage
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', sessionData.uploadUrl);

        if (sessionData.headers) {
          Object.entries(sessionData.headers).forEach(([k, v]) => {
            xhr.setRequestHeader(k, v as string);
          });
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUpdateProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Storage rejected upload with status ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error('Network error during upload to cloud storage.'));
        xhr.send(selected);
      });

      setUpdateProgress(100);
      setUpdateStage('SCANNING');

      // Step 3: Deep Security Verification
      const processRes = await fetch('/api/developer/upload/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.session.id,
          gameId: updateModalGame.id,
          versionNumber: updateVersionNum,
          entryPoint: 'index.html',
        }),
      });

      const processData = await processRes.json();
      if (!processRes.ok) {
        setUpdateStage('FAILED');
        setUpdateError(processData.error || 'Security verification rejected archive.');
        if (processData.scanResult) setUpdateScanResult(processData.scanResult);
      } else {
        setUpdateStage('COMPLETE');
        setUpdateScanResult(processData.scanResult);

        // Step 4: Register new Version in catalog
        const verRes = await fetch(`/api/developer/games/${updateModalGame.id}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            versionNumber: updateVersionNum,
            changelog: updateChangelog,
            entryPoint: 'index.html',
            uploadSessionId: sessionData.session.id,
          }),
        });

        const verData = await verRes.json();
        if (!verRes.ok) {
          setUpdateError(verData.error || 'Failed to register version in catalog.');
        } else {
          setUpdateSuccessMsg(`Version ${updateVersionNum} successfully processed, manifest registered, and submitted for QA review!`);
          loadGames();
        }
      }
    } catch (err: any) {
      setUpdateStage('FAILED');
      setUpdateError(`Upload workflow error: ${err.message}`);
    } finally {
      setUpdateUploading(false);
    }
  };

  // ================= SETTINGS HANDLERS =================
  const openSettingsModal = (game: any) => {
    setSettingsModalGame(game);
    setSettingsTitle(game.title || '');
    setSettingsDesc(game.shortDescription || '');
    setSettingsControls(game.controlsGuide || 'Keyboard & Mouse');
    setSettingsOrientation(game.orientation || 'LANDSCAPE');
    setSettingsMainCategory(game.mainCategory || 'VEG');
    setSettingsPlayerMode(game.playerMode || 'SINGLEPLAYER');
    setSettingsVideoUrl(game.gameplayVideoUrl || game.previewVideoUrl || '');
    setSettingsFeedback(null);
  };

  const handleSaveSettings = async () => {
    if (!settingsModalGame || !settingsTitle.trim()) return;
    setSettingsSaving(true);
    setSettingsFeedback(null);

    try {
      const res = await fetch(`/api/developer/games/${settingsModalGame.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: settingsTitle.trim(),
          shortDescription: settingsDesc.trim(),
          controlsGuide: settingsControls.trim(),
          orientation: settingsOrientation,
          mainCategory: settingsMainCategory,
          playerMode: settingsPlayerMode,
          gameplayVideoUrl: settingsVideoUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSettingsFeedback({ type: 'error', text: data.error || 'Failed to update settings.' });
      } else {
        setSettingsFeedback({ type: 'success', text: 'Game settings updated successfully.' });
        loadGames();
      }
    } catch (err: any) {
      setSettingsFeedback({ type: 'error', text: `Settings save error: ${err.message}` });
    } finally {
      setSettingsSaving(false);
    }
  };

  const filteredGames = games.filter((g) => {
    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
    const matchesQuery =
      searchQuery.trim() === '' ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.engine?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const totalCatalogEarnings = games.reduce((acc, g) => acc + (g.earnings || 0), 0);
  const averageRevenueOfGame =
    games.length > 0 ? Math.round((totalCatalogEarnings / games.length) * 100) / 100 : 0;
  const totalCatalogPlaytime = games.reduce((acc, g) => acc + (g.playtimeHours || 0), 0);
  const totalPlays = games.reduce((acc, g) => acc + (g.totalPlays || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <DeveloperLogo size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-600" />
              <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider">
                Studio Games Catalog & Delivery
              </span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
              My Studio Games & Versions
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
              Cloudflare R2 storage, edge CDN delivery, live version management, and instant rollback controls.
            </p>
          </div>
        </div>

        <Link
          href="/developer/submit"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Game</span>
        </Link>
      </div>

      {/* Catalog Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Games
          </span>
          <div className="font-heading font-black text-2xl text-slate-900">
            {games.length}
          </div>
          <span className="text-[10px] text-slate-400">Published & In Review</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Playtime
          </span>
          <div className="font-heading font-black text-2xl text-cyan-600">
            {Math.round(totalCatalogPlaytime * 10) / 10} <span className="text-sm text-slate-400 font-normal">hrs</span>
          </div>
          <span className="text-[10px] text-slate-400">Verified session duration</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Plays
          </span>
          <div className="font-heading font-black text-2xl text-indigo-600">
            {totalPlays.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Edge CDN cached streams</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Average Revenue of a Game
            </span>
            {games.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAvgBreakdown((prev) => !prev)}
                className="text-[10px] font-semibold text-emerald-700 hover:underline cursor-pointer shrink-0"
              >
                {showAvgBreakdown ? 'Hide' : 'Breakdown'}
              </button>
            )}
          </div>
          <div className="font-heading font-black text-2xl text-emerald-600 font-mono">
            ₹{averageRevenueOfGame.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 block">
            Avg. in-game ad earning across {games.length} {games.length === 1 ? 'game' : 'games'}
          </span>
        </div>
      </div>

      {/* Average Revenue of a Game — Per-Game Player Earnings Section */}
      {showAvgBreakdown && games.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <h2 className="font-heading font-bold text-sm text-slate-900">
                Average Revenue of a Game — Per-Game Player Earnings
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              ₹{totalCatalogEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total in-game ads ÷ {games.length} {games.length === 1 ? 'game' : 'games'} ={' '}
              <strong className="text-emerald-700">
                ₹{averageRevenueOfGame.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} avg
              </strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-2.5">Game Title</th>
                  <th className="px-5 py-2.5 text-right">Player Plays</th>
                  <th className="px-5 py-2.5 text-right">Avg / Play (In-Game Ads)</th>
                  <th className="px-5 py-2.5 text-right">Game In-Game Ad Revenue</th>
                  <th className="px-5 py-2.5 text-right">Vs. Studio Game Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {games.map((g) => {
                  const gEarnings = Number(g.earnings || 0);
                  const gPlays = Number(g.totalPlays || 0);
                  const perPlayAvg =
                    g.avgEarningPerPlay !== undefined
                      ? Number(g.avgEarningPerPlay)
                      : gPlays > 0
                      ? gEarnings / gPlays
                      : 0;
                  const diffPct =
                    averageRevenueOfGame > 0
                      ? Math.round(((gEarnings - averageRevenueOfGame) / averageRevenueOfGame) * 100)
                      : 0;

                  return (
                    <tr key={`avg-row-${g.id}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-2.5 font-semibold text-slate-900">
                        {g.title}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-slate-600">
                        {gPlays.toLocaleString()}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-slate-600">
                        ₹{perPlayAvg.toFixed(3)} / play
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono font-bold text-emerald-700">
                        ₹{gEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-[11px]">
                        {averageRevenueOfGame === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : diffPct >= 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            +{diffPct}% vs avg
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                            {diffPct}% vs avg
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Developer Portal Sponsored Hardware & Tools Display Banner */}
      <div className="w-full">
        <WebAdBanner placement="CATEGORY_BANNER" />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { key: 'ALL', label: 'All Titles' },
            { key: 'PUBLISHED', label: 'Live' },
            { key: 'QA_TESTING', label: 'Under Review' },
            { key: 'DRAFT', label: 'Drafts' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === s.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by game title, category, engine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Games Detailed Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGames.map((game) => {
            const hasCopied = copiedId === game.id;
            const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const gameDirectUrl = `${origin}/sandbox/${game.id}/${game.currentVersionId || 'v1'}`;

            return (
              <div
                key={game.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-indigo-300 transition-all shadow-xs group"
              >
                <div>
                  {/* Top Thumbnail Header */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={game.thumbnailUrl}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-xs ${
                          game.status === 'PUBLISHED'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : game.status === 'QA_TESTING'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-slate-800 text-white border-slate-700'
                        }`}
                      >
                        {game.status === 'PUBLISHED' ? 'Live on CDN' : game.status}
                      </span>

                      {game.currentVersionId && (
                        <span className="bg-slate-900/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {game.currentVersionId.replace(/^ver-[^-]+-/, 'v').replace(/_/g, '.')}
                        </span>
                      )}
                    </div>

                    {/* Category Pill */}
                    <div className="absolute top-3 right-3">
                      <span className="bg-white text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                        {game.categoryName}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
                        <span>Engine: <strong className="text-slate-700 font-semibold">{game.engine}</strong></span>
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          {game.developedBy || 'Human Developed'}
                        </span>
                      </div>
                      <h2 className="font-heading font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {game.title}
                      </h2>
                      <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {game.shortDescription}
                      </p>
                    </div>

                    {/* Separate Metric Grid for this Game */}
                    <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Playtime
                        </span>
                        <div className="font-heading font-bold text-base text-cyan-700 flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{game.playtimeHours ?? 12.4}h</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {game.totalPlayMinutes ?? 744}m total
                        </span>
                      </div>

                      <div className="space-y-0.5 border-x border-slate-200 px-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          In-Game Ad Revenue
                        </span>
                        <div className="font-heading font-bold text-base text-emerald-600 font-mono">
                          ₹{Number(game.earnings ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium block font-mono">
                          Avg ₹{(game.avgEarningPerPlay ?? (game.totalPlays > 0 ? Number(game.earnings || 0) / game.totalPlays : 0)).toFixed(3)}/play
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Performance
                        </span>
                        <div className="font-heading font-bold text-base text-amber-600 flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{(game.rating || 4.8).toFixed(1)}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {(game.totalPlays || 0).toLocaleString()} plays
                        </span>
                      </div>
                    </div>

                    {/* Direct Playable Link */}
                    <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                          Direct Sandbox Test URL:
                        </span>
                        <a
                          href={`/sandbox/${game.id}/${game.currentVersionId || 'v1'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-indigo-600 hover:text-indigo-800 underline truncate block text-[11px]"
                          title="Open directly in developer sandbox"
                        >
                          {gameDirectUrl}
                        </a>
                      </div>

                      <button
                        onClick={() => handleCopyLink(game)}
                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs transition-colors cursor-pointer"
                        title="Copy direct playable link to clipboard"
                      >
                        {hasCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer with Real Version Management & Update Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openVersionsModal(game)}
                      className="text-slate-700 hover:text-indigo-600 font-semibold flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                      title="Inspect version history, manifests, and rollback"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Versions & Rollback</span>
                    </button>

                    <button
                      onClick={() => openSettingsModal(game)}
                      className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                      title="Configure game metadata and settings"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Settings</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/sandbox/${game.id}/${game.currentVersionId || 'v1'}`}
                      target="_blank"
                      className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1 font-semibold"
                      title="Test build inside isolated developer sandbox runner"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Sandbox Preview</span>
                    </Link>

                    <Link
                      href={`/developer/submit?edit=${game.id}`}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 font-semibold"
                      title="Open full game form to change/update info, media preview, or resubmit to Admin (works even while live)"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Change / Update Info</span>
                    </Link>

                    <button
                      onClick={() => openUpdateModal(game)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 font-semibold cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Update Build</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Gamepad2}
          title="No Games Found"
          description="No games match your selected status filter or search query."
          actionLabel="Clear Filter"
          onAction={() => {
            setStatusFilter('ALL');
            setSearchQuery('');
          }}
        />
      )}

      {/* ================= 1. VERSIONS & ROLLBACK MODAL ================= */}
      {versionsModalGame && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md uppercase">
                    Version Management & Rollback
                  </span>
                </div>
                <h3 className="font-heading font-black text-xl text-slate-900 mt-1">
                  {versionsModalGame.title} — Builds History
                </h3>
                <p className="text-slate-500 text-xs">
                  Every uploaded build is preserved immutably. Roll back to any prior version instantly.
                </p>
              </div>

              <button
                onClick={() => setVersionsModalGame(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rollbackFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2 ${
                  rollbackFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {rollbackFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{rollbackFeedback.text}</span>
              </div>
            )}

            {/* Versions List */}
            {loadingVersions ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Loading version builds...</span>
              </div>
            ) : versionsList.length > 0 ? (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Available Builds:</span>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {versionsList.map((ver) => {
                    const isCurrent = ver.isCurrent;

                    return (
                      <div
                        key={ver.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isCurrent
                            ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-slate-900">
                              v{ver.versionNumber}
                            </span>
                            {isCurrent && (
                              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Currently Live on CDN
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(ver.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-slate-600 text-xs truncate max-w-md">
                            {ver.changelog || 'No release notes.'}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                            <span>Status: <strong className="text-slate-800">{ver.status}</strong></span>
                            {ver.archiveChecksum && (
                              <span className="truncate max-w-[120px]" title={ver.archiveChecksum}>
                                SHA: {ver.archiveChecksum.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCurrent ? (
                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Active</span>
                            </span>
                          ) : ver.status === 'APPROVED' ? (
                            <button
                              onClick={() => handlePublishApprovedVersion(ver)}
                              disabled={rollbackSubmitting}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Publish Approved</span>
                            </button>
                          ) : ver.status === 'PUBLISHED' ? (
                            <button
                              onClick={() => {
                                setRollbackTarget(ver);
                                setRollbackReason(`Rollback to v${ver.versionNumber} for gameplay stability.`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Rollback to this</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                              {ver.status === 'QUARANTINED'
                                ? 'Quarantined'
                                : ver.status === 'REJECTED'
                                ? 'Rejected'
                                : 'Awaiting QA'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">No version history records found.</p>
            )}

            {/* Inline Rollback Confirmation Dialog */}
            {rollbackTarget && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Confirm Rollback to Version {rollbackTarget.versionNumber}</span>
                </div>
                <p className="text-xs text-amber-800">
                  This action will atomically switch the live CDN player pointer to <strong>v{rollbackTarget.versionNumber}</strong>. Existing player sessions will complete safely and all new players will instantly receive this restored version.
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                    Audit Rollback Reason (Mandatory):
                  </label>
                  <input
                    type="text"
                    value={rollbackReason}
                    onChange={(e) => setRollbackReason(e.target.value)}
                    placeholder="e.g. Critical regression on mobile WebGL controls, restoring stable v1.0.0"
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setRollbackTarget(null)}
                    disabled={rollbackSubmitting}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-amber-100/50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteRollback}
                    disabled={rollbackSubmitting || !rollbackReason.trim()}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {rollbackSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Switching Pointer...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Confirm & Roll Back Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Rollback Audit Trail */}
            {rollbackHistory.length > 0 && (
              <div className="space-y-2 border-t border-slate-200 pt-4 text-xs">
                <span className="font-bold text-slate-700 block">Past Rollback Audit Log:</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px] text-slate-600">
                  {rollbackHistory.map((r) => (
                    <div key={r.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <span>Restored to <strong>{r.toVersionId}</strong>: &quot;{r.reason}&quot;</span>
                      <span className="text-slate-400 text-[10px]">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 2. UPDATE BUILD MODAL ================= */}
      {updateModalGame && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md uppercase">
                  Deploy Update
                </span>
                <h3 className="font-heading font-black text-xl text-slate-900 mt-1">
                  Upload Update Build — {updateModalGame.title}
                </h3>
                <p className="text-slate-500 text-xs">
                  Upload a new HTML5 ZIP package to create a new version without deleting the previous version.
                </p>
              </div>

              <button
                onClick={() => setUpdateModalGame(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {updateSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{updateSuccessMsg}</span>
              </div>
            )}

            {updateError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Build Update Failed</p>
                  <p>{updateError}</p>
                </div>
              </div>
            )}

            {!updateSuccessMsg && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New SemVer Version:
                    </label>
                    <input
                      type="text"
                      value={updateVersionNum}
                      onChange={(e) => setUpdateVersionNum(e.target.value)}
                      placeholder="e.g. 1.1.0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Current Live Version:
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono">
                      {updateModalGame.currentVersionId ? updateModalGame.currentVersionId.replace(/^ver-[^-]+-/, 'v').replace(/_/g, '.') : 'v1.0.0'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Release Notes / Changelog:
                  </label>
                  <textarea
                    rows={2}
                    value={updateChangelog}
                    onChange={(e) => setUpdateChangelog(e.target.value)}
                    placeholder="Describe changes in this update..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Upload Zone */}
                <div>
                  <label className="block border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100/60">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleUpdateFileSelect}
                      className="hidden"
                      disabled={updateUploading}
                    />
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 mx-auto flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-900">
                        {updateUploading
                          ? `Uploading & Scanning (${updateProgress}%)...`
                          : updateFile
                          ? updateFile.name
                          : 'Select new HTML5 game .zip file'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Direct multipart transfer to Cloudflare R2 object storage with deep ZIP verification.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Upload Progress Bar */}
                {updateUploading && (
                  <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span className="text-indigo-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping inline-block" />
                        {updateStage === 'UPLOADING' ? 'Streaming directly to cloud storage...' : 'Verifying build manifest & security...'}
                      </span>
                      <span>{updateProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${updateProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 3. SETTINGS MODAL ================= */}
      {settingsModalGame && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Game Settings
                </span>
                <h3 className="font-heading font-black text-xl text-slate-900 mt-1">
                  {settingsModalGame.title}
                </h3>
              </div>

              <button
                onClick={() => setSettingsModalGame(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {settingsFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  settingsFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {settingsFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{settingsFeedback.text}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title:</label>
                <input
                  type="text"
                  value={settingsTitle}
                  onChange={(e) => setSettingsTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description:</label>
                <textarea
                  rows={2}
                  value={settingsDesc}
                  onChange={(e) => setSettingsDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Main Category:</label>
                  <select
                    value={settingsMainCategory}
                    onChange={(e) => setSettingsMainCategory(e.target.value as 'VEG' | 'NON_VEG')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="VEG">🟢 Veg (All Ages / Family)</option>
                    <option value="NON_VEG">🔴 Non-Veg (Intense / 16+)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Orientation:</label>
                  <select
                    value={settingsOrientation}
                    onChange={(e) => setSettingsOrientation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LANDSCAPE">Landscape</option>
                    <option value="PORTRAIT">Portrait</option>
                    <option value="ANY">Any / Responsive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Player Mode:</label>
                  <select
                    value={settingsPlayerMode}
                    onChange={(e) => setSettingsPlayerMode(e.target.value as 'SINGLEPLAYER' | 'MULTIPLAYER' | 'BOTH')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SINGLEPLAYER">Singleplayer Only</option>
                    <option value="MULTIPLAYER">Multiplayer Only</option>
                    <option value="BOTH">Singleplayer + Multiplayer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">30–50s Gameplay Video URL:</label>
                  <input
                    type="text"
                    value={settingsVideoUrl}
                    onChange={(e) => setSettingsVideoUrl(e.target.value)}
                    placeholder="/videos/preview-gameplay.mp4"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Controls Guide:</label>
                <input
                  type="text"
                  value={settingsControls}
                  onChange={(e) => setSettingsControls(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setSettingsModalGame(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {settingsSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
