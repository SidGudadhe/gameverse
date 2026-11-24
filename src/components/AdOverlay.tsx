'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  ExternalLink,
  SkipForward,
  Info,
  CheckCircle2,
  Shield,
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
  const [showAdChoicesInfo, setShowAdChoicesInfo] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const totalDuration = ad.durationSeconds || (format === 'REWARDED' || format === 'BONUS_REWARD' ? 15 : 10);
  const isUnskippable = Boolean(ad.isUnskippable || format === 'REWARDED' || format === 'BONUS_REWARD');
  const skipOffset = isUnskippable ? 0 : ad.skipOffsetSeconds || 10;
  const canSkip = !isUnskippable && elapsedSeconds >= skipOffset;
  const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);
  const skipCountdown = Math.max(0, skipOffset - elapsedSeconds);

  // Play subtle high-quality ambient commercial tone when unmuted
  useEffect(() => {
    if (!isMuted && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.015, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.2);
          oscRef.current = osc;
        }
      } catch {
        // AudioContext autoplay restrictions are handled gracefully
      }
    }
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [isMuted]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalDuration) {
          if (timerRef.current) clearInterval(timerRef.current);
          onAdComplete(totalDuration, false, ad.rewardType || 'EXTRA_LIFE');
          return totalDuration;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalDuration, onAdComplete, ad.rewardType]);

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
  const domainText = ad.domain || (ad.ctaUrl ? ad.ctaUrl.replace(/^https?:\/\//, '').split('/')[0] : 'advertiser.com');

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between bg-black overflow-hidden select-none text-white animate-fade-in font-sans">
      {/* ================= CINEMATIC VIDEO / MEDIA BACKGROUND ================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Full-bleed commercial poster with subtle Ken Burns zoom */}
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="w-full h-full object-cover opacity-60 scale-105 animate-[pulse_6s_ease-in-out_infinite] transition-transform duration-1000"
        />
        {/* Cinematic gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
      </div>

      {/* ================= GOOGLE IMA / COMPLIANT STANDARD TOP BAR ================= */}
      <div className="relative z-20 flex items-center justify-between p-3.5 sm:p-4">
        {/* Left: Google IMA Ad Tag & Countdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 shadow-lg">
            <span className="bg-[#FFCC00] text-black text-[10px] font-black px-1.5 py-0.2 rounded font-sans tracking-wide">
              Ad
            </span>
            <span className="text-white/90 text-xs font-medium">1 of 1</span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-white/80 font-mono text-xs font-semibold">
              0:{remainingSeconds.toString().padStart(2, '0')}
            </span>
          </div>

          {ad.badge && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] text-white/80 font-medium">
              <Shield className="w-3 h-3 text-[#FFCC00]" />
              {ad.badge}
            </span>
          )}
        </div>

        {/* Right: Audio Mute & Google AdChoices Badge */}
        <div className="flex items-center gap-2">
          {/* Mute / Unmute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
            className="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-md"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>

          {/* AdChoices Badge */}
          <div className="relative">
            <button
              onClick={() => setShowAdChoicesInfo(!showAdChoicesInfo)}
              title="AdChoices • Google IMA Advertising Standard"
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 hover:bg-black/90 text-[10px] text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-md"
            >
              <svg className="w-3 h-3 text-cyan-400 fill-cyan-400" viewBox="0 0 16 16">
                <polygon points="2,2 14,8 2,14" />
              </svg>
              <span className="font-sans font-semibold tracking-wide">AdChoices</span>
            </button>

            {/* AdChoices Info Tooltip */}
            {showAdChoicesInfo && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-left shadow-2xl z-50 text-xs text-slate-300">
                <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  Ads by GameVerse Network
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Programmatic ad verified via standard Google IMA & IAB policies. Safe, privacy-friendly, and non-intrusive.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= CENTER COMMERCIAL SHOWCASE ================= */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
        {/* Subtle Brand Watermark Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-3 text-xs text-white/90">
          <span className="w-2 h-2 rounded-full bg-[#FFCC00] animate-pulse" />
          <span className="font-bold text-white">{ad.sponsorName}</span>
          <span className="text-white/40">•</span>
          <span className="text-white/70 font-mono text-[11px]">{domainText}</span>
        </div>

        {/* Commercial Headline */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-lg max-w-xl mb-2.5">
          {ad.headline}
        </h2>

        {/* Commercial Copy */}
        <p className="text-xs sm:text-sm text-white/80 max-w-lg leading-relaxed line-clamp-2 drop-shadow mb-5 font-normal">
          {ad.description}
        </p>

        {/* Primary Call to Action Button */}
        <button
          onClick={handleCtaClick}
          className="group flex items-center gap-2.5 px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm transition-all transform hover:scale-105 active:scale-95 shadow-2xl cursor-pointer"
        >
          <span>{ad.ctaText}</span>
          <ExternalLink className="w-4 h-4 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {hasClicked && (
          <p className="mt-3 text-[11px] text-emerald-400 flex items-center gap-1 bg-black/60 px-3 py-1 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Opening sponsor page in new tab</span>
          </p>
        )}
      </div>

      {/* ================= GOOGLE IMA BOTTOM CONTROL BAR ================= */}
      <div className="relative z-20 flex items-center justify-between p-3.5 sm:p-5 bg-gradient-to-t from-black via-black/80 to-transparent">
        {/* Bottom Left: Advertiser Card (Google IMA Standard Overlay) */}
        <div
          onClick={handleCtaClick}
          className="group flex items-center gap-3 p-2 sm:p-2.5 rounded-xl bg-black/70 hover:bg-black/90 border border-white/15 backdrop-blur-md transition-all cursor-pointer max-w-xs sm:max-w-sm truncate shadow-xl"
        >
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-10 h-10 rounded-lg object-cover border border-white/20 shrink-0"
          />
          <div className="truncate text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#FFCC00] transition-colors">
                {ad.sponsorName}
              </span>
              <svg className="w-3.5 h-3.5 text-sky-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <p className="text-[11px] text-white/60 truncate">
              {domainText} • {ad.ctaText}
            </p>
          </div>
        </div>

        {/* Bottom Right: IMA Skip / Countdown Controls */}
        <div className="flex items-center gap-2">
          {isUnskippable ? (
            <div className="px-3.5 py-2 rounded-xl bg-black/80 border border-white/15 text-xs font-mono text-white/90 flex items-center gap-2 shadow-xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#FFCC00] animate-pulse" />
              <span>
                {format === 'REWARDED' ? 'Reward in' : 'Video ends in'}{' '}
                <span className="font-bold text-[#FFCC00]">{remainingSeconds}s</span>
              </span>
            </div>
          ) : canSkip ? (
            <button
              onClick={handleSkip}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-black/80 hover:bg-black text-white font-bold text-xs sm:text-sm border border-white/30 backdrop-blur-md transition-all shadow-xl hover:border-white/60 active:scale-95 cursor-pointer"
            >
              <span>Skip Ad</span>
              <SkipForward className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-black/80 border border-white/15 text-xs text-white/70 font-mono shadow-xl backdrop-blur-md">
              Skip in <span className="font-bold text-white">{skipCountdown}s</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= GOOGLE ADS SIGNATURE YELLOW SCRUBBER ================= */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30 pointer-events-none">
        <div
          className="h-full bg-[#FFCC00] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
