'use client';

import React, { useState } from 'react';
import { ExternalLink, Tag, ShieldCheck, Sparkles, X, Info } from 'lucide-react';

export type WebAdPlacement =
  | 'HOMEPAGE_TOP'
  | 'HOMEPAGE_MIDDLE_NATIVE'
  | 'HOMEPAGE_SIDEBAR'
  | 'CATEGORY_NATIVE'
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
    tagText: string;
    format: string;
    dimensions: string;
    exampleLocation: string;
    headline: string;
    sponsor: string;
    cta: string;
    ctaUrl: string;
    imageUrl: string;
  }
> = {
  HOMEPAGE_TOP: {
    tagText: '[ ADVERTISEMENT: Homepage Top Banner ]',
    format: 'Banner',
    dimensions: '728x90 / 970x90',
    exampleLocation: 'Website header ke neeche • Top Banner placement',
    headline: 'HyperDrive Ultra X10 Wireless Gaming Headset — 7.1 Spatial Audio',
    sponsor: 'HyperDrive Gear',
    cta: 'Explore Gear',
    ctaUrl: 'https://example.com/hyperdrive',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80',
  },
  HOMEPAGE_MIDDLE_NATIVE: {
    tagText: '[ SPONSORED CONTENT / NATIVE AD: Homepage Middle ]',
    format: 'Native ad',
    dimensions: 'In-Grid Game Card',
    exampleLocation: 'Games ke beech sponsored content',
    headline: 'CyberShield Gaming VPN — Zero Ping & Anti-DDoS Node Routing',
    sponsor: 'Aegis Security',
    cta: 'Play with Low Ping',
    ctaUrl: 'https://example.com/cybershield',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80',
  },
  HOMEPAGE_SIDEBAR: {
    tagText: '[ ADVERTISEMENT: Homepage Sidebar Display Ad ]',
    format: 'Display ad',
    dimensions: '300x250 Medium Rectangle',
    exampleLocation: 'Right-side advertisement feed',
    headline: 'Quantum Cloud AI Studio — Generative 3D Shaders & WebGL Tools',
    sponsor: 'Quantum AI Systems',
    cta: 'Try Free Studio',
    ctaUrl: 'https://example.com/quantum',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
  },
  CATEGORY_NATIVE: {
    tagText: '[ SPONSORED CONTENT / NATIVE AD: Category Page ]',
    format: 'Native ad',
    dimensions: 'Category Listing Grid Card',
    exampleLocation: 'Racing games listing ke beech native ad',
    headline: 'PixelPulse Zero-Sugar Energy Drink — Esports Endurance',
    sponsor: 'Pixel Labs Co.',
    cta: 'Claim 20% Off',
    ctaUrl: 'https://example.com/pixelpulse',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
  },
  SEARCH_SPONSORED: {
    tagText: '[ SPONSORED LISTING: Search Results Partner Game ]',
    format: 'Sponsored listing',
    dimensions: 'Featured Search Result',
    exampleLocation: 'Search results list mein top sponsored game',
    headline: 'Galaxy Odyssey 3D: Star Vanguard — Official Featured Release',
    sponsor: 'Vanguard Interactive',
    cta: 'Play Sponsored Game',
    ctaUrl: '/game/galaxy-odyssey-3d',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
  },
  GAME_DETAIL_BANNER: {
    tagText: '[ ADVERTISEMENT: Game Detail Page Banner ]',
    format: 'Banner',
    dimensions: '728x90 Leaderboard',
    exampleLocation: 'Play button ke neeche banner ad placement',
    headline: 'HyperDrive Ultra X10 Wireless Gaming Headset — Zero Latency Sound',
    sponsor: 'HyperDrive Gear',
    cta: 'Get 25% Off',
    ctaUrl: 'https://example.com/hyperdrive',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80',
  },
  FOOTER_DISPLAY: {
    tagText: '[ ADVERTISEMENT: Footer Display Ad ]',
    format: 'Display ad',
    dimensions: '970x90 Super Leaderboard',
    exampleLocation: 'Page ke bottom mein footer ke upar advertisement',
    headline: 'Quantum Cloud AI & CyberShield Gaming Node Network',
    sponsor: 'GameVerse Partner Network',
    cta: 'Learn More',
    ctaUrl: 'https://example.com/partners',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
  },
};

