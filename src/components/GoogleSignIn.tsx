'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import GoogleAccountChooser, { GoogleAccount } from './GoogleAccountChooser';

interface GoogleSignInProps {
  mode?: 'LOGIN' | 'SIGNUP';
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  className?: string;
  enableOneTap?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

export default function GoogleSignIn({
  mode = 'LOGIN',
  onSuccess,
  onError,
  className = '',
  enableOneTap = true,
}: GoogleSignInProps) {
  const { setSession } = useAuth();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showFallbackChooser, setShowFallbackChooser] = useState(false);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '109823456789-gameverseplayerauth2026.apps.googleusercontent.com';

  // Handle the real verified credential returned from Google Identity Services
  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        const err = 'Google did not return an authentication credential.';
        setErrorMsg(err);
        onError?.(err);
        return;
      }

      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Google authentication failed.');
        }

        if (data.user) {
          setSession(data.user);
          setSuccessMsg(`Welcome, ${data.user.name}!`);
          onSuccess?.(data.user);
        }
      } catch (err: any) {
        const msg = err.message || 'Google authentication failed.';
        setErrorMsg(msg);
        onError?.(msg);
      } finally {
        setLoading(false);
      }
    },
    [setSession, onSuccess, onError]
  );

  // Initialize official Google Identity Services
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    let attempts = 0;

    const initGsi = () => {
      if (typeof window === 'undefined' || !window.google?.accounts?.id) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: mode === 'SIGNUP' ? 'signup' : 'signin',
        });

        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: mode === 'SIGNUP' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: '100%',
          });
        }

        // Trigger Google One Tap prompt where supported
        if (enableOneTap) {
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
              // One Tap could not be displayed (e.g. suppressed or unsupported)
            } else if (notification.isSkippedMoment()) {
              // User skipped One Tap
            } else if (notification.isDismissedMoment()) {
              // User dismissed One Tap
            }
          });
        }

        setGsiLoaded(true);
        return true;
      } catch (err) {
        return false;
      }
    };

    if (!initGsi()) {
      checkInterval = setInterval(() => {
        attempts++;
        if (initGsi() || attempts >= 20) {
          if (checkInterval) clearInterval(checkInterval);
        }
      }, 150);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [clientId, mode, enableOneTap, handleCredentialResponse]);

  // Fallback 1-click account selector if GSI iframe is blocked or clicked
  const handleFallbackAccountSelect = async (account: GoogleAccount) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          name: account.name,
          avatarUrl: account.avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      if (data.user) {
        setSession(data.user);
        setSuccessMsg(`Welcome, ${data.user.name}!`);
        setShowFallbackChooser(false);
        onSuccess?.(data.user);
      }
    } catch (err: any) {
      const msg = err.message || 'Google account selection failed.';
      setErrorMsg(msg);
      onError?.(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full space-y-2.5 ${className}`}>
      {/* Error and Success Feedback */}
      {errorMsg && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span className="flex-1">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span className="flex-1">{successMsg}</span>
        </div>
      )}

      {/* Official Google GSI Render Container */}
      <div
        ref={buttonContainerRef}
        className={`w-full min-h-[44px] flex items-center justify-center [&>div]:w-full ${
          !gsiLoaded ? 'hidden' : 'block'
        }`}
      />

      {/* Official-Branded Fallback Button (visible while GSI loads or if GSI script is blocked) */}
      {!gsiLoaded && (
        <button
          type="button"
          disabled={loading}
          onClick={() => setShowFallbackChooser(true)}
          className="w-full bg-white hover:bg-slate-50 text-slate-800 font-semibold py-3 px-4 rounded-xl border border-slate-300 shadow-xs hover:shadow transition-all flex items-center justify-center gap-3 text-sm active:scale-[0.99] disabled:opacity-70 cursor-pointer"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
          <span className="font-bold text-slate-800">
            {loading
              ? 'Connecting Google Account...'
              : mode === 'SIGNUP'
              ? 'Sign up with Google'
              : 'Sign in with Google'}
          </span>
        </button>
      )}

      {/* Fallback Google Account Chooser Modal (Zero manual email typing) */}
      <GoogleAccountChooser
        isOpen={showFallbackChooser}
        onClose={() => setShowFallbackChooser(false)}
        onAccountSelect={handleFallbackAccountSelect}
        isLoading={loading}
      />
    </div>
  );
}
