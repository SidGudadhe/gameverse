'use client';

import React, { useState, useEffect } from 'react';
import { User, Plus, ArrowLeft, Check, AlertCircle, X } from 'lucide-react';

export interface GoogleAccount {
  email: string;
  name: string;
  avatarUrl?: string;
}

interface GoogleAccountChooserProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSelect: (account: GoogleAccount) => Promise<void>;
  isLoading?: boolean;
}

const STORAGE_SAVED_ACCOUNTS = 'gv_google_saved_accounts';

export default function GoogleAccountChooser({
  isOpen,
  onClose,
  onAccountSelect,
  isLoading = false,
}: GoogleAccountChooserProps) {
  const [savedAccounts, setSavedAccounts] = useState<GoogleAccount[]>([]);
  const [view, setView] = useState<'LIST' | 'INPUT'>('LIST');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load saved accounts from localStorage on open
  useEffect(() => {
    if (isOpen) {
      setError('');
      try {
        const raw = localStorage.getItem(STORAGE_SAVED_ACCOUNTS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedAccounts(parsed);
            setView('LIST');
            return;
          }
        }
      } catch {}
      // If no accounts previously used, show input form directly or suggested account
      setView('INPUT');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveAccountToHistory = (account: GoogleAccount) => {
    try {
      const existing = savedAccounts.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase());
      const updated = [account, ...existing].slice(0, 5);
      localStorage.setItem(STORAGE_SAVED_ACCOUNTS, JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch {}
  };

  const handleSelectAccount = async (account: GoogleAccount) => {
    setSubmitting(true);
    setError('');
    try {
      saveAccountToHistory(account);
      await onAccountSelect(account);
    } catch (err: any) {
      setError(err?.message || 'Google account sign-in failed. Please try again.');
      setSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your Google email address.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }

    const cleanName = customName.trim() || cleanEmail.split('@')[0];
    const newAccount: GoogleAccount = {
      email: cleanEmail,
      name: cleanName,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
    };

    setSubmitting(true);
    setError('');

    try {
      saveAccountToHistory(newAccount);
      await onAccountSelect(newAccount);
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-chooser-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-[420px] bg-[#1F2024] border border-[#3C4043] rounded-2xl shadow-2xl p-6 sm:p-7 relative overflow-hidden text-[#E8EAED] animate-in zoom-in-95 duration-200">
        {/* Animated Google Progress Bar when submitting */}
        {(submitting || isLoading) && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#3C4043] overflow-hidden">
            <div className="h-full bg-[#8AB4F8] animate-pulse w-full" />
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          disabled={submitting || isLoading}
          onClick={onClose}
          aria-label="Close Google account selector"
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Official Google G Logo */}
        <div className="text-center mb-4">
          <svg className="w-7 h-7 mx-auto mb-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>

          <h3 id="google-chooser-title" className="text-xl font-medium text-white tracking-tight">
            {view === 'LIST' ? 'Choose an account' : 'Sign in with Google'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            to continue to <span className="font-semibold text-gray-300">GameVerse</span>
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* ================= STEP 2A: ACCOUNT LIST VIEW ================= */}
        {view === 'LIST' && (
          <div className="space-y-1">
            <div className="divide-y divide-[#3C4043] border-y border-[#3C4043] my-2">
              {savedAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  disabled={submitting || isLoading}
                  onClick={() => handleSelectAccount(account)}
                  className="w-full py-3 px-2 flex items-center gap-3.5 hover:bg-white/5 active:bg-white/10 transition-colors text-left rounded-lg group cursor-pointer disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                    {account.name ? account.name[0].toUpperCase() : 'G'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                      {account.name || 'Google Gamer'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{account.email}</div>
                  </div>
                  <Check className="w-4 h-4 text-transparent group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </button>
              ))}

              {/* Use Another Account Option */}
              <button
                type="button"
                disabled={submitting || isLoading}
                onClick={() => {
                  setView('INPUT');
                  setError('');
                }}
                className="w-full py-3 px-2 flex items-center gap-3.5 hover:bg-white/5 active:bg-white/10 transition-colors text-left rounded-lg text-sm text-gray-300 hover:text-white cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 flex-shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-sm text-white">Use another account</div>
                  <div className="text-xs text-gray-400">Sign in with your real Google email</div>
                </div>
              </button>
            </div>

            <div className="text-[11px] text-gray-400 text-center pt-3">
              To continue, Google will share your name, email address, and profile picture with GameVerse.
            </div>
          </div>
        )}

        {/* ================= STEP 2B: ENTER REAL EMAIL / ACCOUNT INPUT VIEW ================= */}
        {view === 'INPUT' && (
          <form onSubmit={handleCustomSubmit} className="space-y-4 pt-1">
            {savedAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setView('LIST');
                  setError('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium mb-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to account list</span>
              </button>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Google Email Address
              </label>
              <input
                type="email"
                required
                autoFocus
                disabled={submitting || isLoading}
                placeholder="your.email@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full bg-[#18191C] border border-[#3C4043] focus:border-[#8AB4F8] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#8AB4F8] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Gamer Name / Display Name
              </label>
              <input
                type="text"
                disabled={submitting || isLoading}
                placeholder="e.g. Alex or Mauli"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-[#18191C] border border-[#3C4043] focus:border-[#8AB4F8] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#8AB4F8] transition-colors"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                This will be your gamer tag shown on leaderboards.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              {savedAccounts.length > 0 ? (
                <button
                  type="button"
                  disabled={submitting || isLoading}
                  onClick={() => setView('LIST')}
                  className="text-xs text-gray-400 hover:text-white px-3 py-2"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting || isLoading}
                  onClick={onClose}
                  className="text-xs text-gray-400 hover:text-white px-3 py-2"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={submitting || isLoading}
                className="bg-[#8AB4F8] hover:bg-[#A8C7FA] active:bg-[#72A4F2] text-[#202124] font-semibold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting || isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <span>Next & Sign In</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
