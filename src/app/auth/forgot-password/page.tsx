'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/auth/login" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

        <div className="space-y-1.5">
          <h1 className="font-heading font-black text-2xl text-white">
            Reset Password
          </h1>
          <p className="text-xs text-gray-400">
            Enter your registered email address to receive password recovery instructions.
          </p>
        </div>

        {submitted ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Password Recovery Dispatched</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              If an account with <span className="font-semibold text-white">{email}</span> exists, you will receive recovery instructions.
            </p>
            {resetToken && (
              <div className="bg-black/40 p-3 rounded-xl border border-white/10 font-mono text-[11px] text-cyan-300 break-all">
                Test Token: {resetToken}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              Send Recovery Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
