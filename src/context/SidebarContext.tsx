'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
  isPlayerPortal: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Determine if on player portal (Gamer Realm)
  const isPlayerPortal =
    !pathname.startsWith('/developer') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/design-system') &&
    !pathname.startsWith('/sandbox');

  // Load user collapse preference on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gv_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      } else if (window.innerWidth < 1280) {
        // Default to compact rail on medium-size desktop screens
        setIsCollapsed(true);
      }
    } catch {}
  }, []);

  // Automatically close mobile sidebar drawer on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gv_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const setCollapsed = (val: boolean) => {
    setIsCollapsed(val);
    try {
      localStorage.setItem('gv_sidebar_collapsed', String(val));
    } catch {}
  };

  const toggleMobile = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapse,
        setCollapsed,
        isMobileOpen,
        toggleMobile,
        closeMobile,
        isPlayerPortal,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
