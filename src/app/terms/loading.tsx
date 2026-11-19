import React from 'react';

export default function TermsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-3 border-b border-slate-200 pb-6">
        <div className="h-6 w-48 rounded-full bg-slate-200" />
        <div className="h-10 w-80 max-w-full rounded-xl bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-28 rounded-2xl bg-white border border-slate-200 p-4 shadow-xs" />
        <div className="h-28 rounded-2xl bg-white border border-slate-200 p-4 shadow-xs" />
      </div>

      {/* Sections Skeleton */}
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs" />
        ))}
      </div>
    </div>
  );
}
