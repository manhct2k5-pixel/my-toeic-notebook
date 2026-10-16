'use client';

import {
  VocabularyItem,
  Topic,
  Unit,
  QuizAttempt,
  NotebookExportData,
} from '@/types';
import {
  SEED_TOPICS,
  SEED_UNITS,
  SEED_VOCABULARY,
} from './seed-data';
import { getSupabase } from './supabase';
import { getTodayISO } from './srs';

const STORAGE_KEYS = {
  TOPICS: 'my_toeic_topics_v1',
  UNITS: 'my_toeic_units_v1',
  VOCABULARY: 'my_toeic_vocab_v1',
  QUIZ_ATTEMPTS: 'my_toeic_quiz_v1',
  LESSON_ATTEMPTS: 'my_toeic_lesson_attempts_v1',
  INITIALIZED: 'my_toeic_initialized_v1',
};

// Sync status type and listener
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

// Storage event bus for reactive updates across components
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

// Helper to safely get from localStorage
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

/**
 * Helper to get current authenticated Supabase user ID if available
 */
async function getAuthUserId(): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Initialize sample data if local storage is empty
 */
export function initStorageIfNeeded(): void {
  if (typeof window === 'undefined') return;
  const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInit) {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(SEED_TOPICS));
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(SEED_UNITS));
    localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(SEED_VOCABULARY));
    localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LESSON_ATTEMPTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    notifyListeners();
  }
}

// -------------------------------------------------------------
// TOPICS
// -------------------------------------------------------------
export async function getTopics(): Promise<Topic[]> {
  initStorageIfNeeded();
  const userId = await getAuthUserId();
  const client = getSupabase();

  if (client && userId) {
    try {
      const { data, error } = await client
        .from('topics')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        const topics: Topic[] = data.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          color: t.color || '#2563eb',
          created_at: t.created_at,
          updated_at: t.updated_at,
        }));
        setLocalItem(STORAGE_KEYS.TOPICS, topics);
        return topics;
      }
    } catch (e) {
      console.warn('Supabase getTopics failed, falling back to local cache', e);
    }
  }

  return getLocalItem<Topic[]>(STORAGE_KEYS.TOPICS, SEED_TOPICS);
}

