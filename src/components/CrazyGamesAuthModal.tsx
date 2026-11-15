'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  X,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GoogleAccountChooser, { GoogleAccount } from './GoogleAccountChooser';

export default function CrazyGamesAuthModal() {
  const router = useRouter();
  const {
    authModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    setSession,
  } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>(authModalMode || 'LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Synchronize internal mode with context
  useEffect(() => {
    setMode(authModalMode);
    setError('');
    setSuccessMsg('');
    setShowManualForm(false);
  }, [authModalMode]);

  // Lock body scroll on open
  useEffect(() => {
    if (authModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [authModalOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && authModalOpen && !showGoogleChooser) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, closeAuthModal, showGoogleChooser]);

  // Listen for Google OAuth popup messages
  useEffect(() => {
    const handlePopupMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        setSession(event.data.user);
        setSuccessMsg(`Welcome, ${event.data.user.name}! Signed in with Google.`);
        setShowGoogleChooser(false);
        setTimeout(() => {
          closeAuthModal();
          router.refresh();
        }, 350);
      }
    };

    window.addEventListener('message', handlePopupMessage);
    return () => window.removeEventListener('message', handlePopupMessage);
  }, [setSession, closeAuthModal, router]);

  if (!authModalOpen) return null;

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
        throw new Error(data.error || 'Google sign-in failed. Please try again.');
      }

      if (data.user) {
        setSession(data.user);
      }

      setGoogleLoading(false);
      setShowGoogleChooser(false);
      setSuccessMsg(`Welcome, ${data.user.name}! Signed in with Google.`);
      setTimeout(() => {
        closeAuthModal();
        router.refresh();
      }, 350);
    } catch (err: any) {
      setGoogleLoading(false);
      throw err;
    }
  };

  // Real Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          portal: 'PLAYER',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        if (res.status === 429) {
          setError(data.error || 'Too many attempts. Please wait a minute.');
        } else {
          setError(data.error || 'Invalid email or password.');
        }
        return;
      }

      if (data.user) {
        setSession(data.user);
      }

      setSuccessMsg('Welcome back! Signed in.');
      setTimeout(() => {
        closeAuthModal();
        router.refresh();
      }, 350);
    } catch {
      setLoading(false);
      setError('Network connection error. Please try again.');
    }
  };

  // Real Email/Password Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      setError('You must accept the Terms of Service to join.');
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
          role: 'PLAYER',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data.error || 'Registration failed.');
        return;
      }

      if (data.user) {
        setSession(data.user);
      }

      setSuccessMsg('Gamer account created! Enjoy playing.');
      setTimeout(() => {
        closeAuthModal();
        router.refresh();
      }, 350);
    } catch {
      setLoading(false);
      setError('Network connection error. Please try again.');
    }
  };

  // Instant 1-Click Demo Login
  const handleInstantDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoEmail,
          password: 'Password123!',
          portal: 'PLAYER',
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setSession(data.user);
        setSuccessMsg(`Welcome, ${data.user.name}!`);
        setTimeout(() => {
          closeAuthModal();
          router.refresh();
        }, 350);
      } else {
        setLoading(false);
        setError(data.error || 'Instant login failed.');
      }
    } catch {
      setLoading(false);
      setError('Connection error.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crazygames-auth-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[#13151f] border border-purple-500/25 rounded-2xl shadow-2xl shadow-purple-950/60 p-6 sm:p-8 relative overflow-hidden text-gray-100 animate-in zoom-in-95 duration-200"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6A38EB] to-[#9D4EDD] flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30 mb-3">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <h2
            id="crazygames-auth-title"
            className="text-2xl font-black font-heading text-white tracking-tight"
          >
            {mode === 'LOGIN' ? 'Log in to GameVerse' : 'Join GameVerse'}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            {mode === 'LOGIN'
              ? 'Save your game progress, unlock payouts, and track favorites.'
              : 'Create your free gamer profile to save progress and join leaderboards.'}
          </p>
        </div>

        {/* Status Alerts */}
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

        {/* ================= OPTION 2: 1-CLICK INSTANT GAMER LOGIN ================= */}
        <div className="mt-3.5 space-y-2">
          <button
            type="button"
            disabled={loading || googleLoading}
            onClick={() => handleInstantDemoLogin('player@gamer.com')}
            className="w-full py-2.5 px-3 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 hover:text-purple-200 border border-purple-500/25 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Demo: Play as NeoGamer99 (1-Click)</span>
          </button>
        </div>

        {/* Optional Collapsible: Legacy Manual Sign-in (Hidden by default to avoid clutter) */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="w-full text-center text-xs text-gray-500 hover:text-gray-300 py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>{showManualForm ? 'Hide manual sign-in' : mode === 'LOGIN' ? 'Have a legacy password? Sign in with email' : 'Or register with email and password'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showManualForm ? 'rotate-180' : ''}`} />
          </button>

          {showManualForm && (
            <div className="mt-3 animate-in fade-in duration-200">
              {mode === 'LOGIN' ? (
                <form onSubmit={handleEmailLogin} className="space-y-3">
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
                        className="w-full bg-[#1b1e2b] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
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
                        onClick={closeAuthModal}
                        className="text-[11px] text-purple-400 hover:text-purple-300"
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
                        className="w-full bg-[#1b1e2b] border border-white/10 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
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
              ) : (
                <form onSubmit={handleSignup} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Gamer Tag
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. CyberNinja99"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#1b1e2b] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

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
                        className="w-full bg-[#1b1e2b] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#1b1e2b] border border-white/10 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
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

                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        className="mt-0.5 rounded border-white/20 bg-black/40 text-purple-600 focus:ring-0"
                      />
                      <span className="text-[10px] text-gray-400">
                        I agree to the Terms of Service & Privacy Policy.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <span>Creating Profile...</span> : <span>Join GameVerse</span>}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="text-center text-xs text-gray-400 pt-4">
          {mode === 'LOGIN' ? (
            <>
              No account yet?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('SIGNUP')}
                className="text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer"
              >
                Join now
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('LOGIN')}
                className="text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer"
              >
                Log in
              </button>
            </>
          )}
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
