'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gamepad2, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AuthTransitionSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';

export default function GamerSignupPage() {
  const router = useRouter();
  const { setSession, isAuthenticated, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to home and prefetch
  useEffect(() => {
    try {
      router.prefetch('/');
    } catch {}
    if (isAuthenticated && !authLoading) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading, router]);

  if (loading || (isAuthenticated && !authLoading)) {
    return (
      <AuthTransitionSkeleton
        title="Creating Your Gamer Account..."
        subtitle="Setting up cloud save profile, favorites, and instant play catalog..."
      />
    );
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      setError('You must accept the Gamer Terms of Service & Fair Play Agreement.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, portal: 'PLAYER', role: 'PLAYER' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data.error || 'Gamer registration failed.');
        return;
      }

      if (data.user) {
        setSession(data.user);
      }

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

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-slate-900/90 p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Badge variant="featured">GAMER PORTAL</Badge>
          </div>
          <h1 className="font-heading font-black text-2xl text-white">
            Create Gamer Account
          </h1>
          <p className="text-xs text-gray-400">
            Play 1,000+ instant games, save cloud favorites, earn badges & track playtime.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label="Gamer Username"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CyberNinja99"
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="gamer@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Password (min 8 characters)"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            helperText="Must be at least 8 characters long."
          />

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-black/40 text-indigo-600 focus:ring-0"
              />
              <span className="text-[11px] text-gray-300 leading-relaxed">
                I accept the GameVerse Gamer Terms of Service and Privacy Policy.
              </span>
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Create Gamer Account
          </Button>
        </form>

        <div className="text-center text-xs text-gray-400 pt-2 border-t border-white/5">
          Already registered?{' '}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Gamer Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
