'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Code, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function DeveloperLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, portal: 'DEVELOPER' }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Developer authentication failed.');
        return;
      }

      router.push('/developer');
    } catch {
      setLoading(false);
      setError('Network connection error. Please try again.');
    }
  };

  const loadTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-3xl border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Code className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Badge variant="cyan">DEVELOPER STUDIO PORTAL</Badge>
          </div>
          <h1 className="font-heading font-black text-2xl text-white">
            Creator Studio Sign In
          </h1>
          <p className="text-xs text-gray-400">
            Access your developer workspace, submit HTML5/WebGL builds, inspect telemetry and withdraw earnings.
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
            label="Studio / Developer Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="creator@pixelstudio.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="space-y-1">
            <Input
              label="Studio Password"
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
                className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full bg-cyan-600 hover:bg-cyan-500" isLoading={loading}>
            Sign In to Developer Studio
          </Button>
        </form>

        {/* Quick Test Account */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">
            One-Click Developer Test Account
          </div>
          <button
            type="button"
            onClick={() => loadTestAccount('creator@pixelstudio.com')}
            className="w-full p-2.5 rounded-xl bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs text-center transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Code className="w-4 h-4" />
            <span>Load Studio Account (creator@pixelstudio.com)</span>
          </button>
        </div>

        <div className="text-center text-xs text-gray-400 pt-1">
          New Game Studio or Indie Creator?{' '}
          <Link href="/developer/auth/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold">
            Register Studio Account
          </Link>
        </div>
      </div>
    </div>
  );
}
