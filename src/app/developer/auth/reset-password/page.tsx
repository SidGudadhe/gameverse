'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DeveloperLogo from '@/components/ui/DeveloperLogo';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/developer/auth/login');
      }, 2500);
    } catch {
      setLoading(false);
      setError('Network connection error.');
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
      <div className="space-y-2 text-center">
        <DeveloperLogo size="xl" className="mx-auto shadow-lg shadow-purple-600/25 mb-2" />
        <h1 className="font-heading font-black text-2xl text-slate-900">
          Set New Studio Password
        </h1>
        <p className="text-xs text-slate-500">
          Please enter and confirm your new Developer Studio credentials.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-3 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Password Updated Successfully</h3>
          <p className="text-slate-600">
            Your studio password has been updated. Redirecting to Developer Sign In...
          </p>
          <Link
            href="/developer/auth/login"
            className="text-indigo-600 hover:underline font-semibold block pt-2"
          >
            Click here if not redirected automatically
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Studio Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-indigo-600 hover:bg-indigo-500 shadow-md"
            isLoading={loading}
          >
            Update Studio Password
          </Button>
        </form>
      )}
    </div>
  );
}

export default function DeveloperResetPasswordPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F8FAFC]">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading recovery form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
