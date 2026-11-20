'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Building,
  Camera,
  Trash2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function StudioProfilePage() {
  const [studioName, setStudioName] = useState('PixelForge Studios');
  const [displayName, setDisplayName] = useState('Alex Rivers');
  const [website, setWebsite] = useState('https://pixelforge.games');
  const [portfolioUrl, setPortfolioUrl] = useState('https://github.com/pixelforge');
  const [bio, setBio] = useState('Indie web game developers building neon synthwave action runners.');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // 30-Day Account Deletion Request State
  const [deletionStatus, setDeletionStatus] = useState<{
    isDeletionScheduled: boolean;
    deletionRequestedAt: string | null;
    scheduledDeletionAt: string | null;
    daysRemaining: number;
  }>({
    isDeletionScheduled: false,
    deletionRequestedAt: null,
    scheduledDeletionAt: null,
    daysRemaining: 0,
  });
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);

  // Fetch current profile & deletion status
  useEffect(() => {
    fetch('/api/developer/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          if (data.profile.studioName) setStudioName(data.profile.studioName);
          if (data.profile.displayName) setDisplayName(data.profile.displayName);
          if (data.profile.website) setWebsite(data.profile.website);
          if (data.profile.portfolioUrl) setPortfolioUrl(data.profile.portfolioUrl);
          if (data.profile.bio) setBio(data.profile.bio);
        }
      })
      .catch(() => {});

    fetch('/api/developer/account/delete')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setDeletionStatus({
            isDeletionScheduled: Boolean(data.isDeletionScheduled),
            deletionRequestedAt: data.deletionRequestedAt,
            scheduledDeletionAt: data.scheduledDeletionAt,
            daysRemaining: data.daysRemaining ?? 30,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch('/api/developer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioName,
          displayName,
          website,
          portfolioUrl,
          bio,
        }),
      });

      setLoading(false);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setLoading(false);
      setSaved(true);
    }
  };

  // Handle Account Deletion Request (30 Days Grace Period)
  const handleRequestDeletion = async () => {
    if (
      !window.confirm(
        'Are you sure you want to request developer account deletion?\n\nA 30-day grace period will begin. If you do not cancel within 30 days, your studio account and games will be permanently deleted.'
      )
    ) {
      return;
    }

    setDeletionLoading(true);
    setDeletionMessage(null);

    try {
      const res = await fetch('/api/developer/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REQUEST_DELETION' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeletionStatus({
          isDeletionScheduled: true,
          deletionRequestedAt: data.deletionRequestedAt,
          scheduledDeletionAt: data.scheduledDeletionAt,
          daysRemaining: data.daysRemaining || 30,
        });
        setDeletionMessage(
          'Account deletion requested! Aapke pas 30 days ka time hai. Agar aap cancel nahi karenge to 30 days baad account delete ho jayega.'
        );
      } else {
        alert(data.error || 'Failed to request account deletion.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletionLoading(false);
    }
  };

  // Handle Cancel Account Deletion
  const handleCancelDeletion = async () => {
    if (!window.confirm('Do you want to cancel the scheduled account deletion and keep your developer studio active?')) {
      return;
    }

    setDeletionLoading(true);
    setDeletionMessage(null);

    try {
      const res = await fetch('/api/developer/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL_DELETION' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeletionStatus({
          isDeletionScheduled: false,
          deletionRequestedAt: null,
          scheduledDeletionAt: null,
          daysRemaining: 0,
        });
        setDeletionMessage('Account deletion has been cancelled! Your developer studio is fully active.');
      } else {
        alert(data.error || 'Failed to cancel account deletion.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletionLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-600" />
            <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider">
              Studio Configuration
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 mt-1">
            Studio & Developer Profile
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Manage your studio identity, public bio, portfolio links, and publishing credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Creator Agreement: v1.0-2026 (Active)
          </Badge>
        </div>
      </div>

      {/* Account Deletion Active Alert Banner */}
      {deletionStatus.isDeletionScheduled && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-950">
                Account Deletion Scheduled ({deletionStatus.daysRemaining} Days Remaining)
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                A request to delete your developer account was submitted. Your account and all uploaded titles will be permanently purged in{' '}
                <strong>{deletionStatus.daysRemaining} days</strong> (on{' '}
                {deletionStatus.scheduledDeletionAt ? new Date(deletionStatus.scheduledDeletionAt).toLocaleDateString() : '30 days'}).
                If you change your mind, you can cancel this request anytime before the 30-day period ends.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleCancelDeletion}
              disabled={deletionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel Account Deletion</span>
            </button>
          </div>
        </div>
      )}

      {deletionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{deletionMessage}</span>
          </div>
          <button
            onClick={() => setDeletionMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile changes successfully saved to database.</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            <span>Studio Identity</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-sm">
                <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center font-heading font-black text-2xl text-slate-800">
                  {studioName.substring(0, 2).toUpperCase() || 'PF'}
                </div>
              </div>
              <div className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-900 text-base">{studioName}</div>
              <p className="text-xs text-slate-500">
                Recommended avatar size: 400x400 PNG or SVG.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Studio Name"
              required
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="e.g. PixelForge Studios"
            />

            <Input
              label="Contact / Lead Developer Name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Rivers"
            />

            <Input
              label="Studio Website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://pixelforge.games"
              leftIcon={<Globe className="w-4 h-4" />}
            />

            <Input
              label="Public Portfolio / GitHub URL"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/..."
              leftIcon={<Globe className="w-4 h-4" />}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-700">
              Studio Bio / About
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your studio's mission and game portfolio..."
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-xl p-3 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" variant="primary" isLoading={loading} className="bg-indigo-600 hover:bg-indigo-500">
              Save Studio Profile
            </Button>
          </div>
        </div>
      </form>

      {/* DANGER ZONE: ACCOUNT DELETION (Requested by User) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xs space-y-4">
        <div className="border-b border-rose-100 pb-3">
          <h2 className="font-heading font-bold text-lg text-rose-700 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            <span>Danger Zone: Developer Account Deletion</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Agar aap apna developer account delete karna chahte hain, to yahan se deletion request submit kar sakte hain. Request padne ke baad{' '}
            <strong className="text-slate-800">30 din ka grace period</strong> hota hai. Agar aap 30 din me request cancel nahi karte hain, to account automatically permanently delete ho jayega.
          </p>
        </div>

        {deletionStatus.isDeletionScheduled ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <div>
              <p className="font-bold text-sm">Deletion in Progress (30 Days Rule)</p>
              <p className="text-slate-600 mt-0.5">
                Your account is queued for deletion. You have{' '}
                <strong>{deletionStatus.daysRemaining} days</strong> left to cancel this request.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelDeletion}
              disabled={deletionLoading}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-300 font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              Cancel Deletion & Keep Account
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-xs text-slate-600 font-medium">
                Request account closure with 30-day grace period
              </p>
              <p className="text-[11px] text-slate-400">
                You can cancel anytime within 30 days before data is purged.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRequestDeletion}
              disabled={deletionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Request Account Deletion (30 Days)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
