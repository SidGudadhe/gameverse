'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Share2,
  Plus,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import SocialShareModal from '@/components/SocialShareModal';

export default function DeveloperReferralsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // New Campaign Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [creating, setCreating] = useState(false);

  // Share Modal State
  const [shareModalGame, setShareModalGame] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch campaigns
      const resCamp = await fetch('/api/developer/referrals');
      if (resCamp.ok) {
        const json = await resCamp.json();
        setCampaigns(json.data || []);
      }

      // 2. Fetch studio games
      const resGames = await fetch('/api/developer/games');
      if (resGames.ok) {
        const json = await resGames.json();
        setGames(json.data || []);
        if (json.data && json.data.length > 0) {
          setSelectedGameId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGameId) return;

    setCreating(true);
    try {
      const res = await fetch('/api/developer/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: selectedGameId,
          campaignName: campaignName || 'Promotion Campaign',
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setCampaignName('');
        await loadData();
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setCreating(false);
    }
  }

  const handleCopy = (token: string, slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gameverse.com';
    const url = `${origin}/game/${slug}?ref=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const totalUnique = campaigns.reduce((acc, c) => acc + (c.uniquePlayers || 0), 0);
  const totalMinutes = campaigns.reduce((acc, c) => acc + (c.totalPlayMinutes || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>70% Net Revenue Split</span>
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white mt-1.5">
            Creator Promotion & Referral Engine
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Create tracked campaigns, share directly to social communities, and earn a +20% bonus boost on referred gameplay.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-emerald-400/30 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign Link</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Referred Starts</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-heading font-black text-2xl text-white">
            {totalClicks.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">Attributed to Creator Links</div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Unique Referred Players</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-heading font-black text-2xl text-indigo-400 font-mono">
            {totalUnique.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400">First-time visitors converted</div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Referred Playtime</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-heading font-black text-2xl text-white">
            {Math.floor(totalMinutes / 60)}h {Math.round(totalMinutes % 60)}m
          </div>
          <div className="text-[11px] text-gray-400">Eligible for 70% share rate</div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Bonus Split Rate</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-heading font-black text-2xl text-emerald-400 font-mono">
            70%
          </div>
          <div className="text-[11px] text-gray-400">50% Base + 20% Referral Boost</div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-surface rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-white">Active Referral Campaigns</h2>
            <p className="text-gray-400 text-xs">Track performance across your promotional channels</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-gray-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Target Game</th>
                <th className="py-3 px-4">Referral Token</th>
                <th className="py-3 px-4">Clicks</th>
                <th className="py-3 px-4">Unique Players</th>
                <th className="py-3 px-4">Bonus Split</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No active campaigns. Click "New Campaign Link" above to create your first promotion link.
                  </td>
                </tr>
              ) : (
                campaigns.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{c.campaignName}</td>
                    <td className="py-3 px-4 font-semibold text-gray-300">{c.gameTitle}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400">{c.token}</td>
                    <td className="py-3 px-4 font-bold text-white">{c.clicks}</td>
                    <td className="py-3 px-4">{c.uniquePlayers}</td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        70% Net ({c.bonusPercent}% Bonus)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleCopy(c.token, c.gameSlug)}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                          copiedToken === c.token
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-elevated hover:bg-white/10 text-gray-200 border-white/10'
                        }`}
                      >
                        {copiedToken === c.token ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedToken === c.token ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() =>
                          setShareModalGame({
                            title: c.gameTitle,
                            slug: c.gameSlug,
                            token: c.token,
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition-all"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Social Share</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl p-6 space-y-6">
            <h3 className="font-heading font-bold text-lg text-white">Create New Referral Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Target Game</label>
                <select
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  className="w-full bg-surface border border-white/10 text-white text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                  required
                >
                  {games.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Campaign Channel Name</label>
                <input
                  type="text"
                  placeholder="e.g. YouTube Video Drop, Discord Announcement, Twitter Post"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-surface border border-white/10 text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>Automatically applies +20% Creator Promotion Bonus (70% Net Revenue Split).</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
                >
                  {creating ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Social Share Modal Popup */}
      {shareModalGame && (
        <SocialShareModal
          isOpen={!!shareModalGame}
          onClose={() => setShareModalGame(null)}
          gameTitle={shareModalGame.title}
          gameSlug={shareModalGame.slug}
          referralToken={shareModalGame.token}
        />
      )}
    </div>
  );
}