export default function WebAdBanner({ placement, className = '' }: WebAdBannerProps) {
  const config = PLACEMENT_CONFIG[placement];
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !config) return null;

  // 1. NATIVE AD IN GRIDS (Looks like a GameCard with clear SPONSORED tags)
  if (placement === 'HOMEPAGE_MIDDLE_NATIVE' || placement === 'CATEGORY_NATIVE') {
    return (
      <div
        className={`relative flex flex-col rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 to-indigo-950/90 text-white border-2 border-dashed border-amber-400/80 shadow-md group transition-all duration-300 hover:shadow-indigo-500/20 ${className}`}
      >
        {/* Top Explicit Identification Bar */}
        <div className="bg-amber-500 text-slate-950 font-mono font-black text-[10px] tracking-wider uppercase px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <Tag className="w-3 h-3 text-slate-950" />
            <span className="truncate">{config.tagText}</span>
          </div>
          <span className="text-[9px] bg-slate-900 text-amber-300 font-bold px-1.5 py-0.2 rounded">
            {config.format}
          </span>
        </div>

        {/* Thumbnail Artwork */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
          <img
            src={config.imageUrl}
            alt={config.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-300 bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-xs font-mono">
              SPONSORED
            </span>
            <span className="text-[10px] text-slate-300">{config.sponsor}</span>
          </div>
        </div>

        {/* Ad Copy */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="text-[10px] font-mono text-amber-400 font-semibold mb-0.5">
              {config.exampleLocation}
            </div>
            <h4 className="text-sm font-bold leading-snug line-clamp-2 text-white">
              {config.headline}
            </h4>
          </div>

          <a
            href={config.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
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
        className={`w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-transparent border-2 border-dashed border-amber-500/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-center gap-3.5">
          <img
            src={config.imageUrl}
            alt=""
            className="w-16 h-16 rounded-xl object-cover border border-amber-400/50 shadow-sm shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-500 text-slate-950 font-mono font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wide">
                {config.tagText}
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                {config.exampleLocation}
              </span>
            </div>
            <h4 className="font-heading font-black text-slate-900 text-base mt-1">
              {config.headline}
            </h4>
            <div className="text-xs text-slate-600 font-medium">
              Promoted by <span className="font-semibold text-slate-900">{config.sponsor}</span>
            </div>
          </div>
        </div>

        <a
          href={config.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
        >
          <span>{config.cta}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // 3. SIDEBAR DISPLAY AD (300x250)
  if (placement === 'HOMEPAGE_SIDEBAR') {
    return (
      <div
        className={`w-full max-w-[320px] rounded-2xl bg-slate-900 text-white p-4 border-2 border-dashed border-amber-400/80 shadow-lg space-y-3 ${className}`}
      >
        <div className="bg-amber-500 text-slate-950 font-mono font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded flex items-center justify-between">
          <span className="truncate">{config.tagText}</span>
          <span>{config.dimensions}</span>
        </div>

        <div className="text-[10px] font-mono text-amber-300 font-semibold">
          {config.exampleLocation}
        </div>

        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800">
          <img src={config.imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute top-2 left-2 bg-black/80 text-[10px] font-mono text-amber-300 px-2 py-0.5 rounded">
            ADVERTISEMENT
          </div>
        </div>

        <h4 className="font-heading font-bold text-sm text-white leading-tight">
          {config.headline}
        </h4>

        <div className="text-[11px] text-slate-400">
          Sponsor: <span className="text-slate-200 font-semibold">{config.sponsor}</span>
        </div>

        <a
          href={config.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <span>{config.cta}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // 4. HORIZONTAL BANNERS (HOMEPAGE_TOP, GAME_DETAIL_BANNER, FOOTER_DISPLAY)
  return (
    <div
      className={`w-full rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 border-2 border-dashed border-amber-400/80 shadow-md relative overflow-hidden transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        {/* Left: Identifiable Ad Marker Tag */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
            <img src={config.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-500 text-slate-950 font-mono font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                {config.tagText}
              </span>
              <span className="text-[10px] font-mono text-amber-300 font-semibold">
                Format: {config.format} ({config.dimensions})
              </span>
            </div>

            <h4 className="font-heading font-bold text-sm sm:text-base text-white mt-1 leading-tight">
              {config.headline}
            </h4>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{config.exampleLocation}</span>
              <span>•</span>
              <span className="text-slate-300">Sponsor: {config.sponsor}</span>
            </div>
          </div>
        </div>

        {/* Right: CTA Button */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <a
            href={config.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>{config.cta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
