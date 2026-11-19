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
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AuthTransitionSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import GoogleSignIn from '@/components/GoogleSignIn';

function PlayerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, isAuthenticated, loading: authLoading } = useAuth();

  const redirectParam = searchParams.get('redirect');
  const targetDestination = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';

  // Prevent already logged-in users from seeing the login screen
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
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorTitle, setErrorTitle] = useState('Authentication Error');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Listen for Google OAuth popup messages
  useEffect(() => {
    const handlePopupMessage = (event: MessageEvent) => {
      if (typeof window === 'undefined') return;
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        setSession(event.data.user);
        setSuccessMsg(`Welcome, ${event.data.user.name}! Signed in with Google.`);
        router.replace(targetDestination);
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setErrorTitle('Google Sign-In Error');
        setError(event.data.error || 'Google authentication encountered an issue.');
        setShowErrorPopup(true);
      }
    };

    window.addEventListener('message', handlePopupMessage);
    return () => window.removeEventListener('message', handlePopupMessage);
  }, [setSession, router, targetDestination]);

  // Method 2: Direct Email + Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setErrorTitle('Missing Information');
      setError('Please enter both your email address and password.');
      setShowErrorPopup(true);
      return;
    }

    setLoading(true);
    setError('');
    setShowErrorPopup(false);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          portal: 'PLAYER',
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        if (res.status === 429) {
          setErrorTitle('Rate Limit Exceeded');
          setError(data.error || 'Too many attempts. Please wait a minute before trying again.');
        } else {
          setErrorTitle('Incorrect Credentials');
          setError(data.error || 'Invalid email or password.');
        }
        setShowErrorPopup(true);
        return;
      }

      if (data.user) {
        setSession(data.user);
      }

      setSuccessMsg('Signed in successfully! Launching games...');
      router.replace(targetDestination);

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/auth/login') {
          window.location.href = targetDestination;
        }
      }, 150);
    } catch {
      setLoading(false);
      setErrorTitle('Network Connection Error');
      setError('Unable to reach server. Please check your internet connection and try again.');
      setShowErrorPopup(true);
    }
  };

  if (loading || (isAuthenticated && !authLoading)) {
    return (
      <AuthTransitionSkeleton
        title="Signing into GameVerse..."
        subtitle="Verifying gamer profile and synchronizing cloud save data..."
      />
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Subtle Gaming Background Gradients & Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Floating Error Toast Notification */}
      {showErrorPopup && (
        <div
          role="alert"
          className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 border border-rose-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 flex items-start gap-3 text-slate-100"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0 text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white">{errorTitle}</h4>
            <p className="text-xs text-rose-300 mt-0.5">{error || 'Invalid email or password.'}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowErrorPopup(false)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl shadow-2xl p-8 relative overflow-hidden backdrop-blur-xl z-10">
        {/* Top Glowing Ambient Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400" />

        {/* 1. Website Logo & 2. Welcome Back Heading & 3. Short Description */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30 mb-3 border border-purple-400/30">
            <Gamepad2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black font-heading text-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Log in to continue your gaming sessions, track achievements, and unlock rewards.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* ================= 4. METHOD 1: OFFICIAL GOOGLE AUTHENTICATION ================= */}
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

        {/* ================= 5. VISUAL DIVIDER "OR" ================= */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-slate-700/80 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            OR
          </span>
          <div className="border-t border-slate-700/80 w-full" />
        </div>

        {/* ================= METHOD 2: DIRECT EMAIL & PASSWORD SIGN-IN ================= */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 6. Email Input Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* 7. Password Input Field & 8. Show/Hide Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 9. Remember Me Option & 10. Forgot Password Link */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-slate-400 select-none">Remember Me</span>
            </label>

            <Link
              href="/auth/forgot-password"
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* 11. Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In with Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 12. Create Account Link */}
        <div className="text-center text-xs text-slate-400 pt-6 mt-6 border-t border-slate-800">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/auth/signup"
            className="text-purple-400 hover:text-purple-300 font-bold transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CrazyGamesLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-slate-400 text-xs bg-slate-950">
          Loading GameVerse Auth...
        </div>
      }
    >
      <PlayerLoginContent />
    </Suspense>
  );
}
