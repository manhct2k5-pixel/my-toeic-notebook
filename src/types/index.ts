export type PartOfSpeech = 
  | 'noun' 
  | 'verb' 
  | 'adjective' 
  | 'adverb' 
  | 'preposition' 
  | 'conjunction' 
  | 'phrase' 
  | 'idiom' 
  | 'other';

export interface Topic {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  title: string;
  description?: string;
  category: 'General' | 'Listening' | 'Reading';
  created_at: string;
  updated_at: string;
}

export interface VocabularySource {
  type: 'listening' | 'reading' | 'manual' | 'notebook';
  lessonTitle?: string;
  contextSentence?: string;
  timestamp?: string;
}

export interface VocabularyItem {
  id: string;
  user_id?: string;
  word: string;
  pos: PartOfSpeech;
  phonetic_uk?: string;
  phonetic_us?: string;
  audio_uk?: string;
  audio_us?: string;
  meaning_vi: string;
  example_en?: string;
  example_vi?: string;
  collocations?: string[];
  notes: string; // Multiline markdown / notes
  study_date: string; // YYYY-MM-DD
  topic_ids: string[];
  unit_ids: string[];
  is_memorized: boolean;
  needs_review: boolean;
  
  // Spaced Repetition (SRS)
  review_interval_days: number;
  ease_factor: number;
  repetitions: number;
  next_review_date: string; // YYYY-MM-DD
  last_reviewed_at?: string;
  incorrect_count: number;
  correct_count: number;
  
  sources: VocabularySource[];
  created_at: string;
  updated_at: string;
}

export type QuizMode = 
  | 'flashcard' 
  | 'multiple_choice' // English -> Vietnamese
  | 'vn_to_en'         // Vietnamese -> English
  | 'fill_in'          // Typing English from Vietnamese
  | 'listening'        // Audio Quiz: Listen & Type
  | 'mixed';           // Mixed Quiz

export type QuizScope = 
  | 'all' 
  | 'topic' 
  | 'unit' 
  | 'date' 
  | 'unmemorized' 
  | 'incorrect'
  | 'due_today';

export interface QuizAttempt {
  id: string;
  user_id?: string;
  mode: QuizMode;
  scope_type: QuizScope;
  scope_id?: string;
  total_questions: number;
  correct_count: number;
  score_percentage: number;
  wrong_word_ids: string[];
  completed_at: string;
}

export interface LessonAttempt {
  id: string;
  lesson_id: string;
  lesson_type: 'listening' | 'reading';
  part: number;
  score: number;
  total: number;
  selected_answers: Record<string, string>;
  completed_at: string;
}

export interface NotebookExportData {
  version: string;
  exported_at: string;
  topics: Topic[];
  units: Unit[];
  vocabulary: VocabularyItem[];
  quiz_attempts: QuizAttempt[];
  lesson_attempts?: LessonAttempt[];
}
