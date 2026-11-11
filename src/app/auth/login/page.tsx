'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gamepad2, Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
        return;
      }

      if (data.requires2FA) {
        setRequires2FA(true);
        setTempToken(data.tempToken);
        return;
      }

      // Success
      if (data.user?.role === 'DEVELOPER') {
        router.push('/developer');
      } else if (data.user?.role === 'ADMIN' || data.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setLoading(false);
      setError('Network error occurred. Please try again.');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFaLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: totpCode }),
      });

      const data = await res.json();
      setTwoFaLoading(false);

      if (!res.ok) {
        setError(data.error || '2FA verification failed.');
        return;
      }

      setRequires2FA(false);
      router.push('/admin');
    } catch {
      setTwoFaLoading(false);
      setError('2FA verification failed.');
    }
  };

  const loadTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <div className="w-full h-full bg-[#090D16] rounded-2xl flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <h1 className="font-heading font-black text-2xl text-white">
            Welcome to GameVerse
          </h1>
          <p className="text-xs text-gray-400">
            Log in to manage your studio, play saved favorites, or access admin QA.
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
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
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
            Sign In to Account
          </Button>
        </form>

        {/* Quick Test Account Switchers */}
        <div className="pt-4 border-t border-white/5 space-y-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">
            One-Click Test Accounts (Pass: Password123!)
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => loadTestAccount('player@gamer.com')}
              className="p-2 rounded-xl bg-black/30 hover:bg-white/5 text-gray-300 border border-white/5 text-center transition-colors"
            >
              Player
            </button>
            <button
              type="button"
              onClick={() => loadTestAccount('creator@pixelstudio.com')}
              className="p-2 rounded-xl bg-black/30 hover:bg-white/5 text-gray-300 border border-white/5 text-center transition-colors"
            >
              Creator
            </button>
            <button
              type="button"
              onClick={() => loadTestAccount('admin@gameverse.com')}
              className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-center transition-colors"
            >
              Admin (2FA)
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400">
          Don&apos;t have an account yet?{' '}
          <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Create an Account
          </Link>
        </div>
      </div>

      {/* Admin 2FA Modal */}
      <Modal
        isOpen={requires2FA}
        onClose={() => setRequires2FA(false)}
        title="Admin Two-Factor Authentication"
        description="Enter the 6-digit TOTP code generated by your authenticator app (or test code: 123456)."
      >
        <form onSubmit={handleVerify2FA} className="space-y-4">
          <Input
            label="6-Digit Security Code"
            required
            autoFocus
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            placeholder="123456"
            leftIcon={<KeyRound className="w-4 h-4" />}
          />
          <Button type="submit" variant="primary" className="w-full" isLoading={twoFaLoading}>
            Verify Code & Access Admin
          </Button>
        </form>
      </Modal>
    </div>
  );
}
