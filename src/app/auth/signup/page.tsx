'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
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
  ShieldCheck,
} from 'lucide-react';
import { AuthTransitionSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import GoogleSignIn from '@/components/GoogleSignIn';

function PlayerSignupContent() {
  const router = useRouter();
  const { setSession, isAuthenticated, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    try {
      router.prefetch('/');
    } catch {}
    if (isAuthenticated && !authLoading) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Strength Calculation
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
        setSuccessMsg(`Welcome to GameVerse, ${event.data.user.name}! Account registered with Google.`);
        router.replace('/');
      }
    };

    window.addEventListener('message', handlePopupMessage);
    return () => window.removeEventListener('message', handlePopupMessage);
  }, [setSession, router]);

  // Method 2: Direct Email + Password Registration
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please choose a gamer tag or username.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid email address.');
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
      setError('You must accept the Terms of Service to create an account.');
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
        setError(data.error || 'Registration failed. This email may already be registered.');
        return;
      }

      if (data.user) {
        setSession(data.user);
      }

      setSuccessMsg('Gamer account created successfully! Launching games...');
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

  if (loading || (isAuthenticated && !authLoading)) {
    return (
      <AuthTransitionSkeleton
        title="Creating Your Gamer Profile..."
        subtitle="Setting up cloud save vault, instant play credentials, and catalog..."
      />
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Subtle Ambient Gaming Gradients */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Main Registration Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl shadow-2xl p-8 relative overflow-hidden backdrop-blur-xl z-10">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30 mb-3 border border-purple-400/30">
            <Gamepad2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black font-heading text-white tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Join GameVerse to save your game progress, unlock achievements, and join leaderboards.
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

        {/* ================= VISUAL DIVIDER "OR" ================= */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-slate-700/80 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            OR
          </span>
          <div className="border-t border-slate-700/80 w-full" />
        </div>

        {/* ================= METHOD 2: DIRECT EMAIL & PASSWORD REGISTRATION ================= */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Gamer Tag / Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Email Address */}
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

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password (min. 8 characters)
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

            {/* Dynamic Password Strength Indicator */}
            {password && (
              <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Password Strength:</span>
                  <span className={`font-semibold ${passwordStrength.color.split(' ')[1]}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-rose-500/80 focus:border-rose-500'
                    : 'border-slate-700/80 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
            )}
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-slate-400 leading-snug">
                I agree to the{' '}
                <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline">
                  Terms of Service
                </Link>{' '}
                and Privacy Policy.
              </span>
            </label>
          </div>

          {/* Create Account Button */}
          <button
            type="submit"
            disabled={loading || (confirmPassword.length > 0 && password !== confirmPassword)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Profile...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link to Existing Sign-in Page */}
        <div className="text-center text-xs text-slate-400 pt-6 mt-6 border-t border-slate-800">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-purple-400 hover:text-purple-300 font-bold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CrazyGamesSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-slate-400 text-xs bg-slate-950">
          Loading GameVerse Registration...
        </div>
      }
    >
      <PlayerSignupContent />
    </Suspense>
  );
}
