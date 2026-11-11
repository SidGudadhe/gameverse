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
