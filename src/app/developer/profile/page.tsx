'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Globe,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Check,
  Mail,
  Gamepad2,
  Calendar,
  Lock,
  ArrowRight,
  ExternalLink,
  Save,
  RefreshCw,
  X,
  FileText,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import DeveloperLogo from '@/components/ui/DeveloperLogo';

interface AgreementData {
  agreementVersion: string;
  accountStatus: string;
  acceptedAt?: string;
}

export default function StudioProfilePage() {
  // Real Profile States (Initialized empty - populated strictly with real account data)
  const [studioName, setStudioName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [bio, setBio] = useState('');
  const [accountCreatedAt, setAccountCreatedAt] = useState('');
  const [studioVerified, setStudioVerified] = useState(true);
  const [totalTitles, setTotalTitles] = useState(0);
  const [agreement, setAgreement] = useState<AgreementData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Fetch Real Profile Data from API
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/developer/profile');
      if (res.ok) {
        const data = await res.json();
        const prof = data.profile || data.data?.profile;
        if (prof) {
          setStudioName(prof.studioName || '');
          setDisplayName(prof.displayName || '');
          setUsername(prof.username || '');
          setEmail(prof.email || data.user?.email || '');
          setWebsite(prof.website || '');
          setPortfolioUrl(prof.portfolioUrl || '');
          setBio(prof.bio || '');
          setAccountCreatedAt(prof.createdAt || data.user?.createdAt || '');
        }

        if (data.agreement || data.data?.agreement) {
          setAgreement(data.agreement || data.data?.agreement);
        }
        if (data.studioVerified !== undefined) {
          setStudioVerified(Boolean(data.studioVerified));
        }
        if (data.totalTitles !== undefined) {
          setTotalTitles(data.totalTitles);
        }
      }
    } catch (e) {
      console.error('Failed to load studio profile data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Account Deletion Status
  const fetchDeletionStatus = async () => {
    try {
      const res = await fetch('/api/developer/account/delete');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDeletionStatus({
            isDeletionScheduled: Boolean(data.isDeletionScheduled),
            deletionRequestedAt: data.deletionRequestedAt,
            scheduledDeletionAt: data.scheduledDeletionAt,
            daysRemaining: data.daysRemaining ?? 30,
          });
        }
      }
    } catch {
      // Ignore background error
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchDeletionStatus();
  }, []);

  // Save Real Studio Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioName.trim()) {
      setErrorMsg('Studio Name is required.');
      return;
    }
    if (!displayName.trim()) {
      setErrorMsg('Lead Developer / Contact Name is required.');
      return;
    }

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/developer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioName: studioName.trim(),
          displayName: displayName.trim(),
          username: username.trim(),
          website: website.trim(),
          portfolioUrl: portfolioUrl.trim(),
          bio: bio.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Studio profile updated successfully! All changes are live.');
        await fetchProfileData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to update studio profile.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving studio profile.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Account Deletion Request (30 Days Grace Period)
  const handleRequestDeletion = async () => {
    if (
      !window.confirm(
        'Are you sure you want to request developer account deletion?\n\nA 30-day grace period will begin. You can cancel this anytime within 30 days before your data and games are permanently removed.'
      )
    ) {
      return;
    }

    setDeletionLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

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
        setSuccessMsg(
          'Account deletion request submitted. You have a 30-day grace period to cancel before your account and titles are permanently purged.'
        );
      } else {
        setErrorMsg(data.error || 'Failed to request account deletion.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting deletion request.');
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
    setSuccessMsg(null);
    setErrorMsg(null);

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
        setSuccessMsg('Account deletion has been cancelled! Your developer studio is active.');
      } else {
        setErrorMsg(data.error || 'Failed to cancel account deletion.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error cancelling deletion.');
    } finally {
      setDeletionLoading(false);
    }
  };

  // Get Avatar Initials
  const getInitials = (name: string) => {
    if (!name) return 'DS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <DeveloperLogo size="lg" />
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link
                href="/developer"
                className="hover:text-slate-900 transition-colors font-medium"
              >
                Studio Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Studio Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Studio Profile & Identity</span>
              <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Verified Developer
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Public studio metadata, developer contact credentials, and publishing agreement status.
            </p>
          </div>
        </div>

        <button
          onClick={fetchProfileData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Account Deletion Active Banner */}
      {deletionStatus.isDeletionScheduled && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-950">
                Account Deletion Scheduled ({deletionStatus.daysRemaining} Days Remaining)
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                A request to delete your developer account was submitted. Your account and all uploaded titles will be
                permanently purged in <strong>{deletionStatus.daysRemaining} days</strong>. If you change your mind,
                you can cancel this request anytime before the 30-day period ends.
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

      {/* REAL STUDIO IDENTITY HERO CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Studio Dynamic Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-purple-600/20 shrink-0 tracking-wider">
            {getInitials(studioName || displayName)}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {studioName || displayName || 'Loading Studio...'}
              </h2>
              {studioVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified Studio</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-3 h-3 text-rose-600" />
                  <span>Verification Pending</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              {username && (
                <span className="font-mono font-semibold text-purple-700">@{username}</span>
              )}
              {email && (
                <span className="flex items-center gap-1 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{email}</span>
                </span>
              )}
              {accountCreatedAt && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Member since{' '}
                    {new Date(accountCreatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Real Live Stats Quick Summary */}
        <div className="flex items-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 shrink-0">
          <div className="text-center sm:text-left">
            <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Published Games</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-purple-600" />
              <span>{totalTitles}</span>
            </div>
          </div>

          <div className="text-center sm:text-left pl-4 border-l border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Agreement</div>
            <div className="text-xs font-bold text-emerald-700 font-mono mt-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{agreement ? agreement.agreementVersion : 'Active v2026.1'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN EDITABLE PROFILE FORM */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              <span>Studio Legal & Contact Information</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These details identify your studio in developer agreements, game catalog listings, and player notices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Input
                label="Studio / Company Name"
                required
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="e.g. Your Game Studio"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Public studio name displayed under your game titles.
              </span>
            </div>

            <div>
              <Input
                label="Lead Developer / Contact Name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Primary Developer Name"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Legal contact representative for publishing compliance.
              </span>
            </div>

            <div>
              <Input
                label="Studio Username / Handle (@)"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. yourstudio"
              />
              <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                Handle: @{username || 'handle'} (used in catalog links)
              </span>
            </div>

            {/* Registered Account Email (Protected) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Registered Account Email</span>
              </label>
              <div className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 flex items-center justify-between">
                <span>{email || 'Loading account email...'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Account email tied to your developer authentication and payouts.
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-600" />
              <span>Public Links & Studio Web Presence (Optional)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Input
                  label="Official Studio Website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  leftIcon={<Globe className="w-4 h-4 text-slate-400" />}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Link to your official games studio or company website.
                </span>
              </div>

              <div>
                <Input
                  label="Portfolio / GitHub Repository"
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/yourstudio"
                  leftIcon={<ExternalLink className="w-4 h-4 text-slate-400" />}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Public repository or game portfolio showcase link.
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-left pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Studio Bio / About
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a brief overview of your game studio, mission, and the HTML5/WebGL titles you build..."
                className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-xl p-3 border border-slate-200 focus:border-purple-600 focus:bg-white focus:outline-none transition-colors"
              />
              <span className="text-[11px] text-slate-400 block">
                Shown to players visiting your developer page and game details cards.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Studio Profile</span>
            </button>
          </div>
        </div>
      </form>

      {/* COMPLIANCE & LEGAL AGREEMENT CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>GameVerse Creator Agreement</span>
            </h3>
            <p className="text-xs text-slate-500">
              Your binding terms governing game distribution, Net-30 settlements, and sandbox compliance.
            </p>
          </div>
          <Link
            href="/developer/agreement"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <span>View Full Agreement</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Agreement Version</div>
            <div className="text-sm font-bold text-slate-900 mt-1 font-mono">
              {agreement?.agreementVersion || 'v1.0-2026'}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Account Status</div>
            <div className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{agreement?.accountStatus || 'ACTIVE'}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Accepted Date</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {agreement?.acceptedAt ? new Date(agreement.acceptedAt).toLocaleDateString() : 'Onboarding Complete'}
            </div>
          </div>
        </div>
      </div>

      {/* DANGER ZONE: ACCOUNT DELETION (30-DAY GRACE PERIOD) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm space-y-4">
        <div className="border-b border-rose-100 pb-3">
          <h3 className="font-bold text-base text-rose-700 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span>Danger Zone: Developer Account Deletion</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Submit a formal request to close your studio account and unpublish all catalog titles. A{' '}
            <strong className="text-slate-800">30-day grace period</strong> applies. If you do not cancel the request
            within 30 days, your account and assets will be permanently purged.
          </p>
        </div>

        {deletionStatus.isDeletionScheduled ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <div>
              <p className="font-bold text-sm">Deletion in Progress (30-Day Window)</p>
              <p className="text-slate-600 mt-0.5">
                Your studio account is queued for deletion. You have{' '}
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
                You can cancel anytime within 30 days before data is permanently purged.
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
