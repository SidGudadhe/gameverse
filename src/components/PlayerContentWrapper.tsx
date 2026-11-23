'use client';

import React from 'react';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';

export default function PlayerContentWrapper({ children }: { children: React.ReactNode }) {
  const { isPlayerPortal, isCollapsed } = useSidebar();
  const { isAuthenticated } = useAuth();

  if (!isPlayerPortal) {
    return <>{children}</>;
  }

  // When not authenticated, no sidebar is rendered so content takes full width
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col w-full transition-all duration-300">
        {children}
      </div>
    );
  }

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] flex flex-col transition-all duration-300 ${
        isCollapsed ? 'md:pl-16' : 'md:pl-48'
      }`}
    >
      {children}
    </div>
  );
}
