'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, User, AlertCircle, KeyRound, Gamepad2, Code, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function AdminSignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecurityKey, setAdminSecurityKey] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      setError('You must accept the Administrator Confidentiality & Security Agreement.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          portal: 'ADMIN',
          role: 'ADMIN',
          adminSecurityKey,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Admin registration failed.');
        return;
      }

      router.push('/admin');
    } catch {
      setLoading(false);
      setError('Network connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-3xl border border-rose-500/30 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Badge variant="danger">ADMIN OPERATIONS SUITE</Badge>
          </div>
          <h1 className="font-heading font-black text-2xl text-white">
            Staff Onboarding
          </h1>
          <p className="text-xs text-gray-400">
            Restricted to GameVerse Staff, Security Auditors & QA Operators. Master Security Key required.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label="Staff Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Vance"
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Official Staff Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@gameverse.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Admin Authorization Security Key"
            type="password"
            required
            value={adminSecurityKey}
            onChange={(e) => setAdminSecurityKey(e.target.value)}
            placeholder="Enter Master Security Key (e.g. gv-admin-ops-2026)"
            leftIcon={<KeyRound className="w-4 h-4" />}
            helperText="Authorized staff key provided by platform operations."
          />

          <Input
            label="Password (min 8 characters)"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-black/40 text-rose-600 focus:ring-0"
              />
              <span className="text-[11px] text-gray-300 leading-relaxed">
                I accept the Administrator Confidentiality, Security Audit Policies & Access Controls.
              </span>
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full bg-rose-600 hover:bg-rose-500" isLoading={loading}>
            Register Staff Account
          </Button>
        </form>

        <div className="text-center text-xs text-gray-400 pt-1 space-y-3">
          <div>
            Already have Staff Credentials?{' '}
            <Link href="/admin/auth/login" className="text-rose-400 hover:text-rose-300 font-semibold">
              Admin Sign In
            </Link>
          </div>

          {/* Cross portal links */}
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-[11px] text-gray-400 space-y-2">
            <div className="font-semibold text-gray-300">Not GameVerse Staff?</div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href="/auth/signup"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-900/40 transition-colors"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Gamer Registration</span>
              </Link>
              <Link
                href="/developer/auth/signup"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-cyan-950/40 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-900/40 transition-colors"
              >
                <Code className="w-3.5 h-3.5" />
                <span>Studio Registration</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
