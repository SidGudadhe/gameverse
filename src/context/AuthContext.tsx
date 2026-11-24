'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  setSession: (user: AuthUser) => void;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  authModalOpen: boolean;
  authModalMode: 'LOGIN' | 'SIGNUP';
  openAuthModal: (mode?: 'LOGIN' | 'SIGNUP') => void;
  closeAuthModal: () => void;
}

const STORAGE_KEY = 'gameverse_user';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  role: 'GUEST',
  setSession: () => {},
  refreshUser: async () => null,
  logout: async () => {},
  authModalOpen: false,
  authModalMode: 'LOGIN',
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (initialUser) return initialUser;
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id && parsed.role) return parsed;
        }
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(!initialUser);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const router = useRouter();
  const userRef = useRef<AuthUser | null>(user);

  const openAuthModal = useCallback((mode: 'LOGIN' | 'SIGNUP' = 'LOGIN') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Instant synchronous session setter for 0ms UI transitions
  const setSession = useCallback((newUser: AuthUser) => {
    setUser(newUser);
    userRef.current = newUser;
    setLoading(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      window.dispatchEvent(new CustomEvent('gameverse_auth_change', { detail: newUser }));
    } catch {}
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    userRef.current = null;
    setLoading(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('gameverse_auth_change', { detail: null }));
    } catch {}
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const isDev = typeof window !== 'undefined' && window.location.pathname.startsWith('/developer');
      const isAdm = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      const portalQuery = isDev ? '?portal=DEVELOPER' : isAdm ? '?portal=ADMIN' : '?portal=PLAYER';
      const res = await fetch(`/api/auth/me${portalQuery}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          userRef.current = data.user;
          setLoading(false);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          } catch {}
          return data.user;
        }
      } else if (res.status === 401) {
        // Explicit unauthorized from server: clear stale session
        clearSession();
        return null;
      }
      // On 500, network delays or transient issues: preserve existing active session
      return userRef.current;
    } catch {
      // Network interruption: preserve existing session
      return userRef.current;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    // 1. Instant optimistic restore from localStorage to eliminate auth flicker
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id && parsed.role) {
          setUser(parsed);
          setLoading(false);
        }
      }
    } catch {}

    // 2. Validate session with server in background
    refreshUser();

    // 3. Synchronize cross-tab and cross-component changes in real time
    const handleAuthChange = (e: any) => {
      const detail = e.detail;
      if (detail && detail.id) {
        setUser(detail);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
            setLoading(false);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    };

    window.addEventListener('gameverse_auth_change', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('gameverse_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshUser]);

  const logout = useCallback(async () => {
    clearSession();
    try {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.disableAutoSelect();
      }
      await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
    } catch {}
    router.refresh();
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    if (currentPath.startsWith('/developer')) {
      router.push('/developer/auth/login');
    } else if (currentPath.startsWith('/admin')) {
      router.push('/admin/auth/login');
    } else {
      router.push('/');
    }
  }, [clearSession, router]);

  const role = user?.role || 'GUEST';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        role,
        setSession,
        refreshUser,
        logout,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
