import React from 'react';

export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Search Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-60 rounded-xl bg-slate-800/80" />
        <div className="h-4 w-72 rounded bg-slate-800/50" />
      </div>

      {/* Grid Skeleton */}
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
          </div>
        ))}
      </div>
    </div>
  );
}
