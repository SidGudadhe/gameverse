import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

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
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <footer className="border-t border-white/10 bg-surface/50 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-white text-base">GAMEVERSE</span>
              <span>© 2026 GameVerse Portal Ltd. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</a>
              <a href="/creator-agreement" className="hover:text-gray-300 transition-colors">Creator Agreement</a>
              <a href="/developer" className="hover:text-indigo-400 transition-colors">Developer Portal</a>
              <a href="/admin" className="hover:text-indigo-400 transition-colors">Admin Portal</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
