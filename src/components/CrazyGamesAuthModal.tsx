'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GoogleSignIn from './GoogleSignIn';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [termsAgreed, setTermsAgreed] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Synchronize internal mode with context
  useEffect(() => {
    setMode(authModalMode);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  }, [authModalMode]);

  // Lock body scroll when modal is open
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
      if (e.key === 'Escape' && authModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, closeAuthModal]);

  // Password Strength Calculation for Signup Mode
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '', percent: 0 };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500 text-rose-400', percent: 25 };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500 text-amber-400', percent: 50 };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-indigo-500 text-indigo-400', percent: 75 };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500 text-emerald-400', percent: 100 };
      default:
        return { score: 1, label: 'Weak', color: 'bg-rose-500 text-rose-400', percent: 20 };
    }
  }, [password]);

  // Listen for Google OAuth popup messages
  useEffect(() => {
    const handlePopupMessage = (event: MessageEvent) => {
      if (typeof window === 'undefined') return;
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        setSession(event.data.user);
        setSuccessMsg(`Welcome, ${event.data.user.name}! Signed in with Google.`);
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
          rememberMe,
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
    if (!name.trim()) {
      setError('Please choose a gamer tag or username.');
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
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
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
          portal: 'PLAYER',
          role: 'PLAYER',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data.error || 'Registration failed. Email may already be in use.');
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crazygames-auth-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-md shadow-purple-600/30 mb-3 border border-purple-400/30">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <h2
            id="crazygames-auth-title"
            className="text-2xl font-black font-heading text-white tracking-tight"
          >
            {mode === 'LOGIN' ? 'Log in to GameVerse' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {mode === 'LOGIN'
              ? 'Save your game progress, unlock payouts, and track favorites.'
              : 'Create your free gamer profile to save progress and join leaderboards.'}
          </p>
        </div>

        {/* Status Alerts */}
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

        {/* ================= METHOD 1: OFFICIAL GOOGLE AUTHENTICATION ================= */}
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

        {/* ================= VISUAL DIVIDER "OR" ================= */}
        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            OR
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* ================= METHOD 2: DIRECT EMAIL & PASSWORD FORM ================= */}
        {mode === 'LOGIN' ? (
          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  onClick={closeAuthModal}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 select-none">Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In with Password</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gamer Tag / Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  autoComplete="nickname"
                  placeholder="e.g. CyberNinja99"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Dynamic Password Strength Indicator */}
              {password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Strength:</span>
                    <span className={`font-semibold ${passwordStrength.color.split(' ')[1]}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 1 ? passwordStrength.color.split(' ')[0] : 'bg-slate-700'
                      }`}
                      style={{ width: `${passwordStrength.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-rose-500/80'
                      : 'border-slate-700/80 focus:border-purple-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-rose-400 mt-1">Passwords do not match.</p>
              )}
            </div>

            <div className="pt-0.5">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-slate-700 text-purple-600 focus:ring-0"
                />
                <span className="text-[10px] text-slate-400">
                  I agree to the Terms of Service & Privacy Policy.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || (confirmPassword.length > 0 && password !== confirmPassword)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Profile...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>
        )}

        {/* Mode Switcher */}
        <div className="text-center text-xs text-slate-400 pt-5 mt-5 border-t border-slate-800">
          {mode === 'LOGIN' ? (
            <>
              Don&apos;t have an account yet?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('SIGNUP')}
                className="text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer"
              >
                Create Account
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
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
