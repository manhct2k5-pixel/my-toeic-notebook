'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from './supabase';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null; message?: string }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(() => getSupabase() !== null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'idle'
  );
  const isConfigured = isSupabaseConfigured();

  // Monitor online / offline network state
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus((prev) => (prev === 'offline' ? 'idle' : prev));
    };
    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial session check & auth state listener
  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      return;
    }

    let mounted = true;

    // Get current session
    client.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn('Session retrieval error:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshAuth = useCallback(async () => {
    const client = getSupabase();
    if (!client) return;
    const { data } = await client.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
  }, []);

  const getRedirectUrl = (): string => {
    if (typeof window === 'undefined') return '';
    return window.location.origin + window.location.pathname;
  };

  const signInWithGoogle = useCallback(async (): Promise<{ error: string | null }> => {
    const client = getSupabase();
    if (!client) {
      return { error: 'Chưa cấu hình Supabase. Vui lòng kiểm tra cài đặt.' };
    }

    try {
      const redirectTo = getRedirectUrl();
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập Google thất bại';
      return { error: msg };
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const client = getSupabase();
    if (!client) {
      return { error: 'Chưa cấu hình Supabase. Vui lòng cấu hình URL và API Key trong Cài đặt.' };
    }

    try {
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Email chưa được xác nhận. Vui lòng kiểm tra hòm thư của bạn.';
        }
        return { error: msg };
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi đăng nhập';
      return { error: msg };
    }
  }, []);

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: string | null; message?: string }> => {
    const client = getSupabase();
    if (!client) {
      return { error: 'Chưa cấu hình Supabase. Vui lòng cấu hình URL và API Key.' };
    }

    try {
      const redirectTo = getRedirectUrl();
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('User already registered')) {
          msg = 'Email này đã được đăng ký. Bạn hãy đăng nhập thay vì đăng ký.';
        } else if (msg.includes('Password should be at least')) {
          msg = 'Mật khẩu cần tối thiểu 6 ký tự.';
        }
        return { error: msg };
      }

      // If Supabase has email confirmation enabled
      if (data.user && !data.session) {
        return {
          error: null,
          message: 'Đăng ký thành công! Vui lòng kiểm tra hộp thư email để xác nhận tài khoản trước khi đăng nhập.',
        };
      }

      return { error: null, message: 'Đăng ký và đăng nhập thành công!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi đăng ký tài khoản';
      return { error: msg };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const client = getSupabase();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    setUser(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isConfigured,
      syncStatus,
      setSyncStatus,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refreshAuth,
    }),
    [
      user,
      session,
      loading,
      isConfigured,
      syncStatus,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refreshAuth,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
