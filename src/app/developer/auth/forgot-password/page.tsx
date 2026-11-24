'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DeveloperLogo from '@/components/ui/DeveloperLogo';

export default function DeveloperForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);
      setSubmitted(true);
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F8FAFC]">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/developer/auth/login"
            className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Studio Sign In</span>
          </Link>
        </div>

        <div className="space-y-2 text-center">
          <DeveloperLogo size="xl" className="mx-auto shadow-lg shadow-purple-600/25 mb-2" />
          <h1 className="font-heading font-black text-2xl text-slate-900">
            Reset Studio Password
          </h1>
          <p className="text-xs text-slate-500">
            Enter your registered developer account email to receive studio recovery instructions.
          </p>
        </div>

        {submitted ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Password Recovery Instructions Dispatched</span>
            </div>
            <p className="text-slate-600">
              If an active Developer Studio account exists for <strong>{email}</strong>, a secure password reset link has been dispatched.
            </p>

            {resetToken && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Studio Recovery Simulation Link:
                </span>
                <Link
                  href={`/developer/auth/reset-password?token=${resetToken}`}
                  className="text-indigo-600 hover:underline font-mono text-[11px] block truncate"
                >
                  /developer/auth/reset-password?token={resetToken}
                </Link>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/developer/auth/login"
                className="text-indigo-600 hover:underline font-semibold block text-center"
              >
                Return to Studio Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Developer Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="studio@developer.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full bg-indigo-600 hover:bg-indigo-500 shadow-md"
              isLoading={loading}
            >
              Send Studio Recovery Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
