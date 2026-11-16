'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing email verification token.');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage('Your email address has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed or token expired.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error while verifying email.');
      });
  }, [token]);

  return (
    <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center">
      {status === 'loading' && (
        <div className="space-y-4 py-8 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
            <Mail className="w-7 h-7" />
          </div>
          <div className="h-6 w-44 rounded-xl bg-slate-200 mx-auto" />
          <div className="h-3 w-64 rounded bg-slate-100 mx-auto" />
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4 py-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-xl text-slate-900">Email Verified!</h2>
          <p className="text-xs text-slate-600">{message}</p>
          <div className="pt-2">
            <Link href="/auth/login">
              <Button variant="primary" className="w-full">
                Proceed to Login
              </Button>
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4 py-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-xl text-slate-900">Verification Failed</h2>
          <p className="text-xs text-rose-600">{message}</p>
          <div className="pt-2">
            <Link href="/auth/login">
              <Button variant="secondary" className="w-full">
                Return to Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-slate-400">Verifying session...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
