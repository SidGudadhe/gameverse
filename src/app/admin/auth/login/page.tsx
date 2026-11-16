'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, AlertCircle, KeyRound, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorTitle, setErrorTitle] = useState('Incorrect Credentials');
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowErrorPopup(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, portal: 'ADMIN' }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (res.status === 429) {
          setErrorTitle('Rate Limit Exceeded');
          setError(data.error || 'Too many login attempts on the Admin Operations Suite. Please wait a minute before trying again.');
        } else {
          setErrorTitle('Incorrect Credentials');
          setError(data.error || 'Invalid email or password.');
        }
        setShowErrorPopup(true);
        return;
      }

      if (data.requires2FA) {
        setRequires2FA(true);
        setTempToken(data.tempToken);
        return;
      }

      if (data.user) {
        setSession(data.user);
      }

      router.refresh();
      router.push('/admin');

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/auth')) {
          window.location.href = '/admin';
        }
      }, 250);
    } catch {
      setLoading(false);
      setErrorTitle('Connection Error');
      setError('Network connection error. Please try again.');
      setShowErrorPopup(true);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFaLoading(true);
    setError('');
    setShowErrorPopup(false);

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
        setShowErrorPopup(true);
        return;
      }

      setRequires2FA(false);
      if (data.user) {
        setSession(data.user);
      }

      router.refresh();
      router.push('/admin');

      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/auth')) {
          window.location.href = '/admin';
        }
      }, 250);
    } catch {
      setTwoFaLoading(false);
      setError('2FA verification failed.');
      setShowErrorPopup(true);
    }
  };

  const loadTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      {/* Incorrect Credentials Pop-Up Notification */}
      {showErrorPopup && (
        <div
          role="alert"
          className="fixed top-6 right-6 z-50 max-w-sm w-full bg-white border border-rose-200 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 flex items-start gap-3"
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
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Badge variant="danger">ADMIN OPERATIONS SUITE</Badge>
          </div>
          <h1 className="font-heading font-black text-2xl text-slate-900">
            Staff & QA Sign In
          </h1>
          <p className="text-xs text-slate-500">
            Internal administrative command center. Security audit logging is active for all sign-in attempts.
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
            label="Staff Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@gameverse.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="space-y-1">
            <Input
              label="Staff Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-xs" isLoading={loading}>
            Sign In to Admin Console
          </Button>
        </form>

        {/* Quick Test Account */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
            One-Click Admin Test Account
          </div>
          <button
            type="button"
            onClick={() => loadTestAccount('admin@gameverse.com')}
            className="w-full p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs text-center transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Load Admin Account (admin@gameverse.com)</span>
          </button>
        </div>

        <div className="text-center text-xs text-slate-500 pt-1">
          Need Staff Access?{' '}
          <Link href="/admin/auth/signup" className="text-rose-600 hover:text-rose-700 font-semibold">
            Register with Security Key
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
          <Button type="submit" variant="primary" className="w-full bg-rose-600 hover:bg-rose-500" isLoading={twoFaLoading}>
            Verify Code & Access Admin
          </Button>
        </form>
      </Modal>
    </div>
  );
}
