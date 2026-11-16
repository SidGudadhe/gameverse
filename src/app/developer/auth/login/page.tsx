'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Code, Lock, Mail, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

export default function DeveloperLoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorTitle, setErrorTitle] = useState('Incorrect Credentials');
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowErrorPopup(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, portal: 'DEVELOPER' }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (res.status === 429) {
          setErrorTitle('Rate Limit Exceeded');
          setError(data.error || 'Too many login attempts on the Developer Studio. Please wait a minute before trying again.');
        } else {
          setErrorTitle('Incorrect Credentials');
          setError(data.error || 'Invalid email or password.');
        }
        setShowErrorPopup(true);
        return;
      }

      if (data.user) {
        setSession(data.user);
      }

      router.refresh();
      router.push('/developer');

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/developer/auth')) {
          window.location.href = '/developer';
        }
      }, 250);
    } catch {
      setLoading(false);
      setErrorTitle('Connection Error');
      setError('Network connection error. Please try again.');
      setShowErrorPopup(true);
    }
  };

  const loadTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative bg-[#F8FAFC]">
      {/* Incorrect Credentials Pop-Up Notification */}
      {showErrorPopup && (
        <div
          role="alert"
          className="fixed top-6 right-6 z-50 max-w-sm w-full bg-white border border-rose-200 rounded-2xl p-4 shadow-xl animate-in fade-in slide-in-from-top-4 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900">{errorTitle}</h4>
            <p className="text-xs text-rose-700 mt-0.5">{error || 'Invalid email or password.'}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowErrorPopup(false)}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
            <Code className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Badge variant="cyan">DEVELOPER STUDIO PORTAL</Badge>
          </div>
          <h1 className="font-heading font-black text-2xl text-slate-900">
            Creator Studio Sign In
          </h1>
          <p className="text-xs text-slate-500">
            Access your developer workspace, submit HTML5/WebGL builds, inspect telemetry and withdraw earnings.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
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
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-500" isLoading={loading}>
            Sign In to Developer Studio
          </Button>
        </form>

        {/* Quick Test Account */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
            One-Click Developer Test Account
          </div>
          <button
            type="button"
            onClick={() => loadTestAccount('creator@pixelstudio.com')}
            className="w-full p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs text-center transition-colors font-medium flex items-center justify-center gap-2 cursor-pointer"
          >
            <Code className="w-4 h-4" />
            <span>Load Studio Account (creator@pixelstudio.com)</span>
          </button>
        </div>

        <div className="text-center text-xs text-slate-500 pt-1">
          New Game Studio or Indie Creator?{' '}
          <Link href="/developer/auth/signup" className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Register Studio Account
          </Link>
        </div>
      </div>
    </div>
  );
}
