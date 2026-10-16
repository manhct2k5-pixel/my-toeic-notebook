'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const RUNTIME_STORAGE_KEYS = {
  URL: 'my_toeic_supabase_url',
  ANON_KEY: 'my_toeic_supabase_anon_key',
};

export function getEffectiveSupabaseConfig(): { url: string; key: string } | null {
  // 1. Check build-time environment variables
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    envUrl && 
    envKey && 
    envUrl.startsWith('https://') && 
    !envUrl.includes('your-project-id') &&
    !envUrl.includes('your-supabase-url')
  ) {
    return { url: envUrl.trim(), key: envKey.trim() };
  }

  // 2. Check browser runtime configuration (entered via Settings)
  if (typeof window !== 'undefined') {
    try {
      const localUrl = localStorage.getItem(RUNTIME_STORAGE_KEYS.URL);
      const localKey = localStorage.getItem(RUNTIME_STORAGE_KEYS.ANON_KEY);
      if (localUrl && localKey && localUrl.startsWith('https://')) {
        return { url: localUrl.trim(), key: localKey.trim() };
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

export function isSupabaseConfigured(): boolean {
  return getEffectiveSupabaseConfig() !== null;
}

export function saveRuntimeSupabaseConfig(url: string, key: string): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  localStorage.setItem(RUNTIME_STORAGE_KEYS.URL, cleanUrl);
  localStorage.setItem(RUNTIME_STORAGE_KEYS.ANON_KEY, cleanKey);
  // Re-instantiate client
  cachedClient = null;
}

export function clearRuntimeSupabaseConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RUNTIME_STORAGE_KEYS.URL);
  localStorage.removeItem(RUNTIME_STORAGE_KEYS.ANON_KEY);
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getEffectiveSupabaseConfig();
  if (!config) return null;

  try {
    cachedClient = createClient(config.url, config.key, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Global exported client getter or instance
export const supabase = typeof window !== 'undefined' ? getSupabase() : null;
