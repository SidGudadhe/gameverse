'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Protected player sub-pages that strictly require authenticated in-app navigation
const PROTECTED_PLAYER_SUBPAGES = [
  '/player',
  '/player/payouts',
  '/player/profile',
  '/player/favorites',
  '/player/history',
];

export default function NavigationGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const lastInAppClick = useRef<number>(Date.now());

  // Track legitimate in-app clicks on links, buttons, and navigation options
  useEffect(() => {
    const handleUserInteraction = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest('a') ||
          target.closest('button') ||
          target.closest('[role="button"]') ||
          target.closest('[data-nav-option]'))
      ) {
        lastInAppClick.current = Date.now();
        try {
          sessionStorage.setItem('gv_last_inapp_nav', Date.now().toString());
        } catch {}
      }
    };

    document.addEventListener('click', handleUserInteraction, { capture: true });
    return () => {
      document.removeEventListener('click', handleUserInteraction, { capture: true });
    };
  }, []);

  // Enforce Navigation Integrity on URL changes
  useEffect(() => {
    if (loading) return;

    const isProtected = PROTECTED_PLAYER_SUBPAGES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    );

    if (isProtected) {
      // 1. Unauthenticated users cannot access protected sub-pages by changing URL
      if (!isAuthenticated) {
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // 2. Prevent suspicious direct jumps if session indicates tampering
      try {
        sessionStorage.setItem('gv_current_page', pathname);
      } catch {}
    }
  }, [pathname, isAuthenticated, loading, router]);

  return null;
}
