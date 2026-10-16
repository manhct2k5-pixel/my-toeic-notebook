'use client';

import {
  VocabularyItem,
  Topic,
  Unit,
  QuizAttempt,
  NotebookExportData,
  ProfileId,
  WordProgress,
  NotebookMetadata,
  NotesConflict,
} from '@/types';
import {
  SEED_TOPICS,
  SEED_UNITS,
  SEED_VOCABULARY,
} from './seed-data';
import {
  getSupabase,
  isSupabaseConfigured,
  rpcInitOrGetNotebook,
  rpcSaveVocabulary,
  rpcDeleteVocabulary,
  rpcSaveTopic,
  rpcDeleteTopic,
  rpcSaveUnit,
  rpcDeleteUnit,
  rpcUpdateProgress,
  rpcSaveQuizAttempt,
  rpcUpdateProfiles,
  rpcRotateToken,
} from './supabase';
import { getTodayISO } from './srs';

const STORAGE_KEYS = {
  CAPABILITY_TOKEN: 'my_toeic_capability_token',
  ACTIVE_PROFILE: 'my_toeic_active_profile', // 'profile_a' | 'profile_b'
  PROFILE_NAMES: 'my_toeic_profile_names',   // { a: string, b: string }
  NOTEBOOK_META: 'my_toeic_notebook_meta',
  TOPICS: 'my_toeic_topics_v1',
  UNITS: 'my_toeic_units_v1',
  VOCABULARY: 'my_toeic_vocab_v1',
  PROGRESS_A: 'my_toeic_progress_a_v1',
  PROGRESS_B: 'my_toeic_progress_b_v1',
  QUIZ_ATTEMPTS: 'my_toeic_quiz_v1',
  INITIALIZED: 'my_toeic_initialized_v2',
};

// -------------------------------------------------------------
// SYNC & STATUS EVENTS
// -------------------------------------------------------------
export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';
type SyncListener = (status: SyncStatus, errorMsg?: string) => void;
const syncListeners: Set<SyncListener> = new Set();

export function subscribeToSync(listener: SyncListener): () => void {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

let currentSyncStatus: SyncStatus = 'idle';

export function getSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

export function notifySync(status: SyncStatus, errorMsg?: string) {
  currentSyncStatus = status;
  syncListeners.forEach((listener) => {
    try {
      listener(status, errorMsg);
    } catch (e) {
      console.error('Error in sync listener', e);
    }
  });
}

// Storage event bus for reactive UI updates
type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

export function subscribeToStorage(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in storage listener', e);
    }
  });
}

// Conflict listener for notes
type ConflictListener = (conflict: NotesConflict) => void;
const conflictListeners: Set<ConflictListener> = new Set();

export function subscribeToConflict(listener: ConflictListener): () => void {
  conflictListeners.add(listener);
  return () => {
    conflictListeners.delete(listener);
  };
}

export function notifyConflict(conflict: NotesConflict) {
  conflictListeners.forEach((listener) => {
    try {
      listener(conflict);
    } catch (e) {
      console.error('Error in conflict listener', e);
    }
  });
}

// -------------------------------------------------------------
// LOCALSTORAGE HELPERS
// -------------------------------------------------------------
function getLocalItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
}

// -------------------------------------------------------------
// CAPABILITY TOKEN & SHARE LINK MANAGEMENT
// -------------------------------------------------------------

/**
 * Generate cryptographically random secure capability token
 */
export function generateSecureToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return 'toeic_' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return 'toeic_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Get current capability access token.
 * Checks URL query `?token=...` or hash `#token=...` first, then localStorage.
 */
export function getCapabilityToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const tokenFromQuery = searchParams.get('token');
    if (tokenFromQuery && tokenFromQuery.trim().length >= 8) {
      const clean = tokenFromQuery.trim();
      localStorage.setItem(STORAGE_KEYS.CAPABILITY_TOKEN, clean);
      return clean;
    }

    // 2. Check URL hash (e.g. #token=...)
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const tokenFromHash = hashParams.get('token');
      if (tokenFromHash && tokenFromHash.trim().length >= 8) {
        const clean = tokenFromHash.trim();
        localStorage.setItem(STORAGE_KEYS.CAPABILITY_TOKEN, clean);
        return clean;
      }
    }

    // 3. Fallback to localStorage
    const saved = localStorage.getItem(STORAGE_KEYS.CAPABILITY_TOKEN);
    return saved && saved.trim().length >= 8 ? saved.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Set and save capability token to localStorage
 */
export function setCapabilityToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CAPABILITY_TOKEN, token.trim());
  notifyListeners();
}

/**
 * Clear capability token
 */
export function clearCapabilityToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.CAPABILITY_TOKEN);
  notifyListeners();
}

/**
 * Get full shareable URL containing the capability token
 */
