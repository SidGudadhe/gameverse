import React from 'react';

export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 ${className}`}
      {...props}
    />
  );
}

export function GameCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 space-y-3 p-0 shadow-xs">
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
    <div className="w-full h-[340px] sm:h-[400px] md:h-[460px] rounded-3xl bg-slate-100 border border-slate-200 p-8 sm:p-12 flex flex-col justify-end space-y-4 shadow-sm">
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
    <tr className="border-b border-slate-100">
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
      <div className="w-full h-44 sm:h-52 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-end space-y-3 relative overflow-hidden shadow-sm">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-28 rounded-full bg-indigo-100" />
          <Skeleton className="h-5 w-20 rounded-full bg-cyan-100" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-500 font-mono">{subtitle}</p>
        </div>
      </div>

      {/* Navigation Pills Skeleton */}
      <div className="flex gap-2 overflow-hidden py-1">
        {[100, 80, 110, 90, 85, 95].map((w, i) => (
          <Skeleton key={i} className="h-9 rounded-xl shrink-0" style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* 8-Grid Game Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function RecommendationsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PortalShellSkeleton({ portal = 'DEVELOPER' }: { portal?: 'DEVELOPER' | 'ADMIN' }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sub-Header Skeleton */}
      <div className="border-b border-slate-200 bg-white/80 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex gap-2">
            {[90, 110, 80, 95].map((w, i) => (
              <Skeleton key={i} className="h-7 rounded-lg" style={{ width: `${w}px` }} />
            ))}
          </div>
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3 shadow-xs">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Big Table / Chart Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FavoritesSkeleton() {
  return <RecommendationsSkeleton count={8} />;
}

export function HistorySkeleton() {
  return <RecommendationsSkeleton count={8} />;
}

export function PayoutsSkeleton() {
  return <PortalShellSkeleton portal="DEVELOPER" />;
}
