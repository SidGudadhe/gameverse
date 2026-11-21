'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  ExternalLink,
  SkipForward,
  Award,
  ShieldCheck,
  CheckCircle2,
  Play,
  Heart,
  Coins,
  Sparkles,
  Layers,
  Tag,
} from 'lucide-react';
import { MockAdCreative } from '../lib/ads';
import { AdFormat } from '../types';

interface AdOverlayProps {
  ad: MockAdCreative;
  format: AdFormat;
  onAdComplete: (durationSeconds: number, skipped: boolean, rewardClaimed?: string) => void;
  onAdClicked?: () => void;
}

export default function AdOverlay({
  ad,
  format,
  onAdComplete,
  onAdClicked,
}: AdOverlayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const [selectedReward, setSelectedReward] = useState<'EXTRA_LIFE' | 'COINS' | 'DOUBLE_REWARD'>(
    format === 'BONUS_REWARD' ? 'DOUBLE_REWARD' : 'EXTRA_LIFE'
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = ad.durationSeconds || (format === 'REWARDED' || format === 'BONUS_REWARD' ? 15 : 10);
  const isUnskippable = Boolean(ad.isUnskippable || format === 'REWARDED' || format === 'BONUS_REWARD');
  // If skippable, skip unlocks after ad.skipOffsetSeconds (10 seconds for midgame/restart)
  const skipOffset = isUnskippable ? 0 : ad.skipOffsetSeconds || 10;
  const canSkip = !isUnskippable && elapsedSeconds >= skipOffset;
  const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);
  const skipCountdown = Math.max(0, skipOffset - elapsedSeconds);

  // Pre-roll 4-Step calculation
  const isPreroll = format === 'PREROLL';
  const prerollStep =
    elapsedSeconds < 2 ? 1 : elapsedSeconds < totalDuration - 1 ? 2 : elapsedSeconds < totalDuration ? 3 : 4;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalDuration) {
          if (timerRef.current) clearInterval(timerRef.current);
          onAdComplete(totalDuration, false, selectedReward);
          return totalDuration;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalDuration, onAdComplete, selectedReward]);

  const handleSkip = () => {
    if (!canSkip) return;
    if (timerRef.current) clearInterval(timerRef.current);
    onAdComplete(elapsedSeconds, true);
  };

  const handleCtaClick = () => {
    setHasClicked(true);
    onAdClicked?.();
    window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
  };

  const progressPercent = Math.min(100, (elapsedSeconds / totalDuration) * 100);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between bg-[#080B14]/95 backdrop-blur-md overflow-hidden animate-fade-in select-none text-white">
      {/* ================= IDENTIFIABLE AD TEXT HEADER BAR ================= */}
      <div className="bg-amber-500 text-slate-950 font-mono font-black text-[11px] sm:text-xs tracking-wider uppercase px-4 py-1.5 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-2 truncate">
          <Tag className="w-3.5 h-3.5 text-slate-950 shrink-0" />
          <span className="truncate">
            {ad.placementText || `[ IN-GAME AD: ${format} • Video Advertisement Placement ]`}
          </span>
        </div>
        <span className="text-[10px] bg-slate-900 text-amber-300 font-bold px-2 py-0.5 rounded shrink-0">
          {isUnskippable ? 'UNSKIPPABLE' : `SKIPPABLE AFTER ${skipOffset}s`}
        </span>
      </div>

      {/* Top Banner Control Bar */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-5 bg-gradient-to-b from-black/80 to-transparent">
        {/* Left: Ad attribution badge & status */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 backdrop-blur-md text-[11px] font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-amber-300">In-Game Video Ad</span>
            <span className="text-slate-500">•</span>
            <span>GameVerse Network</span>
          </div>

          {(format === 'REWARDED' || format === 'BONUS_REWARD') && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-semibold text-amber-300">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{ad.rewardLabel || 'Watch in full to claim bonus rewards'}</span>
            </div>
          )}
        </div>

        {/* Right: Audio mute & Skip / Countdown Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="w-8 h-8 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/60 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Skip / Countdown Button */}
          {isUnskippable ? (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                {format === 'REWARDED' || format === 'BONUS_REWARD' ? 'Reward in' : 'Ad finishes in'}{' '}
                <span className="font-bold text-amber-400">{remainingSeconds}s</span>
              </span>
            </div>
          ) : canSkip ? (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500 hover:from-amber-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer animate-pulse border border-white/20"
            >
              <span>Skip Ad</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-mono">
              Skip in <span className="font-bold text-slate-200">{skipCountdown}s</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= PRE-ROLL 4-STEP SEQUENCE INDICATOR (User Explicit Requirement) ================= */}
      {isPreroll && (
        <div className="relative z-10 max-w-2xl mx-auto w-full px-4 mb-2">
          <div className="bg-slate-900/90 border border-amber-400/60 rounded-2xl p-3 shadow-lg">
            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Pre-roll Ad 4-Step Sequence:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium">
              {/* Step 1 */}
              <div
                className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all ${
                  prerollStep >= 1
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">1. Game Load</span>
              </div>

              {/* Step 2 */}
              <div
                className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all ${
                  prerollStep === 2
                    ? 'bg-amber-950/80 border-amber-400 text-amber-300 font-bold shadow-xs animate-pulse'
                    : prerollStep > 2
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                }`}
              >
                <Play className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">2. Video Ad</span>
              </div>

              {/* Step 3 */}
              <div
                className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all ${
                  prerollStep === 3
                    ? 'bg-amber-950/80 border-amber-400 text-amber-300 font-bold shadow-xs animate-pulse'
                    : prerollStep > 3
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">3. Ad Complete</span>
              </div>

              {/* Step 4 */}
              <div
                className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all ${
                  prerollStep >= 4
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 font-bold shadow-xs'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
                }`}
              >
                <Play className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">4. Game Start</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= REWARDED AD BENEFIT BANNER (User Explicit Rule: Next Life / Continue Here with 3s Shield) ================= */}
      {format === 'REWARDED' && (
        <div className="relative z-10 max-w-xl mx-auto w-full px-4 mb-2">
          <div className="bg-slate-900/90 border border-rose-500/60 rounded-2xl p-3 text-center shadow-lg">
            <span className="text-[10px] font-mono text-rose-300 font-bold uppercase tracking-wider block mb-1">
              Active Reward Benefit:
            </span>
            <div className="inline-flex items-center gap-2 bg-rose-950/80 border border-rose-500/50 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-200">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-500" />
              <span>Next Life: Continue game from current position (Includes 3-Second Shield • 1 per game)</span>
            </div>
          </div>
        </div>
      )}
      {format === 'BONUS_REWARD' && (
        <div className="relative z-10 max-w-xl mx-auto w-full px-4 mb-2">
          <div className="bg-slate-900/90 border border-indigo-500/60 rounded-2xl p-3 text-center shadow-lg">
            <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider block mb-1">
              Active Reward Benefit:
            </span>
            <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/50 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>2x Bonus Multiplier Claimed</span>
            </div>
          </div>
        </div>
      )}

      {/* Center Simulated Ad Media Presentation */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
        {/* Creative Artwork Container */}
        <div className="relative w-full max-w-sm aspect-video rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl mb-4 group">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-left">
            <div>
              <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                {ad.sponsorName}
              </p>
              <p className="text-sm font-bold text-white leading-tight drop-shadow">
                {ad.title}
              </p>
            </div>
          </div>
        </div>

        {/* Sponsor Copy */}
        <h3 className="text-lg sm:text-xl font-heading font-bold text-white mb-2 leading-snug">
          {ad.headline}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 max-w-md mb-4">
          {ad.description}
        </p>

        {/* CTA Button */}
        <button
          onClick={handleCtaClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-xl hover:shadow-cyan-500/20 active:scale-95 cursor-pointer"
        >
          <span>{ad.ctaText}</span>
          <ExternalLink className="w-4 h-4 text-slate-700" />
        </button>

        {hasClicked && (
          <p className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sponsor link opened in safe background tab</span>
          </p>
        )}
      </div>

      {/* Bottom Progress Bar & Telemetry Footer */}
      <div className="relative z-10 w-full bg-slate-950/90 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-mono text-amber-300 font-bold">
            {format} VIDEO AD &bull; {elapsedSeconds}s / {totalDuration}s
          </span>
        </div>

        {/* Animated Progress Track */}
        <div className="w-32 sm:w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-4">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-indigo-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <span className="hidden sm:inline text-slate-400 font-mono text-[10px]">
          GameVerse Ads SDK v2.0 • Double-Entry Ledger Integrated
        </span>
      </div>
    </div>
  );
}