export function getShareableLink(token?: string): string {
  const currentToken = token || getCapabilityToken();
  if (typeof window === 'undefined') return '';
  const baseUrl = window.location.origin + window.location.pathname;
  if (!currentToken) return baseUrl;
  return `${baseUrl}?token=${encodeURIComponent(currentToken)}`;
}

// -------------------------------------------------------------
// PROFILE MANAGEMENT (2 HỒ SƠ: NGƯỜI A & NGƯỜI B)
// -------------------------------------------------------------

export function getActiveProfileId(): ProfileId {
  if (typeof window === 'undefined') return 'profile_a';
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
    return val === 'profile_b' ? 'profile_b' : 'profile_a';
  } catch {
    return 'profile_a';
  }
}

export function setActiveProfileId(profileId: ProfileId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, profileId);
  notifyListeners();
}

export function getProfileNames(): { profile_a: string; profile_b: string } {
  return getLocalItem<{ profile_a: string; profile_b: string }>(STORAGE_KEYS.PROFILE_NAMES, {
    profile_a: 'Người A',
    profile_b: 'Người B',
  });
}

export async function updateProfileNames(nameA: string, nameB: string): Promise<void> {
  const cleanA = nameA.trim() || 'Người A';
  const cleanB = nameB.trim() || 'Người B';
  const names = { profile_a: cleanA, profile_b: cleanB };
  setLocalItem(STORAGE_KEYS.PROFILE_NAMES, names);

  const token = getCapabilityToken();
  if (token && isSupabaseConfigured()) {
    try {
      notifySync('saving');
      await rpcUpdateProfiles(token, cleanA, cleanB);
      notifySync('saved');
    } catch (err: unknown) {
      console.error('Error updating profiles on Supabase', err);
      notifySync('error', err instanceof Error ? err.message : 'Lỗi cập nhật tên hồ sơ');
    }
  }
}

// -------------------------------------------------------------
// SEED & LOCAL STORAGE INITIALIZATION
// -------------------------------------------------------------
export function initStorageIfNeeded(): void {
  if (typeof window === 'undefined') return;
  const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInit) {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(SEED_TOPICS));
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(SEED_UNITS));
    localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(SEED_VOCABULARY));
    localStorage.setItem(STORAGE_KEYS.PROGRESS_A, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PROGRESS_B, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify([]));
    localStorage.setItem(
      STORAGE_KEYS.PROFILE_NAMES,
      JSON.stringify({ profile_a: 'Người A', profile_b: 'Người B' })
    );
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    notifyListeners();
  }
}

// -------------------------------------------------------------
// REALTIME BROADCAST CHANNEL (AUTO-SYNC KHI BẠN CÙNG HỌC THAY ĐỔI)
// -------------------------------------------------------------
let realtimeSubscribedToken: string | null = null;

