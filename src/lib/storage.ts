'use client';

import {
  VocabularyItem,
  Topic,
  Unit,
  QuizAttempt,
  LessonAttempt,
  NotebookExportData,
  ListeningLesson,
  ReadingLesson,
} from '@/types';
import {
  SEED_TOPICS,
  SEED_UNITS,
  SEED_VOCABULARY,
  SEED_LISTENING_LESSONS,
  SEED_READING_LESSONS,
} from './seed-data';
import { isSupabaseConfigured, supabase } from './supabase';
import { getTodayISO } from './srs';

const STORAGE_KEYS = {
  TOPICS: 'my_toeic_topics_v1',
  UNITS: 'my_toeic_units_v1',
  VOCABULARY: 'my_toeic_vocab_v1',
  QUIZ_ATTEMPTS: 'my_toeic_quiz_v1',
  LESSON_ATTEMPTS: 'my_toeic_lesson_attempts_v1',
  INITIALIZED: 'my_toeic_initialized_v1',
};

// Simple event bus for reactive updates across components
type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

export function subscribeToStorage(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
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
 * Initialize sample data if storage is empty
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
  return getLocalItem<Topic[]>(STORAGE_KEYS.TOPICS, SEED_TOPICS);
}

export async function saveTopic(topicData: Partial<Topic> & { name: string }): Promise<Topic> {
  const topics = await getTopics();
  const now = new Date().toISOString();

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
  return topic;
}

export async function deleteTopic(id: string): Promise<void> {
  const topics = await getTopics();
  const filtered = topics.filter((t) => t.id !== id);
  setLocalItem(STORAGE_KEYS.TOPICS, filtered);

  // Unlink topic from vocabulary without deleting the word
  const words = await getVocabulary();
  let modified = false;
  const updatedWords = words.map((w) => {
    if (w.topic_ids.includes(id)) {
      modified = true;
      return {
        ...w,
        topic_ids: w.topic_ids.filter((tid) => tid !== id),
        updated_at: new Date().toISOString(),
      };
    }
    return w;
  });
  if (modified) {
    setLocalItem(STORAGE_KEYS.VOCABULARY, updatedWords);
  }
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
  return unit;
}

export async function deleteUnit(id: string): Promise<void> {
  const units = await getUnits();
  const filtered = units.filter((u) => u.id !== id);
  setLocalItem(STORAGE_KEYS.UNITS, filtered);

  // Unlink unit from vocabulary without deleting the word
  const words = await getVocabulary();
  let modified = false;
  const updatedWords = words.map((w) => {
    if (w.unit_ids.includes(id)) {
      modified = true;
      return {
        ...w,
        unit_ids: w.unit_ids.filter((uid) => uid !== id),
        updated_at: new Date().toISOString(),
      };
    }
    return w;
  });
  if (modified) {
    setLocalItem(STORAGE_KEYS.VOCABULARY, updatedWords);
  }
}

// -------------------------------------------------------------
// VOCABULARY
// -------------------------------------------------------------
export async function getVocabulary(): Promise<VocabularyItem[]> {
  initStorageIfNeeded();
  return getLocalItem<VocabularyItem[]>(STORAGE_KEYS.VOCABULARY, SEED_VOCABULARY);
}

export async function getWordById(id: string): Promise<VocabularyItem | undefined> {
  const words = await getVocabulary();
  return words.find((w) => w.id === id);
}

export async function findWordByText(rawWord: string): Promise<VocabularyItem | undefined> {
  const clean = rawWord.trim().toLowerCase();
  const words = await getVocabulary();
  return words.find((w) => w.word.trim().toLowerCase() === clean);
}

