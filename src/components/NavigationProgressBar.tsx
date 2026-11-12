'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // When path or search changes, finish navigation state
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Listen for link clicks to provide 0ms instant feedback
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        !target.target &&
        !target.hasAttribute('download')
      ) {
        const nextUrl = new URL(target.href);
        if (nextUrl.pathname !== window.location.pathname || nextUrl.search !== window.location.search) {
          setIsNavigating(true);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[99999] pointer-events-none overflow-hidden bg-transparent">
      <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 shadow-sm shadow-cyan-400/50 animate-[progress_1s_ease-in-out_infinite]" />
    </div>
  );
}
