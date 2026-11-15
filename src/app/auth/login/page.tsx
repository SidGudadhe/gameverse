'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Gamepad2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Zap,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { AuthTransitionSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import GoogleAccountChooser, { GoogleAccount } from '@/components/GoogleAccountChooser';

function CrazyGamesLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, isAuthenticated, loading: authLoading } = useAuth();

  const redirectParam = searchParams.get('redirect');
  const targetDestination = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';

  // Prevent logged-in users from seeing the login screen and prefetch target
  useEffect(() => {
    try {
      router.prefetch(targetDestination);
    } catch {}
    if (isAuthenticated && !authLoading) {
      router.replace(targetDestination);
    }
  }, [isAuthenticated, authLoading, router, targetDestination]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLegacyEmailForm, setShowLegacyEmailForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [error, setError] = useState('');
  const [errorTitle, setErrorTitle] = useState('Incorrect Credentials');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Listen for Google OAuth popup messages
  useEffect(() => {
    const handlePopupMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        setSession(event.data.user);
        setSuccessMsg(`Welcome, ${event.data.user.name}! Signed in with Google.`);
        setShowGoogleChooser(false);
        router.replace(targetDestination);
      }
    };

    window.addEventListener('message', handlePopupMessage);
    return () => window.removeEventListener('message', handlePopupMessage);
  }, [setSession, router, targetDestination]);

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError('');
    setShowErrorPopup(false);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPass,
          portal: 'PLAYER',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        if (res.status === 429) {
          setErrorTitle('Rate Limit Exceeded');
          setError(data.error || 'Too many login attempts. Please wait a minute before trying again.');
        } else {
          setErrorTitle('Incorrect Credentials');
          setError(data.error || 'Invalid email or password.');
        }
        setShowErrorPopup(true);
        return;
      }

      // Synchronous instant session update
      if (data.user) {
        setSession(data.user);
      }

      setSuccessMsg('Signed in successfully! Redirecting...');
      router.replace(targetDestination);

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/auth/login') {
          window.location.href = targetDestination;
        }
      }, 150);
    } catch {
      setLoading(false);
      setErrorTitle('Connection Error');
      setError('Network error occurred. Please try again.');
      setShowErrorPopup(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  // Step 1: Open Google Account Chooser
  const handleGoogleClick = () => {
    setError('');
    setShowErrorPopup(false);
    setShowGoogleChooser(true);
  };

  // Step 2 & 3: Account selected -> Real Google Sign-in with real chosen email
  const handleGoogleAccountSelect = async (account: GoogleAccount) => {
    setGoogleLoading(true);
    setError('');
    setShowErrorPopup(false);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          name: account.name,
          avatarUrl: account.avatarUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGoogleLoading(false);
        setErrorTitle('Google Sign-In Failed');
        setError(data.error || 'Google authentication failed.');
        setShowErrorPopup(true);
        throw new Error(data.error || 'Google authentication failed.');
      }

      if (data.user) {
        setSession(data.user);
      }

      setGoogleLoading(false);
      setShowGoogleChooser(false);
      setSuccessMsg(`Welcome, ${data.user.name}! Signed in with Google.`);
      router.replace(targetDestination);

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/auth/login') {
          window.location.href = targetDestination;
        }
      }, 150);
    } catch (err: any) {
      setGoogleLoading(false);
      throw err;
    }
  };

  const handleQuickLogin = async (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
    await performLogin(testEmail, 'Password123!');
  };

  if (loading || (isAuthenticated && !authLoading)) {
    return (
      <AuthTransitionSkeleton
        title="Signing into GameVerse..."
        subtitle="Verifying gamer credentials and loading instant play catalog..."
      />
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      {/* Toast Notification Alert */}
      {showErrorPopup && (
        <div
          role="alert"
          className="fixed top-6 right-6 z-50 max-w-sm w-full bg-[#13151f]/95 border border-rose-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0 text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white">{errorTitle}</h4>
            <p className="text-xs text-rose-300/90 mt-0.5">{error || 'Invalid email or password.'}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowErrorPopup(false)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CrazyGames Clean Auth Card */}
      <div className="w-full max-w-md bg-[#13151f] p-8 rounded-2xl border border-purple-500/25 shadow-2xl shadow-purple-950/60 relative overflow-hidden backdrop-blur-xl text-gray-100">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6A38EB] to-[#9D4EDD] flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30 mb-3">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black font-heading text-white tracking-tight">
            Log in to GameVerse
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Save your game progress, unlock payouts, and track favorites.
          </p>
        </div>

        {/* Inline Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* ================= OPTION 1: 1-CLICK ZERO TYPING GOOGLE SSO ================= */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={googleLoading || loading}
            onClick={handleGoogleClick}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 text-sm active:scale-[0.99] disabled:opacity-70 cursor-pointer"
          >
            {/* Official Google 4-Color SVG Logo */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-bold text-gray-900">
              {googleLoading ? 'Connecting Google Account...' : 'Continue with Google'}
            </span>
          </button>
        </div>

        {/* ================= OPTION 2: 1-CLICK INSTANT DEMO GAMER LOGIN ================= */}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={loading || googleLoading}
            onClick={() => handleQuickLogin('player@gamer.com')}
            className="w-full py-3 px-4 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 hover:text-purple-200 border border-purple-500/25 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Instant Demo: Play as NeoGamer99 (1-Click)</span>
          </button>
        </div>

        {/* Optional Collapsible: Legacy Email/Password Form (Hidden by default to avoid typing clutter) */}
        <div className="mt-5 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={() => setShowLegacyEmailForm(!showLegacyEmailForm)}
            className="w-full text-center text-xs text-gray-500 hover:text-gray-300 py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>{showLegacyEmailForm ? 'Hide email sign-in' : 'Have a legacy password? Sign in with email'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showLegacyEmailForm ? 'rotate-180' : ''}`} />
          </button>

          {showLegacyEmailForm && (
            <form onSubmit={handleLogin} className="mt-3 space-y-3 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1b1e2b] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-300">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1b1e2b] border border-white/10 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <span>Signing in...</span> : <span>Log In with Password</span>}
              </button>
            </form>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="text-center text-xs text-gray-400 pt-4">
          No account yet?{' '}
          <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 font-bold">
            Join now
          </Link>
        </div>
      </div>

      {/* Google Account Selector Dialog */}
      <GoogleAccountChooser
        isOpen={showGoogleChooser}
        onClose={() => setShowGoogleChooser(false)}
        onAccountSelect={handleGoogleAccountSelect}
        isLoading={googleLoading}
      />
    </div>
  );
}

export default function CrazyGamesLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-gray-400 text-xs">
          Loading GameVerse Auth...
        </div>
      }
    >
      <CrazyGamesLoginContent />
    </Suspense>
  );
}
