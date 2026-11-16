'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { generateSocialShareLinks } from '@/lib/referrals';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  gameSlug: string;
  referralToken: string;
  thumbnailUrl?: string;
}

export default function SocialShareModal({
  isOpen,
  onClose,
  gameTitle,
  gameSlug,
  referralToken,
  thumbnailUrl,
}: SocialShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gameverse.com';
  const links = generateSocialShareLinks(gameTitle, gameSlug, referralToken, baseUrl);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(links.fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyDiscord = () => {
    navigator.clipboard.writeText(links.discordCopyText);
    setDiscordCopied(true);
    setTimeout(() => setDiscordCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">Share Game</h3>
              <p className="text-[11px] text-slate-500">Promote and invite players to play</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Game Badge Preview */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={gameTitle}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-slate-900 truncate">{gameTitle}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>+20% Creator Bonus Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Direct Opaque Referral Link */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700">Your Unique Promotion Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={links.fullUrl}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <label className="text-xs font-semibold text-slate-500">Share Directly to Community</label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Twitter / X */}
            <a
              href={links.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border border-[#1DA1F2]/25 text-xs font-bold py-2.5 px-3 rounded-xl transition-all"
            >
              <span>Twitter / X</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Reddit */}
            <a
              href={links.reddit}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#FF4500]/10 hover:bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/25 text-xs font-bold py-2.5 px-3 rounded-xl transition-all"
            >
              <span>Reddit</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* WhatsApp */}
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1e9649] border border-[#25D366]/25 text-xs font-bold py-2.5 px-3 rounded-xl transition-all"
            >
              <span>WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Discord Format */}
            <button
              onClick={handleCopyDiscord}
              className={`flex items-center justify-center gap-2 border text-xs font-bold py-2.5 px-3 rounded-xl transition-all ${
                discordCopied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#4752C4] border-[#5865F2]/25'
              }`}
            >
              <span>{discordCopied ? 'Discord Copied' : 'Discord Snippet'}</span>
              {discordCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
