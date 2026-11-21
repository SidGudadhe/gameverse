'use client';

import React from 'react';
import { useSidebar } from '@/context/SidebarContext';

export default function PlayerContentWrapper({ children }: { children: React.ReactNode }) {
  const { isPlayerPortal, isCollapsed } = useSidebar();

  if (!isPlayerPortal) {
    return <>{children}</>;
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