export async function saveTopic(topicData: Partial<Topic> & { name: string }): Promise<Topic> {
  const topics = await getTopics();
  const now = new Date().toISOString();
  const userId = await getAuthUserId();
  const client = getSupabase();

  let topic: Topic;
  if (topicData.id) {
    const existingIndex = topics.findIndex((t) => t.id === topicData.id);
    if (existingIndex >= 0) {
      topic = {
        ...topics[existingIndex],
        ...topicData,
        updated_at: now,
      };
      topics[existingIndex] = topic;
    } else {
      topic = {
        id: topicData.id,
        name: topicData.name,
        description: topicData.description || '',
        color: topicData.color || '#2563eb',
        created_at: now,
        updated_at: now,
      };
      topics.push(topic);
    }
  } else {
    topic = {
      id: `topic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: topicData.name,
      description: topicData.description || '',
      color: topicData.color || '#2563eb',
      created_at: now,
      updated_at: now,
    };
    topics.push(topic);
  }

  setLocalItem(STORAGE_KEYS.TOPICS, topics);

  if (client && userId) {
    notifySync('saving');
    try {
      const { error } = await client.from('topics').upsert({
        id: topic.id,
        user_id: userId,
        name: topic.name,
        description: topic.description,
        color: topic.color,
        updated_at: now,
      });

      if (error) {
        console.error('Supabase saveTopic error:', error);
        notifySync('error', error.message);
      } else {
        notifySync('saved');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối lưu Topic';
      notifySync('error', msg);
    }
  }

  return topic;
}

export async function deleteTopic(topicId: string): Promise<boolean> {
  const topics = await getTopics();
  const filtered = topics.filter((t) => t.id !== topicId);
  setLocalItem(STORAGE_KEYS.TOPICS, filtered);

  // Also remove this topic from words
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

  const userId = await getAuthUserId();
  const client = getSupabase();
  if (client && userId) {
    try {
      await client.from('topics').delete().eq('id', topicId);
    } catch (err) {
      console.error('Error deleting topic from Supabase', err);
    }
  }

  return true;
}

// -------------------------------------------------------------
// UNITS
// -------------------------------------------------------------
export async function getUnits(): Promise<Unit[]> {
  initStorageIfNeeded();
  const userId = await getAuthUserId();
  const client = getSupabase();

  if (client && userId) {
    try {
      const { data, error } = await client
        .from('units')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        const units: Unit[] = data.map((u) => ({
          id: u.id,
          title: u.title,
          description: u.description || '',
          category: (u.category as Unit['category']) || 'General',
          created_at: u.created_at,
          updated_at: u.updated_at,
        }));
        setLocalItem(STORAGE_KEYS.UNITS, units);
        return units;
      }
    } catch (e) {
      console.warn('Supabase getUnits failed, falling back to local cache', e);
    }
  }

  return getLocalItem<Unit[]>(STORAGE_KEYS.UNITS, SEED_UNITS);
}

export async function saveUnit(unitData: Partial<Unit> & { title: string }): Promise<Unit> {
  const units = await getUnits();
  const now = new Date().toISOString();
  const userId = await getAuthUserId();
  const client = getSupabase();

  let unit: Unit;
  if (unitData.id) {
    const existingIndex = units.findIndex((u) => u.id === unitData.id);
    if (existingIndex >= 0) {
      unit = {
        ...units[existingIndex],
        ...unitData,
        updated_at: now,
      };
      units[existingIndex] = unit;
    } else {
      unit = {
        id: unitData.id,
        title: unitData.title,
        description: unitData.description || '',
        category: unitData.category || 'General',
        created_at: now,
        updated_at: now,
      };
      units.push(unit);
    }
  } else {
    unit = {
      id: `unit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: unitData.title,
      description: unitData.description || '',
      category: unitData.category || 'General',
      created_at: now,
      updated_at: now,
    };
    units.push(unit);
  }

  setLocalItem(STORAGE_KEYS.UNITS, units);

  if (client && userId) {
    notifySync('saving');
    try {
      const { error } = await client.from('units').upsert({
        id: unit.id,
        user_id: userId,
        title: unit.title,
        description: unit.description,
        category: unit.category,
        updated_at: now,
      });

      if (error) {
        console.error('Supabase saveUnit error:', error);
        notifySync('error', error.message);
      } else {
        notifySync('saved');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối lưu Unit';
      notifySync('error', msg);
    }
  }

  return unit;
}

export async function deleteUnit(unitId: string): Promise<boolean> {
  const units = await getUnits();
  const filtered = units.filter((u) => u.id !== unitId);
  setLocalItem(STORAGE_KEYS.UNITS, filtered);

  // Also remove unit from vocabulary
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

  const userId = await getAuthUserId();
  const client = getSupabase();
  if (client && userId) {
    try {
      await client.from('units').delete().eq('id', unitId);
    } catch (err) {
      console.error('Error deleting unit from Supabase', err);
    }
  }

  return true;
}

// -------------------------------------------------------------
// VOCABULARY
// -------------------------------------------------------------
export async function getVocabulary(): Promise<VocabularyItem[]> {
  initStorageIfNeeded();
  const userId = await getAuthUserId();
  const client = getSupabase();

  if (client && userId) {
    try {
      const { data, error } = await client
        .from('vocabulary')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const vocabList: VocabularyItem[] = data.map((v) => ({
          id: v.id,
          user_id: v.user_id,
          word: v.word,
          pos: v.pos,
          phonetic_uk: v.phonetic_uk || '',
          phonetic_us: v.phonetic_us || '',
          audio_uk: v.audio_uk || '',
          audio_us: v.audio_us || '',
          meaning_vi: v.meaning_vi,
          example_en: v.example_en || '',
          example_vi: v.example_vi || '',
          collocations: Array.isArray(v.collocations) ? v.collocations : [],
          notes: v.notes || '',
          study_date: v.study_date || '',
          topic_ids: Array.isArray(v.topic_ids) ? v.topic_ids : [],
          unit_ids: Array.isArray(v.unit_ids) ? v.unit_ids : [],
          is_memorized: Boolean(v.is_memorized),
          needs_review: Boolean(v.needs_review),
          review_interval_days: v.review_interval_days || 0,
          ease_factor: v.ease_factor || 2.5,
          repetitions: v.repetitions || 0,
          next_review_date: v.next_review_date || '',
          last_reviewed_at: v.last_reviewed_at || '',
          incorrect_count: v.incorrect_count || 0,
          correct_count: v.correct_count || 0,
          sources: Array.isArray(v.sources) ? v.sources : [],
          created_at: v.created_at,
          updated_at: v.updated_at,
        }));

        setLocalItem(STORAGE_KEYS.VOCABULARY, vocabList);
        return vocabList;
      }
    } catch (e) {
      console.warn('Supabase getVocabulary failed, falling back to local cache', e);
    }
  }

  return getLocalItem<VocabularyItem[]>(STORAGE_KEYS.VOCABULARY, SEED_VOCABULARY);
}

