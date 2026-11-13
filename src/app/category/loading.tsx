import React from 'react';

export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Category Header Skeleton */}
      <div className="space-y-3 border-b border-white/5 pb-6">
        <div className="h-4 w-32 rounded-md bg-slate-800/80" />
        <div className="h-9 w-64 rounded-xl bg-slate-800/80" />
        <div className="h-4 w-96 max-w-full rounded-md bg-slate-800/50" />
      </div>

      {/* Genre Chips Bar Skeleton */}
      <div className="flex gap-2 overflow-hidden py-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 w-28 rounded-xl bg-slate-900/80 border border-white/5 flex-shrink-0" />
        ))}
      </div>

      {/* Category Game Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-slate-900/60 border border-white/5 p-3 flex flex-col space-y-3"
          >
            <div className="aspect-[4/3] rounded-xl bg-slate-800/80 w-full" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-3/4 rounded-md bg-slate-800/80" />
              <div className="h-3 w-1/2 rounded-md bg-slate-800/50" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="h-3 w-10 rounded bg-slate-800/50" />
              <div className="h-3 w-12 rounded bg-slate-800/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
