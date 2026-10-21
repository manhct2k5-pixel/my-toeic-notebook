import { PartOfSpeech } from '@/types';
import {
  ColumnField,
  ColumnMapping,
  ParsedVocabularyRow,
  ExtractedDocumentData,
} from './types';

// Map common text representations to standard PartOfSpeech
export function normalizePartOfSpeech(rawPos?: string): PartOfSpeech {
  if (!rawPos) return 'noun';
  const clean = rawPos.toLowerCase().trim().replace(/[()[\]/]/g, ' ');

  if (clean.includes('noun') || clean.includes('danh từ') || /\bn\b/.test(clean)) return 'noun';
  if (clean.includes('verb') || clean.includes('động từ') || /\bv\b/.test(clean)) return 'verb';
  if (clean.includes('adjective') || clean.includes('tính từ') || /\badj\b/.test(clean) || /\ba\b/.test(clean)) return 'adjective';
  if (clean.includes('adverb') || clean.includes('trạng từ') || /\badv\b/.test(clean)) return 'adverb';
  if (clean.includes('phrase') || clean.includes('cụm từ') || clean.includes('cụm')) return 'phrase';
  if (clean.includes('preposition') || clean.includes('giới từ') || /\bprep\b/.test(clean)) return 'preposition';
  if (clean.includes('conjunction') || clean.includes('liên từ') || /\bconj\b/.test(clean)) return 'conjunction';
  if (clean.includes('idiom') || clean.includes('thành ngữ')) return 'idiom';

  return 'other';
}

/**
 * Automatically maps raw table headers to known Vocabulary fields
 */
export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<ColumnField>();

  const fieldMatchRules: { field: ColumnField; keywords: string[] }[] = [
    { field: 'word', keywords: ['word', 'english', 'tiếng anh', 'từ vựng', 'từ', 'vocab', 'term', 'en'] },
    { field: 'meaning_vi', keywords: ['meaning', 'nghĩa', 'nghĩa tiếng việt', 'dịch nghĩa', 'vietnamese', 'giải nghĩa', 'định nghĩa', 'definition', 'vi'] },
    { field: 'pos', keywords: ['pos', 'part of speech', 'loại từ', 'từ loại', 'type', 'part'] },
    { field: 'phonetic_uk', keywords: ['ipa uk', 'uk ipa', 'phonetic uk', 'phiên âm uk', 'uk phonetic'] },
    { field: 'phonetic_us', keywords: ['ipa us', 'us ipa', 'phonetic us', 'phiên âm us', 'us phonetic', 'ipa', 'phonetic', 'phiên âm'] },
    { field: 'example_en', keywords: ['example (en)', 'example en', 'en example', 'ví dụ (en)', 'câu ví dụ', 'ví dụ', 'example', 'sentence'] },
    { field: 'example_vi', keywords: ['example (vi)', 'example vi', 'vi example', 'dịch ví dụ', 'nghĩa ví dụ', 'ví dụ tiếng việt'] },
    { field: 'collocations', keywords: ['collocations', 'collocation', 'cụm từ liên quan', 'cụm từ', 'phrases', 'cụm'] },
    { field: 'notes', keywords: ['personal notes', 'notes', 'note', 'ghi chú', 'chú thích', 'nhận xét'] },
    { field: 'topic', keywords: ['topic', 'chủ đề', 'chủ điểm', 'category'] },
    { field: 'unit', keywords: ['unit', 'lesson', 'bài học', 'bài', 'chương', 'chapter'] },
    { field: 'study_date', keywords: ['study date', 'date', 'ngày học', 'ngày', 'created_at'] },
  ];

  for (const header of headers) {
    const clean = header.toLowerCase().trim();
    let assigned = false;

    for (const rule of fieldMatchRules) {
      if (usedFields.has(rule.field)) continue;

      const isMatch = rule.keywords.some((kw) => {
        if (clean === kw) return true;
        if (clean.includes(kw)) return true;
        return false;
      });

      if (isMatch) {
        mapping[header] = rule.field;
        usedFields.add(rule.field);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      mapping[header] = 'ignore';
    }
  }

  // Fallback: If no 'word' mapped, map the first text column to 'word'
  if (!usedFields.has('word') && headers.length > 0) {
    mapping[headers[0]] = 'word';
    usedFields.add('word');
  }

  // Fallback: If no 'meaning_vi' mapped, map second column to 'meaning_vi'
  if (!usedFields.has('meaning_vi') && headers.length > 1) {
    mapping[headers[1]] = 'meaning_vi';
    usedFields.add('meaning_vi');
  }

  return mapping;
}

