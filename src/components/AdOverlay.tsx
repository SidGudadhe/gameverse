'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ExternalLink, SkipForward, Award, ShieldCheck } from 'lucide-react';
import { MockAdCreative } from '../lib/ads';
import { AdFormat } from '../types';

interface AdOverlayProps {
  ad: MockAdCreative;
  format: AdFormat;
  onAdComplete: (durationSeconds: number, skipped: boolean) => void;
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = ad.durationSeconds || 10;
  const skipOffset = ad.skipOffsetSeconds;
  const canSkip = skipOffset > 0 && elapsedSeconds >= skipOffset;
  const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);
  const skipCountdown = Math.max(0, skipOffset - elapsedSeconds);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalDuration) {
          if (timerRef.current) clearInterval(timerRef.current);
          onAdComplete(totalDuration, false);
          return totalDuration;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalDuration, onAdComplete]);

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
    <div className="absolute inset-0 z-40 flex flex-col justify-between bg-[#080B14]/95 backdrop-blur-md overflow-hidden animate-fade-in select-none">
      {/* Top Banner Control Bar */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-5 bg-gradient-to-b from-black/80 to-transparent">
        {/* Left: Ad attribution badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 backdrop-blur-md text-[11px] font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-amber-300">Ad</span>
            <span className="text-slate-500">•</span>
            <span>GameVerse Network</span>
          </div>

          {format === 'REWARDED' && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[11px] font-semibold text-indigo-300">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Watch to claim bonus reward</span>
            </div>
          )}
        </div>

        {/* Right: Audio mute & Skip button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="w-8 h-8 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/60 transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Skip / Countdown Button */}
          {format === 'REWARDED' ? (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
              Reward in <span className="font-bold text-amber-400">{remainingSeconds}s</span>
            </div>
          ) : canSkip ? (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer animate-pulse"
            >
              <span>Skip Ad</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-400 font-mono">
              Skip in <span className="font-bold text-slate-200">{skipCountdown}s</span>
            </div>
          )}
        </div>
      </div>

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
      <div className="relative z-10 w-full bg-slate-950/80 border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400">
            {format} AD {elapsedSeconds}s / {totalDuration}s
          </span>
        </div>

        {/* Animated Progress Track */}
        <div className="w-32 sm:w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-4">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <span className="hidden sm:inline text-slate-500 font-mono text-[10px]">
          GameVerse Ads SDK v1.0
        </span>
      </div>
    </div>
  );
}
