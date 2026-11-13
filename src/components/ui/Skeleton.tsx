import React from 'react';

export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`}
      {...props}
    />
  );
}

export function GameCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface rounded-2xl overflow-hidden border border-white/5 space-y-3 p-0">
      <Skeleton className="w-full aspect-video rounded-none" />
      <div className="p-3.5 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-[340px] sm:h-[400px] md:h-[460px] rounded-3xl bg-surface border border-white/10 p-8 sm:p-12 flex flex-col justify-end space-y-4">
      <Skeleton className="h-5 w-32 rounded-full" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-12 w-44 rounded-2xl" />
        <Skeleton className="h-12 w-28 rounded-2xl" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function AuthTransitionSkeleton({
  title = 'Authenticating Gamer Session...',
  subtitle = 'Synchronizing cloud profile, favorites, and instant play cache...',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Top Banner Skeleton with Shimmer */}
      <div className="w-full h-44 sm:h-52 rounded-3xl bg-slate-900/80 border border-white/5 p-6 sm:p-8 flex flex-col justify-end space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-28 rounded-full bg-indigo-500/20" />
          <Skeleton className="h-5 w-20 rounded-full bg-cyan-500/20" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-white/90">{title}</h2>
          <p className="text-xs text-gray-400 font-mono">{subtitle}</p>
        </div>
      </div>

      {/* Navigation Pills Skeleton */}
      <div className="flex gap-2 overflow-hidden py-1">
        {[100, 80, 110, 90, 85, 95].map((w, i) => (
          <Skeleton key={i} className="h-9 rounded-xl shrink-0" style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* Game Cards Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function FavoritesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Toolbar Skeleton */}
      <div className="flex items-center justify-between p-3.5 bg-slate-900/80 rounded-2xl border border-white/5">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-44 rounded-xl hidden sm:block" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-white/5"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-12 rounded-xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PayoutsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Balance Card Skeleton */}
      <div className="rounded-2xl p-6 sm:p-7 bg-[#121826] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-11 w-44 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Methods & Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#121826] border border-slate-800 p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>

      {/* Ledger Table Container */}
      <div className="rounded-2xl bg-[#121826] border border-slate-800 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-32 rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-white/5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RecommendationsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PortalShellSkeleton({ portal = 'DEVELOPER' }: { portal?: 'DEVELOPER' | 'ADMIN' }) {
  const isDev = portal === 'DEVELOPER';
  return (
    <div className="min-h-screen bg-[#090D16] flex animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="w-64 border-r border-white/5 p-6 hidden md:flex flex-col space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className={`w-9 h-9 rounded-xl ${isDev ? 'bg-cyan-500/20' : 'bg-indigo-500/20'}`} />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-2 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar Skeleton */}
        <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  );
}
