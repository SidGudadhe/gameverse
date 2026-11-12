'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Heart,
  History,
  Sparkles,
  ArrowLeft,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Gamepad2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';

interface ProfileData {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  favoriteGenre?: string;
  createdAt?: string;
}

interface ProfileStats {
  favoritesCount: number;
  gamesPlayedCount: number;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
];

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

  // Form edit states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
          setBio(data.profile.bio || '');
          setFavoriteGenre(data.profile.favoriteGenre || 'Arcade');
          setAvatarUrl(data.profile.avatarUrl || PRESET_AVATARS[0]);
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
          bio,
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
          <div className="h-8 w-48 bg-white/5 rounded-xl" />
          <div className="h-64 bg-surface rounded-3xl border border-white/5" />
          <div className="h-96 bg-surface rounded-3xl border border-white/5" />
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
          description="Create your unique gamer tag, track your gameplay stats, save favorite games, and show off your badges."
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-gray-200 font-medium">Gamer Profile</span>
      </div>

      {/* Header Banner */}
      <div className="bg-[#0B0F19] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          {/* Avatar preview */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-tr from-indigo-500 via-cyan-400 to-emerald-400 shadow-xl shadow-indigo-600/20 shrink-0">
            <img
              src={avatarUrl || PRESET_AVATARS[0]}
              alt={displayName || 'Player Avatar'}
              className="w-full h-full object-cover rounded-[14px] bg-surface"
              onError={(e) => {
                // Fallback avatar
                (e.target as HTMLElement).setAttribute('src', PRESET_AVATARS[0]);
              }}
            />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
                {displayName || user?.name || 'Player'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                <Shield className="w-3 h-3 text-indigo-400" />
                Gamer
              </span>
            </div>

            <p className="text-sm font-mono text-cyan-400">@{username || 'player'}</p>

            {bio && <p className="text-gray-300 text-sm max-w-xl line-clamp-2">{bio}</p>}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                Joined {joinDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                Prefers {favoriteGenre || 'Arcade'}
              </span>
              {username && (
                <Link
                  href={`/player/@${username}`}
                  target="_blank"
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Public Profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/5">
          <Link
            href="/player/favorites"
            className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-400">Favorites</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">{stats.favoritesCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Games saved &rarr;</div>
          </Link>

          <Link
            href="/player/history"
            className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-400">Play History</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">{stats.gamesPlayedCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Games played &rarr;</div>
          </Link>

          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-400">Favorite Genre</span>
            </div>
            <div className="text-lg font-bold text-cyan-300 mt-1 truncate">
              {favoriteGenre || 'Arcade'}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Personal recommendation base</div>
          </div>
        </div>
      </div>

      {/* Edit Profile Section */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl">
        <div className="border-b border-white/10 pb-4 mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Edit Gamer Profile</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Customize your gamer identity and how other players see you across GameVerse.
          </p>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Your profile changes have been saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Chooser */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Choose Avatar
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {PRESET_AVATARS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAvatarUrl(preset)}
                  className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all p-0.5 ${
                    avatarUrl === preset
                      ? 'border-cyan-400 scale-105 shadow-md shadow-cyan-500/20'
                      : 'border-transparent hover:border-white/20 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset}
                    alt={`Avatar option ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {avatarUrl === preset && (
                    <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2"
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
                className="w-full bg-[#090D16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Gamer Handle */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2"
              >
                Gamer Handle (@username)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">
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
                  className="w-full bg-[#090D16] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono text-cyan-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Letters, numbers, underscores only. Used for your public profile URL.
              </p>
            </div>
          </div>

          {/* Favorite Genre */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
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
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-[#090D16] text-gray-400 border-white/5 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="bio"
                className="block text-xs font-semibold text-gray-300 uppercase tracking-wider"
              >
                Bio
              </label>
              <span className="text-[11px] text-gray-500 font-mono">
                {bio.length}/250 characters
              </span>
            </div>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              maxLength={250}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other gamers about yourself, your favorite games, or your play style..."
              className="w-full bg-[#090D16] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Submit CTA */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
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
