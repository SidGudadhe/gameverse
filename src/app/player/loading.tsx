import React from 'react';

export default function PlayerLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-slate-200" />
          <div className="h-4 w-80 max-w-full rounded bg-slate-200" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-slate-200" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-8 w-8 rounded-xl bg-slate-200" />
            </div>
            <div className="h-6 w-32 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Content Container Skeleton */}
      <div className="h-72 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs" />
    </div>
  );
}
