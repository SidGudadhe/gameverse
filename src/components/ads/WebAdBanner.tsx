'use client';

import React, { useState } from 'react';
import { ExternalLink, X, Shield, Info } from 'lucide-react';

export type WebAdPlacement =
  | 'HOMEPAGE_TOP'
  | 'HOMEPAGE_MIDDLE_NATIVE'
  | 'HOMEPAGE_SIDEBAR'
  | 'CATEGORY_NATIVE'
  | 'CATEGORY_BANNER'
  | 'SEARCH_SPONSORED'
  | 'GAME_DETAIL_BANNER'
  | 'FOOTER_DISPLAY';

interface WebAdBannerProps {
  placement: WebAdPlacement;
  className?: string;
}

const PLACEMENT_CONFIG: Record<
  WebAdPlacement,
  {
    format: string;
    dimensions: string;
    headline: string;
    subtext: string;
    sponsor: string;
    domain: string;
    badge?: string;
    cta: string;
    ctaUrl: string;
    imageUrl: string;
  }
> = {
  HOMEPAGE_TOP: {
    format: 'Leaderboard',
    dimensions: '728x90 / 970x90',
    headline: 'Razer BlackShark V2 Pro — Wireless Esports Gaming Headset',
    subtext: 'TriForce Titanium 50mm Drivers • Ultra-Wideband Mic • Zero-Latency Wireless',
    sponsor: 'Razer Inc.',
    domain: 'razer.com',
    badge: 'Official Esports Choice',
    cta: 'Shop Now',
    ctaUrl: 'https://razer.com',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80',
  },
  HOMEPAGE_MIDDLE_NATIVE: {
    format: 'Native Sponsored Card',
    dimensions: 'In-Grid Game Card',
    headline: 'NordVPN — Stabilize Gaming Ping & Prevent ISP Bandwidth Throttling',
    subtext: 'Direct fiber optic gaming nodes across 111 countries • 70% Off + 3 Months Free',
    sponsor: 'NordVPN',
    domain: 'nordvpn.com',
    badge: 'DDoS Defense',
    cta: 'Get 70% Off',
    ctaUrl: 'https://nordvpn.com',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80',
  },
  HOMEPAGE_SIDEBAR: {
    format: 'Medium Rectangle',
    dimensions: '300x250',
    headline: 'Samsung Odyssey Neo G9 — 49" 240Hz Curved Gaming Monitor',
    subtext: 'Quantum Mini-LED • 1000R Dual QHD • 1ms Response Time',
    sponsor: 'Samsung Electronics',
    domain: 'samsung.com',
    badge: 'CES Award Winner',
    cta: 'Explore Display',
    ctaUrl: 'https://samsung.com',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
  },
  CATEGORY_NATIVE: {
    format: 'Native Category Card',
    dimensions: 'In-Grid Card',
    headline: 'Spotify Premium — Game to High-Tempo Soundtracks with No Ads',
    subtext: 'Millions of esports OSTs and synthwave tracks • Unlimited skips & offline playback',
    sponsor: 'Spotify',
    domain: 'spotify.com',
    badge: 'Ad-Free OSTs',
    cta: 'Try 3 Months Free',
    ctaUrl: 'https://spotify.com',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
  },
  CATEGORY_BANNER: {
    format: 'Leaderboard',
    dimensions: '728x90 / 970x90',
    headline: 'SteelSeries Apex Pro TKL — Rapid Trigger Esports Gaming Keyboard',
    subtext: 'OmniPoint 2.0 Adjustable HyperMagnetic Switches • 0.1ms Latency • Aircraft-Grade Aluminum',
    sponsor: 'SteelSeries',
    domain: 'steelseries.com',
    badge: 'Esports Standard',
    cta: 'Explore Keyboard',
    ctaUrl: 'https://steelseries.com',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
  },
  SEARCH_SPONSORED: {
    format: 'Sponsored Listing',
    dimensions: 'Featured Search Result',
    headline: 'Galaxy Odyssey 3D: Star Vanguard — Featured Action Release',
    subtext: 'Explore planetary bases & pilot interstellar starfighters in real-time WebGL 3D',
    sponsor: 'Vanguard Interactive',
    domain: 'gameverse.com',
    badge: 'Featured Partner Game',
    cta: 'Play Now (Free)',
    ctaUrl: '/game/galaxy-odyssey-3d',
    imageUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=400&q=80',
  },
  GAME_DETAIL_BANNER: {
    format: 'Leaderboard',
    dimensions: '728x90',
    headline: 'PlayStation 5 Pro — 4K 120FPS with Spectral Super Resolution',
    subtext: 'Advanced Ray Tracing • DualSense Haptic Feedback • Ultra-Fast 2TB SSD',
    sponsor: 'Sony PlayStation',
    domain: 'playstation.com',
    badge: 'Next-Gen Visuals',
    cta: 'Discover PS5 Pro',
    ctaUrl: 'https://playstation.com',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80',
  },
  FOOTER_DISPLAY: {
    format: 'Super Leaderboard',
    dimensions: '970x90',
    headline: 'Discord Nitro — 4K 60FPS Streaming, 500MB Uploads & Soundboard Perks',
    subtext: 'Level up your voice chat with custom animated emojis, avatars, and 2 Free Server Boosts',
    sponsor: 'Discord',
    domain: 'discord.com',
    badge: 'Gamer Essential',
    cta: 'Upgrade to Nitro',
    ctaUrl: 'https://discord.com',
    imageUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=400&q=80',
  },
};

