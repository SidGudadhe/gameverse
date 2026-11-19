import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="w-full min-h-[60vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top subtle neon progress line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-pulse z-[9999]" />

      <div className="space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="w-full h-64 sm:h-80 rounded-3xl bg-white border border-slate-200 relative overflow-hidden shadow-xs">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent animate-shimmer" />
        </div>

        {/* Chips Skeleton */}
        <div className="flex gap-2 overflow-hidden py-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 w-28 bg-white rounded-xl border border-slate-200 shrink-0" />
          ))}
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-white border border-slate-200 relative overflow-hidden shadow-xs">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
