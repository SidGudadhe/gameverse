'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gamepad2, Lock, Mail, AlertCircle, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

function GamerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();

  const redirectParam = searchParams.get('redirect');
  const targetDestination = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorTitle, setErrorTitle] = useState('Incorrect Credentials');
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError('');
    setShowErrorPopup(false);

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
          setError(data.error || 'Too many login attempts on the Gamer Portal. Please wait a minute before trying again.');
        } else {
          setErrorTitle('Incorrect Credentials');
          setError(data.error || 'Invalid email or password.');
        }
        setShowErrorPopup(true);
        return;
      }

      // 1. Instant synchronous session update (0ms transition)
      if (data.user) {
        setSession(data.user);
      }

      setLoading(false);

      // 2. Invalidate router cache & navigate immediately
      router.refresh();
      router.push(targetDestination);

      // 3. Fallback safety: guarantee navigation if client-side router transition lags
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/auth/login') {
          window.location.href = targetDestination;
        }
      }, 250);
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

  const handleQuickLogin = async (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
    await performLogin(testEmail, 'Password123!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      {/* Incorrect Credentials Pop-Up Notification */}
      {showErrorPopup && (
        <div
          role="alert"
          className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 border border-rose-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 flex items-start gap-3"
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

      <div className="w-full max-w-md space-y-6 bg-slate-900/90 p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Badge variant="featured">GAMER PORTAL</Badge>
          </div>
          <h1 className="font-heading font-black text-2xl text-white">
            Gamer Sign In
          </h1>
          <p className="text-xs text-gray-400">
            Sign in to continue your gaming sessions, access favorites, and view recommendations.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Gamer Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="gamer@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Sign In to Gamer Account
          </Button>
        </form>

        {/* Quick Instant Test Account */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">
            One-Click Instant Gamer Login
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickLogin('player@gamer.com')}
            className="w-full p-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 active:scale-[0.99] text-indigo-300 border border-indigo-500/30 text-xs text-center transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:border-indigo-400"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Instant Sign In (player@gamer.com)</span>
          </button>
        </div>

        <div className="text-center text-xs text-gray-400 pt-1">
          Don&apos;t have a Gamer account?{' '}
          <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Create Gamer Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function GamerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-gray-400 text-xs">
          Loading Gamer Portal...
        </div>
      }
    >
      <GamerLoginContent />
    </Suspense>
  );
}
