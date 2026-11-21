'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  User,
  Heart,
  History,
  Sparkles,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Gamepad2,
  Coins,
  Upload,
  Camera,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';

interface ProfileData {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  favoriteGenre?: string;
  createdAt?: string;
}

interface ProfileStats {
  favoritesCount: number;
  gamesPlayedCount: number;
}

const GENRES = [
  'Action',
  'Arcade',
  'Puzzle',
  'Racing',
  'Strategy',
  'Sports',
  'RPG',
  'Casual',
  'Adventure',
];

export default function PlayerMyProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ favoritesCount: 0, gamesPlayedCount: 0 });
  const [loading, setLoading] = useState(true);

  // Form edit states (Essential fields only)
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Gallery import ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageProcessing, setImageProcessing] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/player/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setDisplayName(data.profile.displayName || user?.name || '');
          setUsername(data.profile.username || '');
          setFavoriteGenre(data.profile.favoriteGenre || 'Arcade');
          setAvatarUrl(data.profile.avatarUrl || '');
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // Handle Photo Import from Device Gallery / File Explorer
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('Please select a valid image file (PNG, JPG, WEBP, or GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Selected image is too large. Please select an image under 5MB.');
      return;
    }

    setImageProcessing(true);
    setSaveError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize and resize to high-resolution 320x320 square avatar using HTML5 Canvas
        const canvas = document.createElement('canvas');
        const size = 320;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Center crop calculation
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(optimizedDataUrl);
        } else {
          // Fallback to raw base64 if canvas is unavailable
          setAvatarUrl(event.target?.result as string);
        }
        setImageProcessing(false);
      };
      img.onerror = () => {
        setSaveError('Failed to read image file. Please try another photo.');
        setImageProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch('/api/player/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          username,
          favoriteGenre,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfile(data.profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (loading && isAuthenticated)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-white rounded-3xl border border-slate-200 shadow-xs" />
          <div className="h-96 bg-white rounded-3xl border border-slate-200 shadow-xs" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={User}
          title="Sign In to Manage Your Profile"
          description="Create your unique gamer tag, track your gameplay stats, save favorite games, and configure your payouts."
          actionLabel="Sign In as Gamer"
          onAction={() => {
            window.location.href = '/auth/login';
          }}
        />
        <div className="text-center mt-4">
          <Link
            href="/auth/signup"
            className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            Don't have an account? Sign up free
          </Link>
        </div>
      </div>
    );
  }

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : '2026';

  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'gamer'}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/5 via-cyan-400/5 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          {/* Avatar preview */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-tr from-indigo-500 via-cyan-400 to-emerald-400 shadow-sm shrink-0">
            <img
              src={avatarUrl || defaultAvatar}
              alt={displayName || 'Player Avatar'}
              className="w-full h-full object-cover rounded-[14px] bg-slate-100"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute('src', defaultAvatar);
              }}
            />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
                {displayName || user?.name || 'Player'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Shield className="w-3 h-3 text-indigo-600" />
                Gamer
              </span>
            </div>

            <p className="text-sm font-mono text-cyan-700 font-semibold">@{username || 'player'}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Joined {joinDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-600" />
                Favorite Genre: <strong className="text-slate-800 ml-1">{favoriteGenre || 'Arcade'}</strong>
              </span>
              {username && (
                <Link
                  href={`/player/@${username}`}
                  target="_blank"
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 underline underline-offset-2 font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Public Profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <Link
            href="/player/favorites"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-slate-600">Favorites</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.favoritesCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Games saved &rarr;</div>
          </Link>

          <Link
            href="/player/history"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-slate-600">Play History</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.gamesPlayedCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Games played &rarr;</div>
          </Link>

          <Link
            href="/player/payouts"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-slate-600">Gaming Payouts</span>
            </div>
            <div className="text-base font-bold text-emerald-700 mt-1">Active</div>
            <div className="text-[10px] text-slate-500 mt-0.5">View & Withdraw &rarr;</div>
          </Link>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span className="text-xs text-slate-600">Favorite Genre</span>
            </div>
            <div className="text-base font-bold text-cyan-800 mt-1 truncate">
              {favoriteGenre || 'Arcade'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Personal taste base</div>
          </div>
        </div>
      </div>

      {/* Edit Profile Section (Essential Fields Only) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Edit Gamer Profile</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Customize your avatar, display name, handle, and favorite genre.
          </p>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile changes saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Picture (Gallery Import) */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Profile Picture (Gallery Import)
            </label>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Photo Preview */}
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-200 bg-white flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src={avatarUrl || defaultAvatar}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
                {imageProcessing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Gallery Upload Controls */}
              <div className="space-y-3 flex-1 text-center sm:text-left">
                {/* Hidden native file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageProcessing}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import from Gallery / Device</span>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Choose any photo from your phone or device gallery (PNG, JPG, WEBP - Max 5MB). Images are automatically optimized and cropped for your gamer profile avatar.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. MasterGamer"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Gamer Handle */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
              >
                Gamer Handle (@username)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  placeholder="gamer_tag"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono text-cyan-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Letters, numbers, underscores only. Used for your public profile URL.
              </p>
            </div>
          </div>

          {/* Favorite Genre */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Favorite Game Genre
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setFavoriteGenre(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    favoriteGenre === g
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-300 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || imageProcessing}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