export async function saveWord(wordData: Partial<VocabularyItem> & { word: string; meaning_vi: string }): Promise<VocabularyItem> {
  const words = await getVocabulary();
  const now = new Date().toISOString();
  const todayStr = getTodayISO();
  const userId = await getAuthUserId();
  const client = getSupabase();

  let word: VocabularyItem;

  if (wordData.id) {
    const existingIndex = words.findIndex((w) => w.id === wordData.id);
    if (existingIndex >= 0) {
      word = {
        ...words[existingIndex],
        ...wordData,
        updated_at: now,
      };
      words[existingIndex] = word;
    } else {
      word = {
        id: wordData.id,
        user_id: userId || undefined,
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
        last_reviewed_at: wordData.last_reviewed_at,
        incorrect_count: wordData.incorrect_count || 0,
        correct_count: wordData.correct_count || 0,
        sources: wordData.sources || [{ type: 'manual', timestamp: now }],
        created_at: wordData.created_at || now,
        updated_at: now,
      };
      words.unshift(word);
    }
  } else {
    word = {
      id: `vocab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || undefined,
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
      review_interval_days: 0,
      ease_factor: 2.5,
      repetitions: 0,
      next_review_date: todayStr,
      incorrect_count: 0,
      correct_count: 0,
      sources: wordData.sources || [{ type: 'manual', timestamp: now }],
      created_at: now,
      updated_at: now,
    };
    words.unshift(word);
  }

  // Save to local cache first
  setLocalItem(STORAGE_KEYS.VOCABULARY, words);

  // If cloud user, persist to Supabase
  if (client && userId) {
    notifySync('saving');
    try {
      const { error } = await client.from('vocabulary').upsert({
        id: word.id,
        user_id: userId,
        word: word.word,
        pos: word.pos,
        phonetic_uk: word.phonetic_uk,
        phonetic_us: word.phonetic_us,
        audio_uk: word.audio_uk,
        audio_us: word.audio_us,
        meaning_vi: word.meaning_vi,
        example_en: word.example_en,
        example_vi: word.example_vi,
        collocations: word.collocations,
        notes: word.notes,
        study_date: word.study_date,
        topic_ids: word.topic_ids,
        unit_ids: word.unit_ids,
        is_memorized: word.is_memorized,
        needs_review: word.needs_review,
        review_interval_days: word.review_interval_days,
        ease_factor: word.ease_factor,
        repetitions: word.repetitions,
        next_review_date: word.next_review_date,
        last_reviewed_at: word.last_reviewed_at,
        incorrect_count: word.incorrect_count,
        correct_count: word.correct_count,
        sources: word.sources,
        updated_at: now,
      });

      if (error) {
        console.error('Supabase saveWord error:', error);
        notifySync('error', error.message);
      } else {
        notifySync('saved');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi lưu từ vựng lên Cloud';
      notifySync('error', msg);
    }
  }

  return word;
}

export async function deleteWord(wordId: string): Promise<boolean> {
  const words = await getVocabulary();
  const filtered = words.filter((w) => w.id !== wordId);
  setLocalItem(STORAGE_KEYS.VOCABULARY, filtered);

  const userId = await getAuthUserId();
  const client = getSupabase();
  if (client && userId) {
    try {
      await client.from('vocabulary').delete().eq('id', wordId);
    } catch (err) {
      console.error('Error deleting word from Supabase', err);
    }
  }

  return true;
}

export async function updateWordNotes(wordId: string, notes: string): Promise<void> {
  const words = await getVocabulary();
  const index = words.findIndex((w) => w.id === wordId);
  if (index >= 0) {
    const updated = {
      ...words[index],
      notes,
      updated_at: new Date().toISOString(),
    };
    words[index] = updated;
    setLocalItem(STORAGE_KEYS.VOCABULARY, words);

    const userId = await getAuthUserId();
    const client = getSupabase();
    if (client && userId) {
      notifySync('saving');
      try {
        const { error } = await client
          .from('vocabulary')
          .update({ notes, updated_at: updated.updated_at })
          .eq('id', wordId);

        if (error) notifySync('error', error.message);
        else notifySync('saved');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi cập nhật ghi chú';
        notifySync('error', msg);
      }
    }
  }
}

export async function updateWordMemoryStatus(wordId: string, isMemorized: boolean, needsReview: boolean): Promise<void> {
  const words = await getVocabulary();
  const index = words.findIndex((w) => w.id === wordId);
  if (index >= 0) {
    const updated = {
      ...words[index],
      is_memorized: isMemorized,
      needs_review: needsReview,
      updated_at: new Date().toISOString(),
    };
    words[index] = updated;
    setLocalItem(STORAGE_KEYS.VOCABULARY, words);

    const userId = await getAuthUserId();
    const client = getSupabase();
    if (client && userId) {
      try {
        await client
          .from('vocabulary')
          .update({
            is_memorized: isMemorized,
            needs_review: needsReview,
            updated_at: updated.updated_at,
          })
          .eq('id', wordId);
      } catch (err) {
        console.error('Error updating memory status in Supabase', err);
      }
    }
  }
}

export async function updateWordStudyDate(wordId: string, studyDate: string): Promise<void> {
  const words = await getVocabulary();
  const index = words.findIndex((w) => w.id === wordId);
  if (index >= 0) {
    const updated = {
      ...words[index],
      study_date: studyDate,
      updated_at: new Date().toISOString(),
    };
    words[index] = updated;
    setLocalItem(STORAGE_KEYS.VOCABULARY, words);

    const userId = await getAuthUserId();
    const client = getSupabase();
    if (client && userId) {
      try {
        await client
          .from('vocabulary')
          .update({ study_date: studyDate, updated_at: updated.updated_at })
          .eq('id', wordId);
      } catch (err) {
        console.error('Error updating study date in Supabase', err);
      }
    }
  }
}

export async function findWordByText(text: string): Promise<VocabularyItem | null> {
  const words = await getVocabulary();
  const clean = text.trim().toLowerCase();
  return words.find((w) => w.word.trim().toLowerCase() === clean) || null;
}

export async function searchVocabulary(query: string): Promise<VocabularyItem[]> {
  const words = await getVocabulary();
  const q = query.trim().toLowerCase();
  if (!q) return words;
  return words.filter(
    (w) =>
      w.word.toLowerCase().includes(q) ||
      w.meaning_vi.toLowerCase().includes(q) ||
      w.notes.toLowerCase().includes(q)
  );
}

// -------------------------------------------------------------
// QUIZ ATTEMPTS
// -------------------------------------------------------------
export async function getQuizAttempts(): Promise<QuizAttempt[]> {
  const userId = await getAuthUserId();
  const client = getSupabase();

  if (client && userId) {
    try {
      const { data, error } = await client
        .from('quiz_attempts')
        .select('*')
        .order('completed_at', { ascending: false });

      if (!error && data) {
        const attempts: QuizAttempt[] = data.map((q) => ({
          id: q.id,
          user_id: q.user_id,
          mode: q.mode,
          scope_type: q.scope_type,
          scope_id: q.scope_id || '',
          total_questions: q.total_questions,
          correct_count: q.correct_count,
          score_percentage: q.score_percentage,
          wrong_word_ids: Array.isArray(q.wrong_word_ids) ? q.wrong_word_ids : [],
          completed_at: q.completed_at,
        }));
        setLocalItem(STORAGE_KEYS.QUIZ_ATTEMPTS, attempts);
        return attempts;
      }
    } catch (e) {
      console.warn('Supabase getQuizAttempts failed, falling back to local cache', e);
    }
  }

  return getLocalItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
}

export async function saveQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completed_at'>): Promise<QuizAttempt> {
  const attempts = await getQuizAttempts();
  const now = new Date().toISOString();
  const userId = await getAuthUserId();
  const client = getSupabase();

  const newAttempt: QuizAttempt = {
    ...attempt,
    id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId || undefined,
    completed_at: now,
  };

  attempts.unshift(newAttempt);
  setLocalItem(STORAGE_KEYS.QUIZ_ATTEMPTS, attempts);

  // If there are wrong words, mark them as needs_review: true
  if (attempt.wrong_word_ids && attempt.wrong_word_ids.length > 0) {
    const words = await getVocabulary();
    let modified = false;
    const updatedWords = words.map((w) => {
      if (attempt.wrong_word_ids.includes(w.id)) {
        modified = true;
        return {
          ...w,
          needs_review: true,
          is_memorized: false,
          incorrect_count: (w.incorrect_count || 0) + 1,
          updated_at: now,
        };
      }
      return w;
    });
    if (modified) {
      setLocalItem(STORAGE_KEYS.VOCABULARY, updatedWords);
    }
  }

  if (client && userId) {
    try {
      await client.from('quiz_attempts').insert({
        id: newAttempt.id,
        user_id: userId,
        mode: newAttempt.mode,
        scope_type: newAttempt.scope_type,
        scope_id: newAttempt.scope_id || '',
        total_questions: newAttempt.total_questions,
        correct_count: newAttempt.correct_count,
        score_percentage: newAttempt.score_percentage,
        wrong_word_ids: newAttempt.wrong_word_ids,
        completed_at: now,
      });
    } catch (err) {
      console.error('Error saving quiz attempt to Supabase', err);
    }
  }

  return newAttempt;
}

// -------------------------------------------------------------
// LOCALSTORAGE SNAPSHOT & MIGRATION TO CLOUD
// -------------------------------------------------------------

export function getLocalSnapshot() {
  const topics = getLocalItem<Topic[]>(STORAGE_KEYS.TOPICS, []);
  const units = getLocalItem<Unit[]>(STORAGE_KEYS.UNITS, []);
  const vocabulary = getLocalItem<VocabularyItem[]>(STORAGE_KEYS.VOCABULARY, []);
  const quiz_attempts = getLocalItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);

  return {
    topics,
    units,
    vocabulary,
    quiz_attempts,
    totalWords: vocabulary.length,
    totalTopics: topics.length,
    totalUnits: units.length,
    notesCount: vocabulary.filter((w) => w.notes && w.notes.trim().length > 0).length,
  };
}

export async function migrateLocalDataToCloud(userId: string): Promise<{
  success: boolean;
  migratedTopics: number;
  migratedUnits: number;
  migratedWords: number;
  error?: string;
}> {
  const client = getSupabase();
  if (!client || !userId) {
    return { success: false, migratedTopics: 0, migratedUnits: 0, migratedWords: 0, error: 'Chưa đăng nhập hoặc chưa cấu hình Supabase' };
  }

  try {
    notifySync('saving');
    const local = getLocalSnapshot();

    // 1. Fetch existing cloud data to deduplicate
    const [cloudTopicsRes, cloudUnitsRes, cloudVocabRes] = await Promise.all([
      client.from('topics').select('id, name'),
      client.from('units').select('id, title'),
      client.from('vocabulary').select('id, word'),
    ]);

    const cloudTopicNameMap = new Map<string, string>();
    (cloudTopicsRes.data || []).forEach((t: { id: string; name: string }) => cloudTopicNameMap.set(t.name.toLowerCase().trim(), t.id));

    const cloudUnitTitleMap = new Map<string, string>();
    (cloudUnitsRes.data || []).forEach((u: { id: string; title: string }) => cloudUnitTitleMap.set(u.title.toLowerCase().trim(), u.id));

    const cloudWordSet = new Set<string>();
    (cloudVocabRes.data || []).forEach((v: { id: string; word: string }) => cloudWordSet.add(v.word.toLowerCase().trim()));

    // Map old topic ID -> new cloud topic ID
    const topicIdRemap = new Map<string, string>();
    const topicsToInsert: Record<string, unknown>[] = [];

    for (const t of local.topics) {
      const cleanName = t.name.toLowerCase().trim();
      if (cloudTopicNameMap.has(cleanName)) {
        topicIdRemap.set(t.id, cloudTopicNameMap.get(cleanName)!);
      } else {
        topicIdRemap.set(t.id, t.id);
        topicsToInsert.push({
          id: t.id,
          user_id: userId,
          name: t.name,
          description: t.description || '',
          color: t.color || '#2563eb',
          created_at: t.created_at,
          updated_at: t.updated_at,
        });
        cloudTopicNameMap.set(cleanName, t.id);
      }
    }

    if (topicsToInsert.length > 0) {
      const { error } = await client.from('topics').upsert(topicsToInsert);
      if (error) throw new Error(`Lỗi chuyển Topic: ${error.message}`);
    }

    // Map old unit ID -> new cloud unit ID
    const unitIdRemap = new Map<string, string>();
    const unitsToInsert: Record<string, unknown>[] = [];

    for (const u of local.units) {
      const cleanTitle = u.title.toLowerCase().trim();
      if (cloudUnitTitleMap.has(cleanTitle)) {
        unitIdRemap.set(u.id, cloudUnitTitleMap.get(cleanTitle)!);
      } else {
        unitIdRemap.set(u.id, u.id);
        unitsToInsert.push({
          id: u.id,
          user_id: userId,
          title: u.title,
          description: u.description || '',
          category: u.category || 'General',
          created_at: u.created_at,
          updated_at: u.updated_at,
        });
        cloudUnitTitleMap.set(cleanTitle, u.id);
      }
    }

    if (unitsToInsert.length > 0) {
      const { error } = await client.from('units').upsert(unitsToInsert);
      if (error) throw new Error(`Lỗi chuyển Unit: ${error.message}`);
    }

    // Prepare Vocabulary with remapped topic_ids and unit_ids
    const wordsToInsert: Record<string, unknown>[] = [];
    for (const w of local.vocabulary) {
      const mappedTopics = w.topic_ids.map((id) => topicIdRemap.get(id) || id);
      const mappedUnits = w.unit_ids.map((id) => unitIdRemap.get(id) || id);

      wordsToInsert.push({
        id: w.id,
        user_id: userId,
        word: w.word,
        pos: w.pos,
        phonetic_uk: w.phonetic_uk || '',
        phonetic_us: w.phonetic_us || '',
        audio_uk: w.audio_uk || '',
        audio_us: w.audio_us || '',
        meaning_vi: w.meaning_vi,
        example_en: w.example_en || '',
        example_vi: w.example_vi || '',
        collocations: w.collocations || [],
        notes: w.notes || '',
        study_date: w.study_date || '',
        topic_ids: mappedTopics,
        unit_ids: mappedUnits,
        is_memorized: w.is_memorized,
        needs_review: w.needs_review,
        review_interval_days: w.review_interval_days || 0,
        ease_factor: w.ease_factor || 2.5,
        repetitions: w.repetitions || 0,
        next_review_date: w.next_review_date || '',
        last_reviewed_at: w.last_reviewed_at || '',
        incorrect_count: w.incorrect_count || 0,
        correct_count: w.correct_count || 0,
        sources: w.sources || [],
        created_at: w.created_at,
        updated_at: w.updated_at,
      });
    }

    // Batch insert vocabulary (chunked by 50 to avoid request size limits)
    const chunkSize = 50;
    for (let i = 0; i < wordsToInsert.length; i += chunkSize) {
      const chunk = wordsToInsert.slice(i, i + chunkSize);
      const { error } = await client.from('vocabulary').upsert(chunk);
      if (error) throw new Error(`Lỗi chuyển Từ vựng: ${error.message}`);
    }

    notifySync('saved');
    notifyListeners();

    return {
      success: true,
      migratedTopics: topicsToInsert.length,
      migratedUnits: unitsToInsert.length,
      migratedWords: wordsToInsert.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi không xác định khi chuyển dữ liệu';
    console.error('Migration failed:', err);
    notifySync('error', msg);
    return {
      success: false,
      migratedTopics: 0,
      migratedUnits: 0,
      migratedWords: 0,
      error: msg,
    };
  }
}

// -------------------------------------------------------------
// EXPORT & IMPORT & CSV
// -------------------------------------------------------------
export async function exportData(): Promise<NotebookExportData> {
  const topics = await getTopics();
  const units = await getUnits();
  const vocabulary = await getVocabulary();
  const quiz_attempts = await getQuizAttempts();

  return {
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    topics,
    units,
    vocabulary,
    quiz_attempts,
  };
}

export async function importData(jsonContent: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const data = JSON.parse(jsonContent);
    if (!data || typeof data !== 'object') {
      return { success: false, count: 0, error: 'File JSON không hợp lệ' };
    }

    if (!Array.isArray(data.vocabulary)) {
      return { success: false, count: 0, error: 'Dữ liệu không có danh sách từ vựng hợp lệ' };
    }

    const userId = await getAuthUserId();
    const client = getSupabase();

    if (Array.isArray(data.topics) && data.topics.length > 0) {
      const existingTopics = await getTopics();
      const topicMap = new Map(existingTopics.map((t) => [t.id, t]));
      data.topics.forEach((t: Topic) => topicMap.set(t.id, t));
      const mergedTopics = Array.from(topicMap.values());
      setLocalItem(STORAGE_KEYS.TOPICS, mergedTopics);

      if (client && userId) {
        await client.from('topics').upsert(
          mergedTopics.map((t) => ({ ...t, user_id: userId }))
        );
      }
    }

    if (Array.isArray(data.units) && data.units.length > 0) {
      const existingUnits = await getUnits();
      const unitMap = new Map(existingUnits.map((u) => [u.id, u]));
      data.units.forEach((u: Unit) => unitMap.set(u.id, u));
      const mergedUnits = Array.from(unitMap.values());
      setLocalItem(STORAGE_KEYS.UNITS, mergedUnits);

      if (client && userId) {
        await client.from('units').upsert(
          mergedUnits.map((u) => ({ ...u, user_id: userId }))
        );
      }
    }

    const existingVocab = await getVocabulary();
    const vocabMap = new Map(existingVocab.map((v) => [v.id, v]));
    data.vocabulary.forEach((v: VocabularyItem) => vocabMap.set(v.id, v));
    const mergedVocab = Array.from(vocabMap.values());
    setLocalItem(STORAGE_KEYS.VOCABULARY, mergedVocab);

    if (client && userId) {
      await client.from('vocabulary').upsert(
        mergedVocab.map((w) => ({ ...w, user_id: userId }))
      );
    }

    if (Array.isArray(data.quiz_attempts)) {
      setLocalItem(STORAGE_KEYS.QUIZ_ATTEMPTS, data.quiz_attempts);
    }

    notifyListeners();
    return { success: true, count: data.vocabulary.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi đọc tệp JSON';
    return { success: false, count: 0, error: msg };
  }
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
    'IPA UK',
    'IPA US',
    'Vietnamese Meaning',
    'English Example',
    'Vietnamese Example',
    'Topics',
    'Units',
    'Study Date',
    'Status',
    'Notes',
  ];

  const escapeCSV = (str: string | undefined): string => {
    if (!str) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = words.map((w) => {
    const topicNames = w.topic_ids.map((id) => topicMap.get(id) || id).join('; ');
    const unitNames = w.unit_ids.map((id) => unitMap.get(id) || id).join('; ');
    const status = w.is_memorized ? 'Đã nhớ' : 'Chưa nhớ';

    return [
      escapeCSV(w.word),
      escapeCSV(w.pos),
      escapeCSV(w.phonetic_uk),
      escapeCSV(w.phonetic_us),
      escapeCSV(w.meaning_vi),
      escapeCSV(w.example_en),
      escapeCSV(w.example_vi),
      escapeCSV(topicNames),
      escapeCSV(unitNames),
      escapeCSV(w.study_date),
      escapeCSV(status),
      escapeCSV(w.notes),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export async function resetToSampleData(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(SEED_TOPICS));
  localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(SEED_UNITS));
  localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(SEED_VOCABULARY));
  localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.LESSON_ATTEMPTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  notifyListeners();
}
