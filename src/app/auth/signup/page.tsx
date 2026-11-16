'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { AuthTransitionSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import GoogleSignIn from '@/components/GoogleSignIn';
import GoogleAccountChooser, { GoogleAccount } from '@/components/GoogleAccountChooser';

export default function CrazyGamesSignupPage() {
  const router = useRouter();
  const { setSession, isAuthenticated, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // If already logged in, redirect to home and prefetch
  useEffect(() => {
    try {
      router.prefetch('/');
    } catch {}
    if (isAuthenticated && !authLoading) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // Listen for Google OAuth popup messages
  useEffect(() => {
    const handlePopupMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        setSession(event.data.user);
        setSuccessMsg(`Welcome to GameVerse, ${event.data.user.name}! Signed in with Google.`);
        setShowGoogleChooser(false);
        router.replace('/');
      }
    };

    window.addEventListener('message', handlePopupMessage);
    return () => window.removeEventListener('message', handlePopupMessage);
  }, [setSession, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please choose a gamer username.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!termsAgreed) {
      setError('You must confirm you are at least 18 years old and accept the Terms.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          portal: 'PLAYER',
          role: 'PLAYER',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data.error || 'Gamer registration failed. Email may already be in use.');
        return;
      }

      if (data.user) {
        setSession(data.user);
      }

      setSuccessMsg('Gamer account created! Launching games...');
      router.replace('/');

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/auth/signup') {
          window.location.href = '/';
        }
      }, 150);
    } catch {
      setLoading(false);
      setError('Network connection error. Please try again.');
    }
  };

  // Step 1: Open Google Account Chooser
  const handleGoogleClick = () => {
    setError('');
    setShowGoogleChooser(true);
  };

  // Step 2 & 3: Account selected -> Real Google Sign-in with real chosen email
  const handleGoogleAccountSelect = async (account: GoogleAccount) => {
    setGoogleLoading(true);
    setError('');
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
        setError(data.error || 'Google authentication failed.');
        throw new Error(data.error || 'Google authentication failed.');
      }

      if (data.user) {
        setSession(data.user);
      }

      setGoogleLoading(false);
      setShowGoogleChooser(false);
      setSuccessMsg(`Welcome to GameVerse, ${data.user.name}! Signed in with Google.`);
      router.replace('/');

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/auth/signup') {
          window.location.href = '/';
        }
      }, 150);
    } catch (err: any) {
      setGoogleLoading(false);
      throw err;
    }
  };

  if (loading || (isAuthenticated && !authLoading)) {
    return (
      <AuthTransitionSkeleton
        title="Creating Your Gamer Profile..."
        subtitle="Setting up cloud save profile, favorites, and instant play catalog..."
      />
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden text-slate-800">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6A38EB] to-[#9D4EDD] flex items-center justify-center mx-auto shadow-md shadow-purple-600/20 mb-3">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black font-heading text-slate-900 tracking-tight">
            Join GameVerse
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create your free gamer profile to save progress and join leaderboards.
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

        {/* ================= OPTION 1: OFFICIAL GOOGLE SIGN-UP & ONE TAP ================= */}
        <div className="space-y-3">
          <GoogleSignIn
            mode="SIGNUP"
            enableOneTap={true}
            onSuccess={(user) => {
              setSuccessMsg(`Welcome to GameVerse, ${user.name}!`);
              setTimeout(() => {
                router.replace('/');
              }, 300);
            }}
            onError={(err) => setError(err)}
          />
        </div>

        {/* Optional Collapsible: Manual Email Signup */}
        <div className="mt-5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>{showManualForm ? 'Hide manual sign-up' : 'Or register with email and password'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showManualForm ? 'rotate-180' : ''}`} />
          </button>

          {showManualForm && (
            <form onSubmit={handleSignup} className="mt-3 space-y-3 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gamer Tag / Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. CyberNinja99"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min 8 chars)
                </label>
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

              {/* Age 18+ and Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 bg-slate-100 text-purple-600 focus:ring-0"
                  />
                  <span className="text-[10px] text-slate-500">
                    I agree to the{' '}
                    <Link href="/terms" className="text-purple-600 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and Privacy Policy.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>Creating Profile...</span>
                ) : (
                  <>
                    <span>Join GameVerse</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="text-center text-xs text-slate-500 pt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-bold">
            Log in
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
