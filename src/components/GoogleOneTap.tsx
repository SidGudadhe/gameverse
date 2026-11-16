'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function GoogleOneTap() {
  const { isAuthenticated, loading, setSession } = useAuth();
  const initializedRef = useRef(false);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '109823456789-gameverseplayerauth2026.apps.googleusercontent.com';

  useEffect(() => {
    if (loading || isAuthenticated || initializedRef.current) return;

    let checkInterval: NodeJS.Timeout | null = null;
    let attempts = 0;

    const initOneTap = () => {
      if (typeof window === 'undefined' || !window.google?.accounts?.id) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) return;

            try {
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
              });

              const data = await res.json();
              if (res.ok && data.user) {
                setSession(data.user);
              }
            } catch {}
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
        });

        // Trigger Google One Tap floating dialog
        window.google.accounts.id.prompt();
        initializedRef.current = true;
        return true;
      } catch {
        return false;
      }
    };

    if (!initOneTap()) {
      checkInterval = setInterval(() => {
        attempts++;
        if (initOneTap() || attempts >= 20) {
          if (checkInterval) clearInterval(checkInterval);
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [loading, isAuthenticated, clientId, setSession]);

  return null;
}
