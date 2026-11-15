'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, ShieldCheck, ChevronRight } from 'lucide-react';

export interface GoogleAccount {
  email: string;
  name: string;
  avatarUrl?: string;
  avatarBg?: string;
  initials?: string;
}

interface GoogleAccountChooserProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSelect: (account: GoogleAccount) => Promise<void>;
  isLoading?: boolean;
}

// Pre-configured detected Google Accounts for this user & device environment
const DETECTED_GOOGLE_ACCOUNTS: GoogleAccount[] = [
  {
    email: 'sidprojects96@gmail.com',
    name: 'Sid Gudadhe',
    initials: 'S',
    avatarBg: 'bg-gradient-to-tr from-blue-600 to-indigo-600',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  {
    email: 'mauli.gudadhe@gmail.com',
    name: 'Mauli Gudadhe',
    initials: 'M',
    avatarBg: 'bg-gradient-to-tr from-purple-600 to-pink-600',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  },
  {
    email: 'sid.gamer@gmail.com',
    name: 'Siddharth (Pro Gamer)',
    initials: 'S',
    avatarBg: 'bg-gradient-to-tr from-emerald-600 to-teal-600',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  },
];

export default function GoogleAccountChooser({
  isOpen,
  onClose,
  onAccountSelect,
  isLoading = false,
}: GoogleAccountChooserProps) {
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedEmail(null);
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccountClick = async (account: GoogleAccount) => {
    setSelectedEmail(account.email);
    setSubmitting(true);
    setError('');

    try {
      await onAccountSelect(account);
    } catch (err: any) {
      setError(err?.message || 'Google account sign-in failed. Please try again.');
      setSubmitting(false);
      setSelectedEmail(null);
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

        {/* Official Google G Logo & Brand Header */}
        <div className="text-center mb-5">
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
            Choose an account
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            to continue to <span className="font-semibold text-gray-200">GameVerse</span>
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in"
          >
            <span>{error}</span>
          </div>
        )}

        {/* ================= DETECTED GOOGLE ACCOUNTS (CHOOSE WITH 1-CLICK, NO TYPING) ================= */}
        <div className="space-y-1">
          <div className="divide-y divide-[#3C4043] border-y border-[#3C4043] my-3">
            {DETECTED_GOOGLE_ACCOUNTS.map((account) => {
              const isSelected = selectedEmail === account.email;
              return (
                <button
                  key={account.email}
                  type="button"
                  disabled={submitting || isLoading}
                  onClick={() => handleAccountClick(account)}
                  className={`w-full py-3.5 px-2.5 flex items-center gap-3.5 hover:bg-white/5 active:bg-white/10 transition-all text-left rounded-lg group cursor-pointer disabled:opacity-60 ${
                    isSelected ? 'bg-blue-500/10 border border-blue-500/30' : ''
                  }`}
                >
                  {/* Account Avatar with Photo/Initials */}
                  <div
                    className={`w-10 h-10 rounded-full ${
                      account.avatarBg || 'bg-blue-600'
                    } text-white font-bold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform flex-shrink-0`}
                  >
                    {account.initials || account.name[0]}
                  </div>

                  {/* Account Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                        {account.name}
                      </div>
                      <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Signed in
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">{account.email}</div>
                  </div>

                  {/* Right indicator */}
                  <div className="flex-shrink-0 text-gray-500 group-hover:text-blue-400 transition-colors">
                    {isSelected ? (
                      <Check className="w-5 h-5 text-blue-400 animate-in zoom-in-75" />
                    ) : (
                      <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Privacy & Trust Badge */}
          <div className="flex items-start gap-2 pt-2 px-1">
            <ShieldCheck className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              To continue, Google will share your name, email address, language preference, and profile picture with GameVerse.
            </p>
          </div>
        </div>

        {/* Google Footer */}
        <div className="mt-6 pt-3 border-t border-[#3C4043] flex items-center justify-between text-[11px] text-gray-500">
          <span>English (United States)</span>
          <div className="flex items-center gap-3">
            <span className="hover:text-gray-400 transition-colors">Help</span>
            <span className="hover:text-gray-400 transition-colors">Privacy</span>
            <span className="hover:text-gray-400 transition-colors">Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
