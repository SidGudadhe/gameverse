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
import GoogleSignIn from './GoogleSignIn';
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6A38EB] to-[#9D4EDD] flex items-center justify-center mx-auto shadow-md shadow-purple-600/25 mb-3">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <h2
            id="crazygames-auth-title"
            className="text-2xl font-black font-heading text-slate-900 tracking-tight"
          >
            {mode === 'LOGIN' ? 'Log in to GameVerse' : 'Join GameVerse'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {mode === 'LOGIN'
              ? 'Save your game progress, unlock payouts, and track favorites.'
              : 'Create your free gamer profile to save progress and join leaderboards.'}
          </p>
        </div>

        {/* Status Alerts */}
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

        {/* ================= OPTION 1: 1-CLICK ZERO TYPING GOOGLE SSO ================= */}
        <div className="space-y-3">
          <GoogleSignIn
            mode={mode}
            enableOneTap={false}
            onSuccess={(user) => {
              setSuccessMsg(`Welcome, ${user.name}!`);
              setTimeout(() => {
                closeAuthModal();
                router.refresh();
              }, 400);
            }}
            onError={(err) => setError(err)}
          />
        </div>

        {/* ================= OPTION 2: 1-CLICK INSTANT GAMER LOGIN ================= */}
        <div className="mt-3.5 space-y-2">
          <button
            type="button"
            disabled={loading || googleLoading}
            onClick={() => handleInstantDemoLogin('player@gamer.com')}
            className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 border border-purple-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Demo: Play as NeoGamer99 (1-Click)</span>
          </button>
        </div>

        {/* Optional Collapsible: Legacy Manual Sign-in */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>{showManualForm ? 'Hide manual sign-in' : mode === 'LOGIN' ? 'Have a legacy password? Sign in with email' : 'Or register with email and password'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showManualForm ? 'rotate-180' : ''}`} />
          </button>

          {showManualForm && (
            <div className="mt-3 animate-in fade-in duration-200">
              {mode === 'LOGIN' ? (
                <form onSubmit={handleEmailLogin} className="space-y-3">
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
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
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
                        onClick={closeAuthModal}
                        className="text-[11px] text-purple-600 hover:text-purple-700 font-medium"
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
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
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
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <span>Signing in...</span> : <span>Log In with Password</span>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gamer Tag
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. CyberNinja99"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600"
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
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600"
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

                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-[10px] text-slate-500">
                        I agree to the Terms of Service & Privacy Policy.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <span>Creating Profile...</span> : <span>Join GameVerse</span>}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="text-center text-xs text-slate-500 pt-4">
          {mode === 'LOGIN' ? (
            <>
              No account yet?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('SIGNUP')}
                className="text-purple-600 hover:text-purple-700 font-bold transition-colors cursor-pointer"
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
                className="text-purple-600 hover:text-purple-700 font-bold transition-colors cursor-pointer"
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
