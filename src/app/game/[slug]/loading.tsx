import React from 'react';
import { Gamepad2 } from 'lucide-react';

export default function GameSlugLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 rounded bg-slate-800/80" />
        <div className="h-3 w-3 rounded-full bg-slate-800/50" />
        <div className="h-4 w-24 rounded bg-slate-800/80" />
        <div className="h-3 w-3 rounded-full bg-slate-800/50" />
        <div className="h-4 w-32 rounded bg-slate-800/60" />
      </div>

      {/* Big Game Player Viewport Skeleton */}
      <div className="w-full aspect-video rounded-3xl bg-slate-950/80 border border-white/10 flex flex-col items-center justify-center text-center p-6 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-3">
          <Gamepad2 className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="h-5 w-48 bg-slate-800/80 rounded-full" />
        <div className="h-3 w-32 bg-slate-800/50 rounded-full mt-2" />
      </div>

      {/* Game Info & Action Bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-white/5 p-4 rounded-2xl">
        <div className="space-y-2">
          <div className="h-6 w-56 rounded-lg bg-slate-800/80" />
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 rounded bg-slate-800/60" />
            <div className="h-4 w-24 rounded bg-slate-800/60" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-xl bg-slate-800/80" />
          <div className="h-10 w-28 rounded-xl bg-indigo-600/30" />
        </div>
      </div>
    </div>
  );
}
