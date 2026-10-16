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

// -------------------------------------------------------------
// SECURE RPC CALLS (CAPABILITY TOKEN BASED)
// -------------------------------------------------------------

export async function rpcInitOrGetNotebook(token: string, initialData?: unknown) {
  const client = getSupabase();
  if (!client) throw new Error('Chưa cấu hình Supabase URL và Anon Key');

  const { data, error } = await client.rpc('rpc_init_or_get_notebook', {
    p_token: token,
    p_initial_data: initialData || null,
  });

  if (error) throw error;
  return data;
}

export async function rpcSaveVocabulary(token: string, word: unknown, lastUpdatedAt?: string) {
  const client = getSupabase();
  if (!client) throw new Error('Chưa cấu hình Supabase');

  const { data, error } = await client.rpc('rpc_save_vocabulary', {
    p_token: token,
    p_word: word,
    p_last_updated_at: lastUpdatedAt || null,
  });

  if (error) throw error;
  return data;
}

export async function rpcDeleteVocabulary(token: string, wordId: string) {
  const client = getSupabase();
  if (!client) throw new Error('Chưa cấu hình Supabase');

  const { data, error } = await client.rpc('rpc_delete_vocabulary', {
    p_token: token,
    p_word_id: wordId,
  });

  if (error) throw error;
  return data;
}

export async function rpcSaveTopic(token: string, topic: unknown) {
  const client = getSupabase();
  if (!client) throw new Error('Chưa cấu hình Supabase');

  const { data, error } = await client.rpc('rpc_save_topic', {
    p_token: token,
    p_topic: topic,
  });

  if (error) throw error;
  return data;
}

export async function rpcDeleteTopic(token: string, topicId: string) {
  const client = getSupabase();
  if (!client) throw new Error('Chưa cấu hình Supabase');

  const { data, error } = await client.rpc('rpc_delete_topic', {
    p_token: token,
    p_topic_id: topicId,
  });

  if (error) throw error;
  return data;
}

export async function rpcSaveUnit(token: string, unit: unknown) {
  const client = getSupabase();
  if (!client) throw new Error('Chưa cấu hình Supabase');

  const { data, error } = await client.rpc('rpc_save_unit', {
    p_token: token,
    p_unit: unit,
  });

  if (error) throw error;
  return data;
}

export async function rpcDeleteUnit(token: string, unitId: string) {
  const client = getSupabase();
  if (!client) throw new Error('Chưa cấu hình Supabase');

  const { data, error } = await client.rpc('rpc_delete_unit', {
    p_token: token,
    p_unit_id: unitId,
  });

  if (error) throw error;
  return data;
}

export async function rpcUpdateProgress(token: string, profileId: string, wordId: string, progress: unknown) {
  const client = getSupabase();
  if (!client) throw new Error('Chưa cấu hình Supabase');

  const { data, error } = await client.rpc('rpc_update_progress', {
    p_token: token,
    p_profile_id: profileId,
    p_word_id: wordId,
    p_progress: progress,
  });

  if (error) throw error;
  return data;
}

export async function rpcSaveQuizAttempt(token: string, attempt: unknown) {
  const client = getSupabase();
  if (!client) throw new Error('Chưa cấu hình Supabase');

  const { data, error } = await client.rpc('rpc_save_quiz_attempt', {
    p_token: token,
    p_attempt: attempt,
  });

  if (error) throw error;
  return data;
}

export async function rpcUpdateProfiles(token: string, nameA: string, nameB: string) {
  const client = getSupabase();
  if (!client) throw new Error('Chưa cấu hình Supabase');

  const { data, error } = await client.rpc('rpc_update_profiles', {
    p_token: token,
    p_name_a: nameA,
    p_name_b: nameB,
  });

  if (error) throw error;
  return data;
}

export async function rpcRotateToken(oldToken: string, newToken: string) {
  const client = getSupabase();
  if (!client) throw new Error('Chưa cấu hình Supabase');

  const { data, error } = await client.rpc('rpc_rotate_token', {
    p_old_token: oldToken,
    p_new_token: newToken,
  });

  if (error) throw error;
  return data;
}

