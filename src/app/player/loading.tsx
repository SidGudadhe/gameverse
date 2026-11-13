import React from 'react';

export default function PlayerLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 rounded bg-slate-800/80" />
        <div className="h-3 w-3 rounded-full bg-slate-800/50" />
        <div className="h-4 w-32 rounded bg-slate-800/60" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-slate-800/80" />
          <div className="h-4 w-80 max-w-full rounded bg-slate-800/50" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-slate-800/80" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-900/70 border border-white/5 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-800/80" />
              <div className="h-8 w-8 rounded-xl bg-slate-800/80" />
            </div>
            <div className="h-6 w-32 rounded bg-slate-800/90" />
          </div>
        ))}
      </div>

      {/* Content Container Skeleton */}
      <div className="h-72 rounded-3xl bg-slate-900/60 border border-white/5 p-6" />
    </div>
  );
}
