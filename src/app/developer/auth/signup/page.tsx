'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Code, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

export default function DeveloperSignupPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [engine, setEngine] = useState('Unity WebGL');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      setError('You must accept the GameVerse Creator Terms & Monetization Agreement.');
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
          portal: 'DEVELOPER',
          role: 'DEVELOPER',
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Developer studio registration failed.');
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
      setError('Network connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F8FAFC]">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
            <Code className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Badge variant="cyan">DEVELOPER STUDIO PORTAL</Badge>
          </div>
          <h1 className="font-heading font-black text-2xl text-slate-900">
            Register Game Studio
          </h1>
          <p className="text-xs text-slate-500">
            Join GameVerse Creator Network. Upload ZIP games, reach millions of gamers, and earn 70% ad revenue.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label="Studio or Creator Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. PixelForge Studios"
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Studio Business Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="creator@pixelforge.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Primary Game Engine
            </label>
            <div className="relative">
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors shadow-xs"
              >
                <option value="Unity WebGL" className="bg-white text-slate-800">Unity WebGL (Wasm)</option>
                <option value="Godot Engine" className="bg-white text-slate-800">Godot 4.x Web</option>
                <option value="Phaser 3" className="bg-white text-slate-800">Phaser 3 / PixiJS</option>
                <option value="Custom HTML5" className="bg-white text-slate-800">Custom HTML5 / Vanilla Canvas</option>
                <option value="PlayCanvas" className="bg-white text-slate-800">PlayCanvas</option>
              </select>
            </div>
          </div>

          <Input
            label="Studio Password (min 8 characters)"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            helperText="Include letters and numbers for secure payouts."
          />

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-0"
              />
              <span className="text-[11px] text-slate-600 leading-relaxed">
                I accept the GameVerse Creator Terms, Sandbox Security Rules, and{' '}
                <span className="text-indigo-600 font-semibold">Creator Revenue Agreement (70% net revenue split)</span>.
              </span>
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-500" isLoading={loading}>
            Create Developer Studio Account
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-1">
          Already registered as a Developer?{' '}
          <Link href="/developer/auth/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Studio Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
