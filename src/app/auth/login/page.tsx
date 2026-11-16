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
import GoogleSignIn from '@/components/GoogleSignIn';
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
          className="fixed top-6 right-6 z-50 max-w-sm w-full bg-white/95 border border-rose-200 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900">{errorTitle}</h4>
            <p className="text-xs text-rose-600 mt-0.5">{error || 'Invalid email or password.'}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowErrorPopup(false)}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CrazyGames Clean Auth Card - White Theme */}
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden text-slate-800">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6A38EB] to-[#9D4EDD] flex items-center justify-center mx-auto shadow-md shadow-purple-600/20 mb-3">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black font-heading text-slate-900 tracking-tight">
            Log in to GameVerse
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Save your game progress, unlock payouts, and track favorites.
          </p>
        </div>

        {/* Inline Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* ================= OPTION 1: OFFICIAL GOOGLE SIGN-IN & ONE TAP ================= */}
        <div className="space-y-3">
          <GoogleSignIn
            mode="LOGIN"
            enableOneTap={true}
            onSuccess={(user) => {
              setSuccessMsg(`Welcome, ${user.name}! Signed in with Google.`);
              setTimeout(() => {
                router.replace(targetDestination);
              }, 300);
            }}
            onError={(err) => {
              setErrorTitle('Google Sign-In Error');
              setError(err);
              setShowErrorPopup(true);
            }}
          />
        </div>

        {/* ================= OPTION 2: 1-CLICK INSTANT DEMO GAMER LOGIN ================= */}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={loading || googleLoading}
            onClick={() => handleQuickLogin('player@gamer.com')}
            className="w-full py-3 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Instant Demo: Play as NeoGamer99 (1-Click)</span>
          </button>
        </div>

        {/* Optional Collapsible: Legacy Email/Password Form */}
        <div className="mt-5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowLegacyEmailForm(!showLegacyEmailForm)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>{showLegacyEmailForm ? 'Hide email sign-in' : 'Have a legacy password? Sign in with email'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showLegacyEmailForm ? 'rotate-180' : ''}`} />
          </button>

          {showLegacyEmailForm && (
            <form onSubmit={handleLogin} className="mt-3 space-y-3 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-[11px] text-purple-600 hover:text-purple-700 font-medium transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
        <div className="text-center text-xs text-slate-500 pt-4">
          No account yet?{' '}
          <Link href="/auth/signup" className="text-purple-600 hover:text-purple-700 font-bold">
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
