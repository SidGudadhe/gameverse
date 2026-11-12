'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gamepad2, Lock, Mail, ArrowRight, AlertCircle, Code, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function GamerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portalMismatch, setPortalMismatch] = useState<{
    role: string;
    redirectUrl: string;
    message: string;
  } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPortalMismatch(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, portal: 'PLAYER' }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (data.portalMismatch) {
          setPortalMismatch({
            role: data.portalMismatch,
            redirectUrl: data.redirectUrl || (data.portalMismatch === 'DEVELOPER' ? '/developer/auth/login' : '/admin/auth/login'),
            message: data.error,
          });
        } else {
          setError(data.error || 'Authentication failed.');
        }
        return;
      }

      router.push('/');
    } catch {
      setLoading(false);
      setError('Network error occurred. Please try again.');
    }
  };

  const loadTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

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

        {portalMismatch && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-start gap-2.5 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{portalMismatch.message}</span>
            </div>
            <Link href={portalMismatch.redirectUrl}>
              <Button variant="primary" className="w-full bg-amber-600 hover:bg-amber-500 text-xs py-2 flex items-center justify-center gap-2">
                <span>Go to {portalMismatch.role === 'DEVELOPER' ? 'Developer Studio Portal' : 'Admin Ops Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}

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

        {/* Quick Test Account */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">
            One-Click Gamer Test Account
          </div>
          <button
            type="button"
            onClick={() => loadTestAccount('player@gamer.com')}
            className="w-full p-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs text-center transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Load Player Account (player@gamer.com)</span>
          </button>
        </div>

        <div className="text-center text-xs text-gray-400 pt-1 space-y-3">
          <div>
            Don&apos;t have a Gamer account?{' '}
            <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Create Gamer Account
            </Link>
          </div>

          {/* Portal Switcher Guidance */}
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-[11px] text-gray-400 space-y-2">
            <div className="font-semibold text-gray-300">Are you a Game Creator or Admin?</div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href="/developer/auth/login"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-cyan-950/40 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-900/40 transition-colors"
              >
                <Code className="w-3.5 h-3.5" />
                <span>Developer Studio Login</span>
              </Link>
              <Link
                href="/admin/auth/login"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-500/20 hover:bg-rose-900/40 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Ops Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
