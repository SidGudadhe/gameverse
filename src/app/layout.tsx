import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import CookieConsent from '@/components/CookieConsent';
import FooterLegal from '@/components/FooterLegal';
import NavigationProgressBar from '@/components/NavigationProgressBar';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'GameVerse — Play Free Instant Browser Games (HTML5 & WebGL)',
  description: 'Instant play thousands of high performance HTML5, WebGL, and WASM games in your browser. No downloads or installs required.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#090D16] text-gray-100 flex flex-col selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <Suspense fallback={null}>
            <NavigationProgressBar />
          </Suspense>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <CookieConsent />
          <FooterLegal />
        </AuthProvider>
      </body>
    </html>
  );
}

