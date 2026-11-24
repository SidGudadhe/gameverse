import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import './globals.css';
import Navbar from '@/components/Navbar';
import GamerSidebar from '@/components/GamerSidebar';
import PlayerContentWrapper from '@/components/PlayerContentWrapper';
import FooterLegal from '@/components/FooterLegal';
import NavigationProgressBar from '@/components/NavigationProgressBar';
import NavigationGuard from '@/components/NavigationGuard';
import CrazyGamesAuthModal from '@/components/CrazyGamesAuthModal';
import { AuthProvider, AuthUser } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { verifyToken } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'GameVerse — Play Free Instant Browser Games (HTML5 & WebGL)',
  description: 'Instant play thousands of high performance HTML5, WebGL, and WASM games in your browser. No downloads or installs required.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialUser: AuthUser | null = null;
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('gameverse_session')?.value;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        initialUser = {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          role: decoded.role,
        };
      }
    }
  } catch {}

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <script src="https://accounts.google.com/gsi/client" async defer />
        {/* Legacy Service Worker & Cross-SaaS Cache Purge for localhost:3000 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (var i = 0; i < registrations.length; i++) {
                    registrations[i].unregister();
                  }
                });
              }
              if (typeof window !== 'undefined' && 'caches' in window) {
                caches.keys().then(function(names) {
                  for (var i = 0; i < names.length; i++) {
                    if (names[i].indexOf('agency') !== -1 || names[i].indexOf('agencypilot') !== -1) {
                      caches.delete(names[i]);
                    }
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
        <AuthProvider initialUser={initialUser}>
          <SidebarProvider>
            <NavigationGuard />
            <CrazyGamesAuthModal />
            <Suspense fallback={null}>
              <NavigationProgressBar />
            </Suspense>
            <Navbar />
            <GamerSidebar />
            <PlayerContentWrapper>
              <main className="flex-1 w-full">{children}</main>
              <FooterLegal />
            </PlayerContentWrapper>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