export function setupRealtimeSyncIfNeeded(token: string) {
  if (typeof window === 'undefined' || !isSupabaseConfigured()) return;
  if (realtimeSubscribedToken === token) return;

  const client = getSupabase();
  if (!client) return;

  try {
    const channelName = `notebook:${token}`;
    const channel = client.channel(channelName);

    channel
      .on('broadcast', { event: 'notebook_updated' }, () => {
        // Silently pull newest data from cloud when peer saves
        syncWithCloud(token, false).catch((err) => {
          console.warn('Realtime sync reload error', err);
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          realtimeSubscribedToken = token;
        }
      });
  } catch (err) {
    console.warn('Could not setup Supabase realtime broadcast', err);
  }
}

function broadcastNotebookChange(token: string) {
  const client = getSupabase();
  if (!client || !token) return;
  try {
    client.channel(`notebook:${token}`).send({
      type: 'broadcast',
      event: 'notebook_updated',
      payload: { timestamp: new Date().toISOString() },
    });
  } catch {
    // Ignore broadcast errors
  }
}

// -------------------------------------------------------------
// CLOUD SYNC ENGINE
// -------------------------------------------------------------

export interface CloudSyncResult {
  success: boolean;
  error?: string;
  notebook?: NotebookMetadata;
}

/**
 * Sync local mirror with cloud database for the given capability token.
 */
export async function syncWithCloud(
  token: string,
  createIfMissing: boolean = true
): Promise<CloudSyncResult> {
  initStorageIfNeeded();
  if (!isSupabaseConfigured()) {
    notifySync('offline', 'Chưa cấu hình Supabase URL & Key trong Cài đặt');
    return { success: false, error: 'Chưa cấu hình Supabase' };
  }

  notifySync('saving');

  try {
    // Prepare local snapshot if this is a brand new notebook creation
    let initialData = undefined;
    if (createIfMissing) {
      const localTopics = getLocalItem<Topic[]>(STORAGE_KEYS.TOPICS, SEED_TOPICS);
      const localUnits = getLocalItem<Unit[]>(STORAGE_KEYS.UNITS, SEED_UNITS);
      const localVocab = getLocalItem<VocabularyItem[]>(STORAGE_KEYS.VOCABULARY, SEED_VOCABULARY);
      const localNames = getProfileNames();
      initialData = {
        name: 'My TOEIC Notebook',
        profile_a_name: localNames.profile_a,
        profile_b_name: localNames.profile_b,
        topics: localTopics,
        units: localUnits,
        vocabulary: localVocab,
      };
    }

    const res = await rpcInitOrGetNotebook(token, initialData);

    if (!res || !res.success) {
      notifySync('error', res?.error || 'Không thể đồng bộ với máy chủ');
      return { success: false, error: res?.error || 'Lỗi kết nối' };
    }

    // Unpack cloud data into local mirror cache
    if (res.notebook) {
      const nb: NotebookMetadata = {
        token: res.notebook.token,
        name: res.notebook.name,
        profile_a_name: res.notebook.profile_a_name,
        profile_b_name: res.notebook.profile_b_name,
        created_at: res.notebook.created_at,
        updated_at: res.notebook.updated_at,
      };
      setLocalItem(STORAGE_KEYS.NOTEBOOK_META, nb);
      setLocalItem(STORAGE_KEYS.PROFILE_NAMES, {
        profile_a: nb.profile_a_name,
        profile_b: nb.profile_b_name,
      });
    }

    if (Array.isArray(res.topics)) {
      setLocalItem(STORAGE_KEYS.TOPICS, res.topics);
    }
    if (Array.isArray(res.units)) {
      setLocalItem(STORAGE_KEYS.UNITS, res.units);
    }
    if (Array.isArray(res.vocabulary)) {
      setLocalItem(STORAGE_KEYS.VOCABULARY, res.vocabulary);
    }

    // Unpack per-profile progress
    if (Array.isArray(res.progress)) {
      const progA = res.progress.filter((p: WordProgress) => p.profile_id === 'profile_a');
      const progB = res.progress.filter((p: WordProgress) => p.profile_id === 'profile_b');
      setLocalItem(STORAGE_KEYS.PROGRESS_A, progA);
      setLocalItem(STORAGE_KEYS.PROGRESS_B, progB);
    }

    if (Array.isArray(res.quiz_attempts)) {
      setLocalItem(STORAGE_KEYS.QUIZ_ATTEMPTS, res.quiz_attempts);
    }

    setCapabilityToken(token);
    setupRealtimeSyncIfNeeded(token);
    notifySync('saved');

    return {
      success: true,
      notebook: res.notebook,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi đồng bộ Supabase';
    notifySync('error', msg);
    return { success: false, error: msg };
  }
}

/**
 * Rotate access token when old link was compromised
 */
export async function rotateNotebookLink(oldToken: string): Promise<{ success: boolean; newToken?: string; error?: string }> {
  const newToken = generateSecureToken();
  if (!isSupabaseConfigured()) {
    setCapabilityToken(newToken);
    return { success: true, newToken };
  }

  notifySync('saving');
  try {
    const res = await rpcRotateToken(oldToken, newToken);
    if (!res || !res.success) {
      notifySync('error', res?.error || 'Lỗi thu hồi mã');
      return { success: false, error: res?.error };
    }
    setCapabilityToken(newToken);
    notifySync('saved');
    return { success: true, newToken };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi thu hồi liên kết';
    notifySync('error', msg);
    return { success: false, error: msg };
  }
}

// -------------------------------------------------------------
// PROGRESS HELPERS
// -------------------------------------------------------------
function getProfileProgressList(profileId: ProfileId): WordProgress[] {
  const key = profileId === 'profile_b' ? STORAGE_KEYS.PROGRESS_B : STORAGE_KEYS.PROGRESS_A;
  return getLocalItem<WordProgress[]>(key, []);
}

function setProfileProgressList(profileId: ProfileId, list: WordProgress[]): void {
  const key = profileId === 'profile_b' ? STORAGE_KEYS.PROGRESS_B : STORAGE_KEYS.PROGRESS_A;
  setLocalItem(key, list);
}

// -------------------------------------------------------------
// TOPICS
// -------------------------------------------------------------
export async function getTopics(): Promise<Topic[]> {
  initStorageIfNeeded();
  return getLocalItem<Topic[]>(STORAGE_KEYS.TOPICS, SEED_TOPICS);
}

export async function saveTopic(topicData: Partial<Topic> & { name: string }): Promise<Topic> {
  const topics = await getTopics();
  const now = new Date().toISOString();
  let topic: Topic;

  if (topicData.id) {
    const index = topics.findIndex((t) => t.id === topicData.id);
    if (index >= 0) {
      topic = { ...topics[index], ...topicData, updated_at: now };
      topics[index] = topic;
    } else {
      topic = {
        id: topicData.id,
        name: topicData.name.trim(),
        description: topicData.description || '',
        color: topicData.color || '#2563eb',
        created_at: now,
        updated_at: now,
      };
      topics.push(topic);
    }
  } else {
    topic = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: topicData.name.trim(),
      description: topicData.description || '',
      color: topicData.color || '#2563eb',
      created_at: now,
      updated_at: now,
    };
    topics.push(topic);
  }

  setLocalItem(STORAGE_KEYS.TOPICS, topics);

  const token = getCapabilityToken();
  if (token && isSupabaseConfigured()) {
    notifySync('saving');
    try {
      await rpcSaveTopic(token, topic);
      broadcastNotebookChange(token);
      notifySync('saved');
    } catch (err: unknown) {
      notifySync('error', err instanceof Error ? err.message : 'Lỗi lưu Topic lên Cloud');
    }
  }

  return topic;
}

export async function deleteTopic(topicId: string): Promise<boolean> {
  const topics = await getTopics();
  const filtered = topics.filter((t) => t.id !== topicId);
  setLocalItem(STORAGE_KEYS.TOPICS, filtered);

  // Remove topic from all vocabulary items
  const words = await getVocabulary();
  let wordsUpdated = false;
  const updatedWords = words.map((w) => {
    if (w.topic_ids.includes(topicId)) {
      wordsUpdated = true;
      return {
        ...w,
        topic_ids: w.topic_ids.filter((id) => id !== topicId),
      };
    }
    return w;
  });
  if (wordsUpdated) {
    setLocalItem(STORAGE_KEYS.VOCABULARY, updatedWords);
  }

  const token = getCapabilityToken();
  if (token && isSupabaseConfigured()) {
    notifySync('saving');
    try {
      await rpcDeleteTopic(token, topicId);
      broadcastNotebookChange(token);
      notifySync('saved');
    } catch (err: unknown) {
      notifySync('error', err instanceof Error ? err.message : 'Lỗi xóa Topic');
    }
  }

  return true;
}

// -------------------------------------------------------------
// UNITS
// -------------------------------------------------------------
export async function getUnits(): Promise<Unit[]> {
  initStorageIfNeeded();
  return getLocalItem<Unit[]>(STORAGE_KEYS.UNITS, SEED_UNITS);
}

export async function saveUnit(unitData: Partial<Unit> & { title: string }): Promise<Unit> {
  const units = await getUnits();
  const now = new Date().toISOString();
  let unit: Unit;

  if (unitData.id) {
    const index = units.findIndex((u) => u.id === unitData.id);
    if (index >= 0) {
      unit = { ...units[index], ...unitData, updated_at: now };
      units[index] = unit;
    } else {
      unit = {
        id: unitData.id,
        title: unitData.title.trim(),
        description: unitData.description || '',
        category: unitData.category || 'General',
        created_at: now,
        updated_at: now,
      };
      units.push(unit);
    }
  } else {
    unit = {
      id: `unit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: unitData.title.trim(),
      description: unitData.description || '',
      category: unitData.category || 'General',
      created_at: now,
      updated_at: now,
    };
    units.push(unit);
  }

  setLocalItem(STORAGE_KEYS.UNITS, units);

  const token = getCapabilityToken();
  if (token && isSupabaseConfigured()) {
    notifySync('saving');
    try {
      await rpcSaveUnit(token, unit);
      broadcastNotebookChange(token);
      notifySync('saved');
    } catch (err: unknown) {
      notifySync('error', err instanceof Error ? err.message : 'Lỗi lưu Unit lên Cloud');
    }
  }

  return unit;
}

export async function deleteUnit(unitId: string): Promise<boolean> {
  const units = await getUnits();
  const filtered = units.filter((u) => u.id !== unitId);
  setLocalItem(STORAGE_KEYS.UNITS, filtered);

  // Remove unit from all vocabulary items
  const words = await getVocabulary();
  let wordsUpdated = false;
  const updatedWords = words.map((w) => {
    if (w.unit_ids.includes(unitId)) {
      wordsUpdated = true;
      return {
        ...w,
        unit_ids: w.unit_ids.filter((id) => id !== unitId),
      };
    }
    return w;
  });
  if (wordsUpdated) {
    setLocalItem(STORAGE_KEYS.VOCABULARY, updatedWords);
  }

  const token = getCapabilityToken();
  if (token && isSupabaseConfigured()) {
    notifySync('saving');
    try {
      await rpcDeleteUnit(token, unitId);
      broadcastNotebookChange(token);
      notifySync('saved');
    } catch (err: unknown) {
      notifySync('error', err instanceof Error ? err.message : 'Lỗi xóa Unit');
    }
  }

  return true;
}

// -------------------------------------------------------------
// VOCABULARY & PROGRESS
// -------------------------------------------------------------

/**
 * Get all shared vocabulary items, merged with progress of the active or specified profile.
 */
export async function getVocabulary(profileId?: ProfileId): Promise<VocabularyItem[]> {
  initStorageIfNeeded();
  const activeProfile = profileId || getActiveProfileId();
  const rawWords = getLocalItem<VocabularyItem[]>(STORAGE_KEYS.VOCABULARY, SEED_VOCABULARY);
  const progressList = getProfileProgressList(activeProfile);
  const progressMap = new Map<string, WordProgress>(progressList.map((p) => [p.word_id, p]));

  return rawWords.map((w) => {
    const p = progressMap.get(w.id);
    if (!p) {
      return {
        ...w,
        is_memorized: Boolean(w.is_memorized),
        needs_review: w.needs_review !== undefined ? Boolean(w.needs_review) : true,
      };
    }
    return {
      ...w,
      is_memorized: p.is_memorized,
      needs_review: p.needs_review,
      review_interval_days: p.review_interval_days,
      ease_factor: p.ease_factor,
      repetitions: p.repetitions,
      next_review_date: p.next_review_date,
      last_reviewed_at: p.last_reviewed_at,
      incorrect_count: p.incorrect_count,
      correct_count: p.correct_count,
    };
  });
}

/**
 * Save vocabulary word.
 * - Shared content updates the shared vocabulary list.
 * - Progress fields update profile_progress for the active profile.
 * - Supports conflict detection for notes.
 */
export async function saveWord(
  wordData: Partial<VocabularyItem> & { word: string; meaning_vi: string },
  options?: { lastUpdatedAt?: string; force?: boolean }
): Promise<VocabularyItem & { conflict?: boolean; serverNotes?: string }> {
  initStorageIfNeeded();
  const words = getLocalItem<VocabularyItem[]>(STORAGE_KEYS.VOCABULARY, SEED_VOCABULARY);
  const now = new Date().toISOString();
  const todayStr = getTodayISO();
  const activeProfile = getActiveProfileId();

  let word: VocabularyItem;
  const wordId = wordData.id || `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const existingIndex = words.findIndex((w) => w.id === wordId);
  if (existingIndex >= 0) {
    word = {
      ...words[existingIndex],
      ...wordData,
      id: wordId,
      updated_at: now,
    };
    words[existingIndex] = word;
  } else {
    word = {
      id: wordId,
      word: wordData.word.trim(),
      pos: wordData.pos || 'noun',
      phonetic_uk: wordData.phonetic_uk || '',
      phonetic_us: wordData.phonetic_us || '',
      audio_uk: wordData.audio_uk || '',
      audio_us: wordData.audio_us || '',
      meaning_vi: wordData.meaning_vi.trim(),
      example_en: wordData.example_en || '',
      example_vi: wordData.example_vi || '',
      collocations: wordData.collocations || [],
      notes: wordData.notes || '',
      study_date: wordData.study_date || todayStr,
      topic_ids: wordData.topic_ids || [],
      unit_ids: wordData.unit_ids || [],
      is_memorized: wordData.is_memorized || false,
      needs_review: wordData.needs_review !== undefined ? wordData.needs_review : true,
      review_interval_days: wordData.review_interval_days || 0,
      ease_factor: wordData.ease_factor || 2.5,
      repetitions: wordData.repetitions || 0,
      next_review_date: wordData.next_review_date || todayStr,
      last_reviewed_at: wordData.last_reviewed_at || '',
      incorrect_count: wordData.incorrect_count || 0,
      correct_count: wordData.correct_count || 0,
      sources: wordData.sources || [{ type: 'manual', timestamp: now }],
      created_at: now,
      updated_at: now,
    };
    words.unshift(word);
  }

  // Update local shared vocabulary
  setLocalItem(STORAGE_KEYS.VOCABULARY, words);

  // Update per-profile progress
  const progressList = getProfileProgressList(activeProfile);
  const pIndex = progressList.findIndex((p) => p.word_id === wordId);
  const progressRecord: WordProgress = {
    word_id: wordId,
    profile_id: activeProfile,
    is_memorized: Boolean(word.is_memorized),
    needs_review: Boolean(word.needs_review),
    review_interval_days: word.review_interval_days || 0,
    ease_factor: word.ease_factor || 2.5,
    repetitions: word.repetitions || 0,
    next_review_date: word.next_review_date || todayStr,
    last_reviewed_at: word.last_reviewed_at,
    incorrect_count: word.incorrect_count || 0,
    correct_count: word.correct_count || 0,
    updated_at: now,
  };

  if (pIndex >= 0) {
    progressList[pIndex] = progressRecord;
  } else {
    progressList.push(progressRecord);
  }
  setProfileProgressList(activeProfile, progressList);

  // Sync to Supabase if token exists
  const token = getCapabilityToken();
  if (token && isSupabaseConfigured()) {
    notifySync('saving');
    try {
      // 1. Save shared vocabulary with conflict detection
      const res = await rpcSaveVocabulary(
        token,
        word,
        options?.force ? undefined : options?.lastUpdatedAt
      );

      if (res && res.conflict) {
        notifySync('idle');
        notifyConflict({
          wordId,
          wordText: word.word,
          serverNotes: res.server_notes,
          serverUpdatedAt: res.server_updated_at,
        });
        return Object.assign(word, {
          conflict: true,
          serverNotes: res.server_notes,
        });
      }

      // 2. Save profile progress
      await rpcUpdateProgress(token, activeProfile, wordId, progressRecord);

      broadcastNotebookChange(token);
      notifySync('saved');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi lưu từ vựng lên Cloud';
      notifySync('error', msg);
    }
  }

  return word;
}

export async function deleteWord(wordId: string): Promise<boolean> {
  const words = getLocalItem<VocabularyItem[]>(STORAGE_KEYS.VOCABULARY, SEED_VOCABULARY);
  const filtered = words.filter((w) => w.id !== wordId);
  setLocalItem(STORAGE_KEYS.VOCABULARY, filtered);

  // Remove from both progress lists
  const pA = getProfileProgressList('profile_a').filter((p) => p.word_id !== wordId);
  const pB = getProfileProgressList('profile_b').filter((p) => p.word_id !== wordId);
  setProfileProgressList('profile_a', pA);
  setProfileProgressList('profile_b', pB);

  const token = getCapabilityToken();
  if (token && isSupabaseConfigured()) {
    notifySync('saving');
    try {
      await rpcDeleteVocabulary(token, wordId);
      broadcastNotebookChange(token);
      notifySync('saved');
    } catch (err: unknown) {
      notifySync('error', err instanceof Error ? err.message : 'Lỗi xóa từ vựng');
    }
  }

  return true;
}

/**
 * Update notes of a word with conflict detection.
 */
export async function updateWordNotes(
  wordId: string,
  notes: string,
  lastKnownUpdatedAt?: string
): Promise<{ success: boolean; conflict?: boolean; serverNotes?: string }> {
  const words = getLocalItem<VocabularyItem[]>(STORAGE_KEYS.VOCABULARY, SEED_VOCABULARY);
  const index = words.findIndex((w) => w.id === wordId);
  if (index < 0) return { success: false };

  const word = words[index];
  const now = new Date().toISOString();

  // Optimistic local update
  words[index] = { ...word, notes, updated_at: now };
  setLocalItem(STORAGE_KEYS.VOCABULARY, words);

  const token = getCapabilityToken();
  if (token && isSupabaseConfigured()) {
    notifySync('saving');
    try {
      const res = await rpcSaveVocabulary(token, words[index], lastKnownUpdatedAt);
      if (res && res.conflict) {
        notifySync('idle');
        notifyConflict({
          wordId,
          wordText: word.word,
          serverNotes: res.server_notes,
          serverUpdatedAt: res.server_updated_at,
        });
        return {
          success: false,
          conflict: true,
          serverNotes: res.server_notes,
        };
      }
      broadcastNotebookChange(token);
      notifySync('saved');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi lưu ghi chú';
      notifySync('error', msg);
      return { success: false };
    }
  }

  return { success: true };
}

/**
 * Update memorized / needs review status for active profile only.
 */
export async function updateWordMemoryStatus(
  wordId: string,
  isMemorized: boolean,
  needsReview: boolean
): Promise<void> {
  const activeProfile = getActiveProfileId();
  const progressList = getProfileProgressList(activeProfile);
  const index = progressList.findIndex((p) => p.word_id === wordId);
  const now = new Date().toISOString();

  const record: WordProgress = index >= 0
    ? {
        ...progressList[index],
        is_memorized: isMemorized,
        needs_review: needsReview,
        updated_at: now,
      }
    : {
        word_id: wordId,
        profile_id: activeProfile,
        is_memorized: isMemorized,
        needs_review: needsReview,
        review_interval_days: 0,
        ease_factor: 2.5,
        repetitions: 0,
        next_review_date: getTodayISO(),
        incorrect_count: 0,
        correct_count: 0,
        updated_at: now,
      };

  if (index >= 0) {
    progressList[index] = record;
  } else {
    progressList.push(record);
  }
  setProfileProgressList(activeProfile, progressList);

  const token = getCapabilityToken();
  if (token && isSupabaseConfigured()) {
    try {
      await rpcUpdateProgress(token, activeProfile, wordId, record);
    } catch (err) {
      console.error('Error updating progress on Supabase', err);
    }
  }
}

/**
 * Update study date (shared for the word).
 */
export async function updateWordStudyDate(wordId: string, studyDate: string): Promise<void> {
  const words = getLocalItem<VocabularyItem[]>(STORAGE_KEYS.VOCABULARY, SEED_VOCABULARY);
  const index = words.findIndex((w) => w.id === wordId);
  if (index >= 0) {
    words[index] = { ...words[index], study_date: studyDate, updated_at: new Date().toISOString() };
    setLocalItem(STORAGE_KEYS.VOCABULARY, words);

    const token = getCapabilityToken();
    if (token && isSupabaseConfigured()) {
      try {
        await rpcSaveVocabulary(token, words[index]);
        broadcastNotebookChange(token);
      } catch (err) {
        console.error('Error updating study date on Supabase', err);
      }
    }
  }
}

export async function findWordByText(text: string): Promise<VocabularyItem | null> {
  const words = await getVocabulary();
  const clean = text.trim().toLowerCase();
  return words.find((w) => w.word.toLowerCase() === clean) || null;
}

// -------------------------------------------------------------
// QUIZ ATTEMPTS (LƯU RIÊNG CHO TỪNG HỒ SƠ)
// -------------------------------------------------------------
export async function getQuizAttempts(profileId?: ProfileId): Promise<QuizAttempt[]> {
  initStorageIfNeeded();
  const targetProfile = profileId || getActiveProfileId();
  const allAttempts = getLocalItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
  return allAttempts.filter((a) => (a.profile_id || 'profile_a') === targetProfile);
}

export async function saveQuizAttempt(
  attemptData: Omit<QuizAttempt, 'id' | 'completed_at'> & { id?: string; profile_id?: ProfileId }
): Promise<QuizAttempt> {
  const allAttempts = getLocalItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
  const activeProfile = attemptData.profile_id || getActiveProfileId();
  const token = getCapabilityToken();

  const attempt: QuizAttempt = {
    ...attemptData,
    id: attemptData.id || `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    notebook_token: token || undefined,
    profile_id: activeProfile,
    completed_at: new Date().toISOString(),
  };

  allAttempts.unshift(attempt);
  setLocalItem(STORAGE_KEYS.QUIZ_ATTEMPTS, allAttempts);

  if (token && isSupabaseConfigured()) {
    try {
      await rpcSaveQuizAttempt(token, attempt);
    } catch (err) {
      console.error('Error saving quiz attempt to Supabase', err);
    }
  }

  return attempt;
}

// -------------------------------------------------------------
// BACKUP, EXPORT & IMPORT (GIỮ NGUYÊN DỮ LIỆU)
// -------------------------------------------------------------
export async function exportData(): Promise<NotebookExportData> {
  const [topics, units, vocabulary, allAttempts] = await Promise.all([
    getTopics(),
    getUnits(),
    getVocabulary(),
    getLocalItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []),
  ]);

  const pA = getProfileProgressList('profile_a');
  const pB = getProfileProgressList('profile_b');
  const allProgress = [...pA, ...pB];
  const meta = getLocalItem<NotebookMetadata | undefined>(STORAGE_KEYS.NOTEBOOK_META, undefined);

  return {
    version: '2.0.0',
    exported_at: new Date().toISOString(),
    notebook: meta,
    topics,
    units,
    vocabulary,
    progress: allProgress,
    quiz_attempts: allAttempts,
  };
}

export async function exportCSV(): Promise<string> {
  const words = await getVocabulary();
  const topics = await getTopics();
  const units = await getUnits();

  const topicMap = new Map(topics.map((t) => [t.id, t.name]));
  const unitMap = new Map(units.map((u) => [u.id, u.title]));

  const headers = [
    'Word',
    'Part of Speech',
    'Phonetic UK',
    'Phonetic US',
    'Meaning (VI)',
    'Example (EN)',
    'Example (VI)',
    'Notes',
    'Study Date',
    'Topics',
    'Units',
    'Memorized',
  ];

  const rows = words.map((w) => [
    `"${w.word.replace(/"/g, '""')}"`,
    `"${w.pos}"`,
    `"${(w.phonetic_uk || '').replace(/"/g, '""')}"`,
    `"${(w.phonetic_us || '').replace(/"/g, '""')}"`,
    `"${w.meaning_vi.replace(/"/g, '""')}"`,
    `"${(w.example_en || '').replace(/"/g, '""')}"`,
    `"${(w.example_vi || '').replace(/"/g, '""')}"`,
    `"${(w.notes || '').replace(/"/g, '""')}"`,
    `"${w.study_date || ''}"`,
    `"${w.topic_ids.map((id) => topicMap.get(id) || id).join('; ')}"`,
    `"${w.unit_ids.map((id) => unitMap.get(id) || id).join('; ')}"`,
    w.is_memorized ? 'Yes' : 'No',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export async function importData(importedData: NotebookExportData): Promise<{
  success: boolean;
  addedTopics: number;
  addedUnits: number;
  addedWords: number;
  error?: string;
}> {
  try {
    if (!importedData.vocabulary || !Array.isArray(importedData.vocabulary)) {
      throw new Error('Định dạng file sao lưu không hợp lệ (thiếu danh sách từ vựng)');
    }

    const currentTopics = await getTopics();
    const currentUnits = await getUnits();
    const currentWords = await getVocabulary();

    // 1. Merge Topics
    const topicMapByName = new Map(currentTopics.map((t) => [t.name.trim().toLowerCase(), t]));
    let addedTopicsCount = 0;
    const mergedTopics = [...currentTopics];

    if (Array.isArray(importedData.topics)) {
      importedData.topics.forEach((it) => {
        const key = it.name.trim().toLowerCase();
        if (!topicMapByName.has(key)) {
          mergedTopics.push(it);
          topicMapByName.set(key, it);
          addedTopicsCount++;
        }
      });
      setLocalItem(STORAGE_KEYS.TOPICS, mergedTopics);
    }

    // 2. Merge Units
    const unitMapByTitle = new Map(currentUnits.map((u) => [u.title.trim().toLowerCase(), u]));
    let addedUnitsCount = 0;
    const mergedUnits = [...currentUnits];

    if (Array.isArray(importedData.units)) {
      importedData.units.forEach((iu) => {
        const key = iu.title.trim().toLowerCase();
        if (!unitMapByTitle.has(key)) {
          mergedUnits.push(iu);
          unitMapByTitle.set(key, iu);
          addedUnitsCount++;
        }
      });
      setLocalItem(STORAGE_KEYS.UNITS, mergedUnits);
    }

    // 3. Merge Vocabulary (avoid duplicate words)
    const wordMapByText = new Map(currentWords.map((w) => [w.word.trim().toLowerCase(), w]));
    let addedWordsCount = 0;
    const mergedWords = [...currentWords];

    importedData.vocabulary.forEach((iw) => {
      const key = iw.word.trim().toLowerCase();
      if (!wordMapByText.has(key)) {
        mergedWords.push(iw);
        wordMapByText.set(key, iw);
        addedWordsCount++;
      }
    });

    setLocalItem(STORAGE_KEYS.VOCABULARY, mergedWords);

    // 4. Merge Progress
    if (Array.isArray(importedData.progress)) {
      const pA = getProfileProgressList('profile_a');
      const pB = getProfileProgressList('profile_b');
      const mapA = new Map(pA.map((p) => [p.word_id, p]));
      const mapB = new Map(pB.map((p) => [p.word_id, p]));

      importedData.progress.forEach((p) => {
        if (p.profile_id === 'profile_b') {
          if (!mapB.has(p.word_id)) pB.push(p);
        } else {
          if (!mapA.has(p.word_id)) pA.push(p);
        }
      });
      setProfileProgressList('profile_a', pA);
      setProfileProgressList('profile_b', pB);
    }

    // 5. Sync to cloud if token present
    const token = getCapabilityToken();
    if (token && isSupabaseConfigured()) {
      syncWithCloud(token, true).catch((e) => {
        console.error('Error syncing imported data to cloud', e);
      });
    }

    return {
      success: true,
      addedTopics: addedTopicsCount,
      addedUnits: addedUnitsCount,
      addedWords: addedWordsCount,
    };
  } catch (err: unknown) {
    return {
      success: false,
      addedTopics: 0,
      addedUnits: 0,
      addedWords: 0,
      error: err instanceof Error ? err.message : 'Lỗi khi nhập file dữ liệu',
    };
  }
}

export function resetToSampleData(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(SEED_TOPICS));
  localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(SEED_UNITS));
  localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(SEED_VOCABULARY));
  localStorage.setItem(STORAGE_KEYS.PROGRESS_A, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PROGRESS_B, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify([]));
  notifyListeners();
}

export function getLocalSnapshot() {
  const topics = getLocalItem<Topic[]>(STORAGE_KEYS.TOPICS, SEED_TOPICS);
  const units = getLocalItem<Unit[]>(STORAGE_KEYS.UNITS, SEED_UNITS);
  const vocabulary = getLocalItem<VocabularyItem[]>(STORAGE_KEYS.VOCABULARY, SEED_VOCABULARY);
  const quiz_attempts = getLocalItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
  const notesCount = vocabulary.filter((w) => w.notes && w.notes.trim().length > 0).length;

  return {
    topics,
    units,
    vocabulary,
    quiz_attempts,
    totalWords: vocabulary.length,
    totalTopics: topics.length,
    totalUnits: units.length,
    notesCount,
  };
}
