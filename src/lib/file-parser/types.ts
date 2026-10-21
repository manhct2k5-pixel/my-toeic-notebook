import { PartOfSpeech } from '@/types';

export type SupportedFileExtension = 'txt' | 'csv' | 'xlsx' | 'xls' | 'docx' | 'pdf' | 'doc';

export type ImportMode = 'structured' | 'freeform';

export type DuplicateStrategy = 
  | 'skip'                      // Bỏ qua từ trùng (giữ nguyên từ cũ)
  | 'merge_notes_and_examples' // Giữ từ cũ, bổ sung thêm ghi chú & ví dụ mới
  | 'add_topics_units'          // Gắn thêm từ cũ vào Topic/Unit mới
  | 'update_fields'             // Cập nhật đè các trường mới nếu có giá trị
  | 'create_new';               // Lưu như một mục từ mới

export interface ParsedVocabularyRow {
  id: string; // Temporary unique key for preview
  selected: boolean;
  word: string;
  pos: PartOfSpeech;
  phonetic_uk?: string;
  phonetic_us?: string;
  meaning_vi: string;
  example_en?: string;
  example_vi?: string;
  collocations?: string[];
  notes?: string;
  topic?: string;
  unit?: string;
  study_date?: string;
  
  // Status flags
  status: 'valid' | 'missing_word' | 'missing_meaning' | 'duplicate' | 'unassigned_category';
  statusMessage?: string;
  existingWordId?: string;
  existingWordText?: string;
}

export interface ExtractedDocumentData {
  fileName: string;
  fileSize: number;
  extension: SupportedFileExtension;
  rawText: string;
  rawRows?: Record<string, string>[]; // For tabular data (CSV, XLSX)
  headers?: string[];                // Header columns if tabular
  suggestedMode: ImportMode;
  detectedTopics: string[];
  detectedUnits: string[];
  pageCount?: number;
  warning?: string;
}

export type ColumnField = 
  | 'word'
  | 'pos'
  | 'phonetic_uk'
  | 'phonetic_us'
  | 'meaning_vi'
  | 'example_en'
  | 'example_vi'
  | 'collocations'
  | 'notes'
  | 'topic'
  | 'unit'
  | 'study_date'
  | 'ignore';

export type ColumnMapping = Record<string, ColumnField>;

export interface ImportSummaryResult {
  totalSelected: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  createdTopicsCount: number;
  createdUnitsCount: number;
  createdTopicNames: string[];
  createdUnitTitles: string[];
  errors: string[];
  importedWordIds: string[];
}