export async function saveWord(
  wordData: Partial<VocabularyItem> & { word: string }
): Promise<VocabularyItem> {
  const words = await getVocabulary();
  const now = new Date().toISOString();
  const today = getTodayISO();

  let savedItem: VocabularyItem;

  if (wordData.id) {
    const existingIndex = words.findIndex((w) => w.id === wordData.id);
    if (existingIndex >= 0) {
      savedItem = {
        ...words[existingIndex],
        ...wordData,
        updated_at: now,
      };
      words[existingIndex] = savedItem;
    } else {
      savedItem = createNewWordItem(wordData, now, today);
      words.unshift(savedItem);
    }
  } else {
    // Check if word with same name already exists
    const existing = await findWordByText(wordData.word);
    if (existing) {
      // Merge topics, units, and sources into existing record
      const mergedTopics = Array.from(new Set([...existing.topic_ids, ...(wordData.topic_ids || [])]));
      const mergedUnits = Array.from(new Set([...existing.unit_ids, ...(wordData.unit_ids || [])]));
      const mergedSources = [...existing.sources, ...(wordData.sources || [])];

      savedItem = {
        ...existing,
        ...wordData,
        id: existing.id,
        topic_ids: mergedTopics,
        unit_ids: mergedUnits,
        sources: mergedSources,
        notes: wordData.notes ? `${existing.notes}\n\n---\n${wordData.notes}` : existing.notes,
        updated_at: now,
      };
      const existingIndex = words.findIndex((w) => w.id === existing.id);
      words[existingIndex] = savedItem;
    } else {
      savedItem = createNewWordItem(wordData, now, today);
      words.unshift(savedItem);
    }
  }

  setLocalItem(STORAGE_KEYS.VOCABULARY, words);
  return savedItem;
}

function createNewWordItem(
  data: Partial<VocabularyItem> & { word: string },
  now: string,
  today: string
): VocabularyItem {
  return {
    id: data.id || `vocab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    word: data.word.trim(),
    pos: data.pos || 'noun',
    phonetic_uk: data.phonetic_uk || '',
    phonetic_us: data.phonetic_us || '',
    audio_uk: data.audio_uk || '',
    audio_us: data.audio_us || '',
    meaning_vi: data.meaning_vi || '',
    example_en: data.example_en || '',
    example_vi: data.example_vi || '',
    collocations: data.collocations || [],
    notes: data.notes || '',
    study_date: data.study_date || today,
    topic_ids: data.topic_ids || [],
    unit_ids: data.unit_ids || [],
    is_memorized: data.is_memorized ?? false,
    needs_review: data.needs_review ?? true,
    review_interval_days: data.review_interval_days ?? 1,
    ease_factor: data.ease_factor ?? 2.5,
    repetitions: data.repetitions ?? 0,
    next_review_date: data.next_review_date || today,
    last_reviewed_at: data.last_reviewed_at,
    incorrect_count: data.incorrect_count ?? 0,
    correct_count: data.correct_count ?? 0,
    sources: data.sources || [],
    created_at: data.created_at || now,
    updated_at: now,
  };
}

export async function deleteWord(id: string): Promise<void> {
  const words = await getVocabulary();
  const filtered = words.filter((w) => w.id !== id);
  setLocalItem(STORAGE_KEYS.VOCABULARY, filtered);
}

export async function updateWordNotes(id: string, notes: string): Promise<void> {
  const words = await getVocabulary();
  const index = words.findIndex((w) => w.id === id);
  if (index >= 0) {
    words[index] = {
      ...words[index],
      notes,
      updated_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.VOCABULARY, words);
  }
}

export async function updateWordStudyDate(id: string, newDate: string): Promise<void> {
  const words = await getVocabulary();
  const index = words.findIndex((w) => w.id === id);
  if (index >= 0) {
    words[index] = {
      ...words[index],
      study_date: newDate,
      updated_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.VOCABULARY, words);
  }
}

export async function updateWordMemoryStatus(
  id: string,
  isMemorized: boolean,
  needsReview?: boolean
): Promise<void> {
  const words = await getVocabulary();
  const index = words.findIndex((w) => w.id === id);
  if (index >= 0) {
    words[index] = {
      ...words[index],
      is_memorized: isMemorized,
      needs_review: needsReview !== undefined ? needsReview : !isMemorized,
      updated_at: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.VOCABULARY, words);
  }
}

// -------------------------------------------------------------
// QUIZ ATTEMPTS
// -------------------------------------------------------------
export async function getQuizAttempts(): Promise<QuizAttempt[]> {
  initStorageIfNeeded();
  return getLocalItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
}

export async function saveQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completed_at'>): Promise<QuizAttempt> {
  const attempts = await getQuizAttempts();
  const newAttempt: QuizAttempt = {
    ...attempt,
    id: `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    completed_at: new Date().toISOString(),
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
          updated_at: new Date().toISOString(),
        };
      }
      return w;
    });
    if (modified) {
      setLocalItem(STORAGE_KEYS.VOCABULARY, updatedWords);
    }
  }

  return newAttempt;
}