export default function WebAdBanner({ placement, className = '' }: WebAdBannerProps) {
  const config = PLACEMENT_CONFIG[placement];
  const [dismissed, setDismissed] = useState(false);
  const [showAdChoicesInfo, setShowAdChoicesInfo] = useState(false);

  if (dismissed || !config) return null;

  // AdChoices Header helper
  const renderAdChoicesHeader = () => (
    <div className="relative flex items-center justify-between px-3 py-1 bg-black/40 border-b border-slate-800/60 text-[10px] text-slate-400 select-none">
      <div className="flex items-center gap-1.5 font-sans">
        <span className="bg-slate-800 text-slate-300 font-bold px-1.5 py-0.2 rounded text-[9px] border border-slate-700">
          Ad
        </span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-300 font-medium">{config.sponsor}</span>
        <span className="text-slate-500">({config.domain})</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowAdChoicesInfo(!showAdChoicesInfo);
          }}
          title="AdChoices • Google Display Network Standard"
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" viewBox="0 0 16 16">
            <polygon points="2,2 14,8 2,14" />
          </svg>
          <span className="font-semibold text-[9px]">AdChoices</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          title="Dismiss ad"
          className="hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {showAdChoicesInfo && (
        <div className="absolute right-2 top-full mt-1 w-60 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-left shadow-2xl z-50 text-[11px] text-slate-300">
          <p className="font-bold text-white mb-0.5 flex items-center gap-1">
            <Info className="w-3 h-3 text-cyan-400" />
            Ads by GameVerse Network
          </p>
          <p className="text-[10px] text-slate-400 leading-normal">
            Targeted display advertising compliant with Google AdSense and IAB standard privacy guidelines.
          </p>
        </div>
      )}
    </div>
  );

  // 1. NATIVE AD IN GRIDS (Homepage Middle & Category Page - Looks like a premium GameCard)
  if (placement === 'HOMEPAGE_MIDDLE_NATIVE' || placement === 'CATEGORY_NATIVE') {
    return (
      <div
        className={`relative flex flex-col rounded-2xl overflow-hidden bg-slate-900/90 text-white border border-slate-800 shadow-md group transition-all duration-300 hover:shadow-indigo-500/20 hover:border-slate-700 ${className}`}
      >
        {renderAdChoicesHeader()}

        {/* Thumbnail Artwork */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
          <img
            src={config.imageUrl}
            alt={config.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span className="text-[9px] font-bold text-cyan-300 bg-black/80 border border-cyan-500/30 px-2 py-0.5 rounded-md backdrop-blur-xs font-sans tracking-wide">
              SPONSORED
            </span>
            {config.badge && (
              <span className="text-[9px] font-medium text-slate-300 bg-black/60 px-2 py-0.5 rounded-md">
                {config.badge}
              </span>
            )}
          </div>
        </div>

        {/* Ad Copy & CTA */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <h4 className="text-sm font-bold leading-snug line-clamp-2 text-white group-hover:text-cyan-300 transition-colors">
              {config.headline}
            </h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {config.subtext}
            </p>
          </div>

          <a
            href={config.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <span>{config.cta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // 2. SEARCH SPONSORED LISTING
  if (placement === 'SEARCH_SPONSORED') {
    return (
      <div
        className={`w-full rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md overflow-hidden transition-all hover:border-slate-700 ${className}`}
      >
        {renderAdChoicesHeader()}

        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={config.imageUrl}
              alt=""
              className="w-16 h-16 rounded-xl object-cover border border-slate-700/80 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-cyan-500/20 text-cyan-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30 uppercase tracking-wide">
                  Sponsored Partner
                </span>
                {config.badge && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    {config.badge}
                  </span>
                )}
              </div>
              <h4 className="font-heading font-black text-white text-base mt-1">
                {config.headline}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {config.subtext}
              </p>
            </div>
          </div>

          <a
            href={config.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <span>{config.cta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // 3. SIDEBAR DISPLAY AD (300x250 Medium Rectangle)
  if (placement === 'HOMEPAGE_SIDEBAR') {
    return (
      <div
        className={`w-full max-w-[320px] rounded-2xl bg-slate-900/90 text-white border border-slate-800 shadow-lg overflow-hidden space-y-3 ${className}`}
      >
        {renderAdChoicesHeader()}

        <div className="p-4 space-y-3 pt-1">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800">
            <img src={config.imageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-black/70 text-[9px] font-sans text-white/90 px-2 py-0.5 rounded backdrop-blur-xs">
              {config.dimensions}
            </div>
          </div>

          <h4 className="font-heading font-bold text-sm text-white leading-tight">
            {config.headline}
          </h4>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {config.subtext}
          </p>

          <a
            href={config.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <span>{config.cta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // 4. HORIZONTAL BANNERS (HOMEPAGE_TOP, GAME_DETAIL_BANNER, FOOTER_DISPLAY - Google Leaderboard Style)
  return (
    <div
      className={`w-full rounded-2xl bg-slate-900/90 text-white border border-slate-800 shadow-md relative overflow-hidden transition-all hover:border-slate-700 ${className}`}
    >
      {renderAdChoicesHeader()}

      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        {/* Left: Product Artwork & Copy */}
        <div className="flex items-center gap-3.5 truncate">
          <div className="hidden sm:block w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
            <img src={config.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>

          <div className="truncate text-left">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm sm:text-base text-white truncate">
                {config.headline}
              </span>
              {config.badge && (
                <span className="hidden md:inline-flex text-[10px] font-medium text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full shrink-0">
                  {config.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {config.subtext}
            </p>
          </div>
        </div>

        {/* Right: CTA Button */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <a
            href={config.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <span>{config.cta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
