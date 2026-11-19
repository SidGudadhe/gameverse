import React from 'react';
import GameVerseLogo from '@/components/ui/GameVerseLogo';

export default function GameSlugLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 rounded bg-slate-200" />
        <span className="text-slate-300">/</span>
        <div className="h-4 w-24 rounded bg-slate-200" />
        <span className="text-slate-300">/</span>
        <div className="h-4 w-32 rounded bg-slate-200" />
      </div>

      {/* Big Game Player Viewport Skeleton */}
      <div className="w-full aspect-video rounded-3xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center p-6 shadow-sm relative overflow-hidden">
        <GameVerseLogo size="2xl" className="mb-3 animate-pulse shadow-lg shadow-indigo-500/20" />
        <div className="h-5 w-48 bg-slate-200 rounded-full" />
        <div className="h-3 w-32 bg-slate-200 rounded-full mt-2" />
      </div>

      {/* Game Info & Action Bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="space-y-2">
          <div className="h-6 w-56 rounded-lg bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="h-4 w-24 rounded bg-slate-100" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-xl bg-slate-100" />
          <div className="h-10 w-28 rounded-xl bg-indigo-600/30" />
        </div>
      </div>
    </div>
  );
}