// -------------------------------------------------------------
// LESSONS & ATTEMPTS
// -------------------------------------------------------------
export async function getListeningLessons(): Promise<ListeningLesson[]> {
  return SEED_LISTENING_LESSONS;
}

export async function getReadingLessons(): Promise<ReadingLesson[]> {
  return SEED_READING_LESSONS;
}

export async function getLessonAttempts(): Promise<LessonAttempt[]> {
  initStorageIfNeeded();
  return getLocalItem<LessonAttempt[]>(STORAGE_KEYS.LESSON_ATTEMPTS, []);
}

export async function saveLessonAttempt(
  attempt: Omit<LessonAttempt, 'id' | 'completed_at'>
): Promise<LessonAttempt> {
  const attempts = await getLessonAttempts();
  const newAttempt: LessonAttempt = {
    ...attempt,
    id: `lesson-attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    completed_at: new Date().toISOString(),
  };

  attempts.unshift(newAttempt);
  setLocalItem(STORAGE_KEYS.LESSON_ATTEMPTS, attempts);
  return newAttempt;
}

// -------------------------------------------------------------
// EXPORT & IMPORT & CSV
// -------------------------------------------------------------
export async function exportData(): Promise<NotebookExportData> {
  const topics = await getTopics();
  const units = await getUnits();
  const vocabulary = await getVocabulary();
  const quiz_attempts = await getQuizAttempts();
  const lesson_attempts = await getLessonAttempts();

  return {
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    topics,
    units,
    vocabulary,
    quiz_attempts,
    lesson_attempts,
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

    if (Array.isArray(data.topics) && data.topics.length > 0) {
      const existingTopics = await getTopics();
      const topicMap = new Map(existingTopics.map((t) => [t.id, t]));
      data.topics.forEach((t: Topic) => topicMap.set(t.id, t));
      setLocalItem(STORAGE_KEYS.TOPICS, Array.from(topicMap.values()));
    }

    if (Array.isArray(data.units) && data.units.length > 0) {
      const existingUnits = await getUnits();
      const unitMap = new Map(existingUnits.map((u) => [u.id, u]));
      data.units.forEach((u: Unit) => unitMap.set(u.id, u));
      setLocalItem(STORAGE_KEYS.UNITS, Array.from(unitMap.values()));
    }

    const existingVocab = await getVocabulary();
    const vocabMap = new Map(existingVocab.map((v) => [v.id, v]));
    data.vocabulary.forEach((v: VocabularyItem) => vocabMap.set(v.id, v));
    const mergedVocab = Array.from(vocabMap.values());
    setLocalItem(STORAGE_KEYS.VOCABULARY, mergedVocab);

    if (Array.isArray(data.quiz_attempts)) {
      setLocalItem(STORAGE_KEYS.QUIZ_ATTEMPTS, data.quiz_attempts);
    }

    if (Array.isArray(data.lesson_attempts)) {
      setLocalItem(STORAGE_KEYS.LESSON_ATTEMPTS, data.lesson_attempts);
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