/**
 * Convert tabular rows (CSV or Excel) into ParsedVocabularyRow items using ColumnMapping
 */
export function parseTabularData(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  defaultTopic?: string,
  defaultUnit?: string
): ParsedVocabularyRow[] {
  const result: ParsedVocabularyRow[] = [];
  const today = new Date().toISOString().split('T')[0];

  rows.forEach((row, index) => {
    let word = '';
    let pos: PartOfSpeech = 'noun';
    let phonetic_uk = '';
    let phonetic_us = '';
    let meaning_vi = '';
    let example_en = '';
    let example_vi = '';
    let collocations: string[] = [];
    let notes = '';
    let topic = defaultTopic || '';
    let unit = defaultUnit || '';
    let study_date = today;

    for (const [colName, field] of Object.entries(mapping)) {
      const val = (row[colName] || '').trim();
      if (!val || field === 'ignore') continue;

      switch (field) {
        case 'word':
          word = val;
          break;
        case 'pos':
          pos = normalizePartOfSpeech(val);
          break;
        case 'phonetic_uk':
          phonetic_uk = val;
          break;
        case 'phonetic_us':
          phonetic_us = val;
          break;
        case 'meaning_vi':
          meaning_vi = val;
          break;
        case 'example_en':
          example_en = val;
          break;
        case 'example_vi':
          example_vi = val;
          break;
        case 'collocations':
          collocations = val
            .split(/[;\n\r|]+/)
            .map((c) => c.trim())
            .filter((c) => c.length > 0);
          break;
        case 'notes':
          notes = val;
          break;
        case 'topic':
          topic = val;
          break;
        case 'unit':
          unit = val;
          break;
        case 'study_date':
          study_date = parseDateOrFallback(val, today);
          break;
      }
    }

    if (!word && !meaning_vi) return; // Skip empty rows

    // Clean up word (e.g. remove leading numbers like "1. ", "- ")
    const cleanWord = word.replace(/^[\d+.)\-–—*\s]+/, '').trim();

    // Check status
    let status: ParsedVocabularyRow['status'] = 'valid';
    let statusMessage = '';

    if (!cleanWord) {
      status = 'missing_word';
      statusMessage = 'Thiếu từ tiếng Anh';
    } else if (!meaning_vi) {
      status = 'missing_meaning';
      statusMessage = 'Chưa có nghĩa tiếng Việt';
    } else if (!topic && !unit) {
      status = 'unassigned_category';
      statusMessage = 'Chưa gán Topic hoặc Unit';
    }

    result.push({
      id: `parsed_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      selected: Boolean(cleanWord && meaning_vi),
      word: cleanWord,
      pos,
      phonetic_uk: phonetic_uk || undefined,
      phonetic_us: phonetic_us || undefined,
      meaning_vi,
      example_en: example_en || undefined,
      example_vi: example_vi || undefined,
      collocations: collocations.length > 0 ? collocations : undefined,
      notes: notes || undefined,
      topic: topic || undefined,
      unit: unit || undefined,
      study_date,
      status,
      statusMessage: statusMessage || undefined,
    });
  });

  return result;
}

/**
 * Parse structured text lines (e.g. appointment (n) – cuộc hẹn)
 */
export function parseStructuredText(
  rawText: string,
  defaultTopic?: string,
  defaultUnit?: string
): ParsedVocabularyRow[] {
  const lines = rawText.split(/\r?\n/);
  const result: ParsedVocabularyRow[] = [];
  const today = new Date().toISOString().split('T')[0];

  let currentTopic = defaultTopic || '';
  let currentUnit = defaultUnit || '';

  // Patterns for lines:
  // 1. Heading check:
  // "Unit 1: Business", "Lesson 02 - Contracts", "Topic: Office"
  const unitHeaderRegex = /^(?:Unit|Lesson|Bài)\s*(\d+)?[:\s–—-]+([^\n\r]+)/i;
  const topicHeaderRegex = /^(?:Topic|Chủ đề)[:\s–—-]+([^\n\r]+)/i;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check unit header
    const unitMatch = rawLine.match(unitHeaderRegex);
    if (unitMatch) {
      currentUnit = rawLine.replace(/^#+\s*/, '').trim();
      continue;
    }

    // Check topic header
    const topicMatch = rawLine.match(topicHeaderRegex);
    if (topicMatch) {
      currentTopic = topicMatch[1].trim();
      continue;
    }

    // Pattern A: Word with POS and IPA and Meaning
    // e.g.: appointment /əˈpɔɪntmənt/ (n): cuộc hẹn - We made an appointment.
    // e.g.: schedule (v/n) – lên lịch trình; lịch trình
    // e.g.: 1. candidate (n) - ứng viên
    // e.g.: make an appointment - đặt lịch hẹn
    const vocabRow = parseVocabLine(rawLine, i, currentTopic, currentUnit, today);
    if (vocabRow) {
      result.push(vocabRow);
    }
  }

  return result;
}

/**
 * Detailed line-level parser for single vocabulary entries
 */
function parseVocabLine(
  line: string,
  index: number,
  topic?: string,
  unit?: string,
  today?: string
): ParsedVocabularyRow | null {
  // Strip leading list numbering e.g. "1. ", "12) ", "- ", "• "
  let cleaned = line.replace(/^[\d+.)\-–—*•\s]+/, '').trim();
  if (!cleaned) return null;

  let word = '';
  let pos: PartOfSpeech = 'noun';
  let phonetic = '';
  let meaning = '';
  let example = '';

  // 1. Check for tab separation (often pasted from Excel or Quizlet)
  if (cleaned.includes('\t')) {
    const parts = cleaned.split('\t').map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length >= 2) {
      word = parts[0];
      meaning = parts[1];
      if (parts[2]) {
        // Can be POS or example
        if (['noun', 'verb', 'adj', 'adv', 'v', 'n'].includes(parts[2].toLowerCase())) {
          pos = normalizePartOfSpeech(parts[2]);
        } else {
          example = parts[2];
        }
      }
      if (parts[3] && !example) {
        example = parts[3];
      }
    }
  }

  // 2. Regex-based pattern: Word ... [IPA]? ... (POS)? ... Separator ... Meaning ... [Separator Example]?
  if (!word) {
    // Extract IPA if inside /.../ or [...]
    const ipaMatch = cleaned.match(/[\/\[]([^\/\]]+)[\/\]]/);
    if (ipaMatch) {
      phonetic = ipaMatch[1].trim();
      cleaned = cleaned.replace(ipaMatch[0], ' ').trim();
    }

    // Extract POS if inside (...)
    const posMatch = cleaned.match(/\(([a-zA-Z\s\/]+)\)/);
    if (posMatch) {
      pos = normalizePartOfSpeech(posMatch[1]);
      cleaned = cleaned.replace(posMatch[0], ' ').trim();
    }

    // Split word and meaning by delimiter: " : ", " - ", " – ", " — ", " = ", or ":"
    const delimMatch = cleaned.match(/\s*[:=–—-]\s*/);
    if (delimMatch && delimMatch.index !== undefined) {
      word = cleaned.substring(0, delimMatch.index).trim();
      const rest = cleaned.substring(delimMatch.index + delimMatch[0].length).trim();

      // Check if rest contains example separator like " (Ex: ...)" or " - Example: "
      const exMatch = rest.match(/(?:[-–—]\s*(?:Ex|Ví dụ|Example):?|\((?:Ex|Ví dụ|Example):?\s*)([^)]*)\)?/i);
      if (exMatch && exMatch.index !== undefined) {
        meaning = rest.substring(0, exMatch.index).trim();
        example = exMatch[1].trim();
      } else {
        meaning = rest;
      }
    } else {
      // If no standard delimiter, check if line starts with English word(s) followed by Vietnamese characters
      const langSplit = cleaned.match(/^([a-zA-Z\s'-]{2,35})\s+([^\x00-\x7F].+)$/);
      if (langSplit) {
        word = langSplit[1].trim();
        meaning = langSplit[2].trim();
      }
    }
  }

  if (!word || word.length < 2) return null;

  // Filter out lines that are obvious sentences or instructions
  if (word.split(/\s+/).length > 6 || word.endsWith('.') || word.endsWith('?')) {
    return null;
  }

  let status: ParsedVocabularyRow['status'] = 'valid';
  let statusMessage = '';

  if (!word) {
    status = 'missing_word';
    statusMessage = 'Thiếu từ tiếng Anh';
  } else if (!meaning) {
    status = 'missing_meaning';
    statusMessage = 'Chưa nhận diện được nghĩa';
  } else if (!topic && !unit) {
    status = 'unassigned_category';
    statusMessage = 'Chưa xác định Topic/Unit';
  }

  return {
    id: `txt_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
    selected: Boolean(word && meaning),
    word,
    pos,
    phonetic_us: phonetic || undefined,
    meaning_vi: meaning,
    example_en: example || undefined,
    topic: topic || undefined,
    unit: unit || undefined,
    study_date: today || new Date().toISOString().split('T')[0],
    status,
    statusMessage: statusMessage || undefined,
  };
}

/**
 * Freeform document parser (Mode B):
 * Analyzes unstructured document, extracts vocabulary candidates and assigns detected Topics / Units.
 */
export function parseFreeformDocument(
  docData: ExtractedDocumentData,
  defaultTopic?: string,
  defaultUnit?: string
): ParsedVocabularyRow[] {
  const lines = docData.rawText.split(/\r?\n/);
  const candidates: ParsedVocabularyRow[] = [];
  const today = new Date().toISOString().split('T')[0];

  let currentTopic = defaultTopic || docData.detectedTopics[0] || '';
  let currentUnit = defaultUnit || docData.detectedUnits[0] || '';

  const unitRegex = /^(?:Unit|Lesson|Bài)\s*(\d+)?[:\s–—-]+([^\n\r]+)/i;
  const topicRegex = /^(?:Topic|Chủ đề)[:\s–—-]+([^\n\r]+)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check headings
    const unitMatch = line.match(unitRegex);
    if (unitMatch) {
      currentUnit = line.replace(/^[#*•\s]+/, '').trim();
      continue;
    }

    const topicMatch = line.match(topicRegex);
    if (topicMatch) {
      currentTopic = topicMatch[1].trim();
      continue;
    }

    // Try structured line parser first
    const vocab = parseVocabLine(line, i, currentTopic, currentUnit, today);
    if (vocab) {
      candidates.push(vocab);
      continue;
    }

    // Heuristic candidate extraction:
    // Look for lines with bold markers (from markdown), bullet points, or "Term: Meaning"
    const termDefMatch = line.match(/^[*•-]?\s*([A-Za-z\s'-]{2,30})\s*[:=]\s*(.+)$/);
    if (termDefMatch) {
      const term = termDefMatch[1].trim();
      const def = termDefMatch[2].trim();

      // Ensure term is not an instruction or label like "Note", "Warning", "Question"
      const lowerTerm = term.toLowerCase();
      if (!['note', 'notes', 'tip', 'warning', 'question', 'answer', 'part', 'test'].includes(lowerTerm)) {
        candidates.push({
          id: `free_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          selected: true,
          word: term,
          pos: 'noun',
          meaning_vi: def,
          topic: currentTopic || undefined,
          unit: currentUnit || undefined,
          study_date: today,
          status: def ? (currentTopic || currentUnit ? 'valid' : 'unassigned_category') : 'missing_meaning',
          statusMessage: !def ? 'Chưa nhận diện được nghĩa' : !currentTopic && !currentUnit ? 'Chưa xác định Topic/Unit' : undefined,
        });
      }
    }
  }

  return candidates;
}

/**
 * Universal analysis function: runs appropriate parsing mode and returns preview rows
 */
export function analyzeExtractedDocument(
  docData: ExtractedDocumentData,
  mode: 'structured' | 'freeform',
  mapping?: ColumnMapping,
  defaultTopic?: string,
  defaultUnit?: string
): ParsedVocabularyRow[] {
  if (mode === 'structured') {
    if (docData.rawRows && docData.rawRows.length > 0 && mapping) {
      return parseTabularData(docData.rawRows, mapping, defaultTopic, defaultUnit);
    }
    return parseStructuredText(docData.rawText, defaultTopic, defaultUnit);
  } else {
    return parseFreeformDocument(docData, defaultTopic, defaultUnit);
  }
}

function parseDateOrFallback(val: string, fallback: string): string {
  if (!val) return fallback;
  // Check if valid ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

  // Check DD/MM/YYYY
  const dmy = val.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return fallback;
}
