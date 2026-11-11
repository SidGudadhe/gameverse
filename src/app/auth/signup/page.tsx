'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gamepad2, Code, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'PLAYER' | 'DEVELOPER'>('PLAYER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      setError('You must accept the Terms of Service and Creator Guidelines.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      if (role === 'DEVELOPER') {
        router.push('/developer');
      } else {
        router.push('/');
      }
    } catch {
      setLoading(false);
      setError('Network connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="font-heading font-black text-2xl text-white">
            Create Your Account
          </h1>
          <p className="text-xs text-gray-400">
            Join GameVerse as an instant player or an independent game creator.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setRole('PLAYER')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              role === 'PLAYER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Player / Gamer</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('DEVELOPER')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              role === 'DEVELOPER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Game Studio</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label={role === 'DEVELOPER' ? 'Studio / Developer Name' : 'Display Username'}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === 'DEVELOPER' ? 'e.g. PixelForge Studios' : 'e.g. NeoGamer99'}
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="developer@studio.com"
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
            helperText="Include letters and numbers for safety."
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
                I accept the GameVerse Terms of Service, Privacy Policy, and{' '}
                {role === 'DEVELOPER' && (
                  <span className="text-indigo-400 font-semibold">Creator Revenue Agreement (50% net)</span>
                )}
              </span>
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
            Create {role === 'DEVELOPER' ? 'Studio' : 'Player'} Account
          </Button>
        </form>

        <div className="text-center text-xs text-gray-400">
          Already registered?{' '}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
