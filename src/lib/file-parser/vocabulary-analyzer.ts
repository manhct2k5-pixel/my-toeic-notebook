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
    { field: 'phonetic_uk', keywords: ['ipa uk', 'uk ipa', 'phonetic uk', 'phiên âm uk', 'uk phonetic', 'pronunciation uk', 'bre', 'british', 'uk pronunciation', 'phát âm uk'] },
    { field: 'phonetic_us', keywords: ['ipa us', 'us ipa', 'phonetic us', 'phiên âm us', 'us phonetic', 'ipa', 'phonetic', 'phiên âm', 'pronunciation', 'pronunciation us', 'ame', 'american', 'us pronunciation', 'phát âm', 'phát âm us'] },
    { field: 'example_en', keywords: ['example (en)', 'example en', 'en example', 'ví dụ (en)', 'câu ví dụ', 'ví dụ', 'example', 'sentence', 'ví dụ tiếng anh', 'example sentence'] },
    { field: 'example_vi', keywords: ['example (vi)', 'example vi', 'vi example', 'dịch ví dụ', 'nghĩa ví dụ', 'ví dụ tiếng việt', 'translation', 'dịch', 'example translation', 'bản dịch', 'nghĩa câu ví dụ', 'ví dụ (vi)', 'ví dụ vi'] },
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

// ---------------------------------------------------------------------------
// IPA helpers
// ---------------------------------------------------------------------------

/**
 * Regex that matches content inside /…/ or […] that looks like IPA transcription.
 * IPA content must contain at least one IPA-specific character OR be standard phonetic letters.
 */
const IPA_CONTENT_CHARS = /[əɪʊɔʌɑæðθʃʒŋˈˌːɛɜɒʍɾɻɹɬɮʔβɸçʝɣɥʀħʕɐɨʉɯɤœøɶɞ]/;

function looksLikeIPA(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 1) return false;
  // Must contain at least one IPA-specific character
  if (IPA_CONTENT_CHARS.test(trimmed)) return true;
  // Or be only ASCII letters + common phonetic marks (stress, length, syllable dots)
  if (/^[a-zA-Zˈˌːˑ.ʼ\s\-]+$/.test(trimmed) && trimmed.length >= 2) return true;
  return false;
}

const IPA_BRACKET_REGEX = /(?:\/([^/]+)\/|\[([^\]]+)\])/g;

interface ExtractedIPA {
  phonetic_uk?: string;
  phonetic_us?: string;
}

const UK_LABEL_REGEX = /\b(?:uk|bre|brit(?:ish)?)\b/i;
const US_LABEL_REGEX = /\b(?:us|ame|amer(?:ican)?)\b/i;

/**
 * Extract IPA transcriptions from text, detecting UK/US labels.
 * Returns { phonetic_uk, phonetic_us }.
 * When only one IPA found with no label, it goes to phonetic_us (matching DB convention).
 */
function extractIPAFromText(text: string): ExtractedIPA {
  const result: ExtractedIPA = {};

  // Collect all IPA tokens with their surrounding context
  interface IPAToken {
    raw: string;      // the matched /…/ or […] including delimiters
    content: string;  // inside content
    index: number;    // position in text
  }
  const tokens: IPAToken[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(IPA_BRACKET_REGEX.source, 'g');
  while ((m = re.exec(text)) !== null) {
    const content = (m[1] || m[2] || '').trim();
    if (looksLikeIPA(content)) {
      tokens.push({ raw: m[0], content, index: m.index });
    }
  }

  if (tokens.length === 0) return result;

  if (tokens.length === 1) {
    const token = tokens[0];
    // Check for label around the token
    const before = text.substring(Math.max(0, token.index - 30), token.index);
    const after = text.substring(token.index + token.raw.length, token.index + token.raw.length + 30);
    const context = before + ' ' + after;

    if (UK_LABEL_REGEX.test(context) && !US_LABEL_REGEX.test(context)) {
      result.phonetic_uk = token.content;
    } else if (US_LABEL_REGEX.test(context) && !UK_LABEL_REGEX.test(context)) {
      result.phonetic_us = token.content;
    } else {
      // No label or ambiguous → store in phonetic_us (DB convention)
      result.phonetic_us = token.content;
    }
    return result;
  }

  // Multiple IPA tokens — try to assign UK/US by looking at labels around each
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevTokenEnd = i > 0 ? tokens[i - 1].index + tokens[i - 1].raw.length : 0;
    const nextTokenStart = i < tokens.length - 1 ? tokens[i + 1].index : text.length;

    // Confine context between adjacent tokens (or max 20 chars) to prevent bleeding
    const beforeStart = Math.max(prevTokenEnd, token.index - 20);
    const afterEnd = Math.min(nextTokenStart, token.index + token.raw.length + 20);

    const before = text.substring(beforeStart, token.index);
    const after = text.substring(token.index + token.raw.length, afterEnd);

    // Prioritize 'after' (e.g. /.../ (UK) or /.../ (US)), then 'before' (e.g. UK: /.../)
    if (UK_LABEL_REGEX.test(after)) {
      result.phonetic_uk = result.phonetic_uk || token.content;
    } else if (US_LABEL_REGEX.test(after)) {
      result.phonetic_us = result.phonetic_us || token.content;
    } else if (UK_LABEL_REGEX.test(before)) {
      result.phonetic_uk = result.phonetic_uk || token.content;
    } else if (US_LABEL_REGEX.test(before)) {
      result.phonetic_us = result.phonetic_us || token.content;
    }
  }

  // If we found two tokens but no labels matched, assume first=UK, second=US
  if (!result.phonetic_uk && !result.phonetic_us && tokens.length >= 2) {
    result.phonetic_uk = tokens[0].content;
    result.phonetic_us = tokens[1].content;
  }

  // If only one side was labeled and we have extra unassigned tokens, fill the other side
  if (result.phonetic_uk && !result.phonetic_us) {
    const unassigned = tokens.find(t => t.content !== result.phonetic_uk);
    if (unassigned) result.phonetic_us = unassigned.content;
  } else if (result.phonetic_us && !result.phonetic_uk) {
    const unassigned = tokens.find(t => t.content !== result.phonetic_us);
    if (unassigned) result.phonetic_uk = unassigned.content;
  }

  return result;
}

/**
 * Remove IPA tokens (including surrounding whitespace and UK/US labels) from text.
 */
function stripIPAFromText(text: string): string {
  let clean = text.replace(/\s*(?:\/[^/]+\/|\[[^\]]+\])\s*/g, ' ');
  // Also strip standalone (UK), (US), (BrE), (AmE) labels left behind
  clean = clean.replace(/\s*,?\s*\((?:UK|US|BrE|AmE)\)/gi, ' ');
  clean = clean.replace(/\b(?:UK|US|BrE|AmE)[:\s]+/gi, ' ');
  return clean.replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Example extraction helpers
// ---------------------------------------------------------------------------

interface ExtractedExample {
  example_en?: string;
  example_vi?: string;
}

/**
 * Extract example from inline patterns on the same line as the word/meaning.
 * Patterns: (Ex: ...), - Ex: ..., Example: ..., Ví dụ: ..., or "meaning - English sentence."
 */
function extractExampleFromText(text: string): ExtractedExample {
  const result: ExtractedExample = {};

  // Pattern 1: (Ex: …) or (Ví dụ: …) or (Example: …)
  const parenExMatch = text.match(/\((?:Ex|Ví dụ|Example):?\s*([^)]+)\)/i);
  if (parenExMatch) {
    result.example_en = parenExMatch[1].trim();
    return result;
  }

  // Pattern 2: - Ex: …  or – Example: … at end of text
  const dashExMatch = text.match(/[-–—]\s*(?:Ex|Ví dụ|Example|e\.g\.):?\s+(.+)$/i);
  if (dashExMatch) {
    result.example_en = dashExMatch[1].trim();
    return result;
  }

  // Pattern 3: Inline sentence after dash, e.g. "cuộc hẹn - Please schedule an appointment with Dr. Smith."
  const sentenceMatch = text.match(/[-–—]\s+([A-Z][a-zA-Z0-9\s,'".\-]{8,}\.)(?:\s*[-–—]\s*(.+))?$/);
  if (sentenceMatch) {
    const candidateEn = sentenceMatch[1].trim();
    if (!isVietnameseText(candidateEn) && candidateEn.split(/\s+/).length >= 3) {
      result.example_en = candidateEn;
      if (sentenceMatch[2] && isVietnameseText(sentenceMatch[2])) {
        result.example_vi = sentenceMatch[2].trim();
      }
      return result;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Multi-line entry grouping for structured/freeform text
// ---------------------------------------------------------------------------

/** Patterns for lines that start a "continuation" of the current vocab entry */
const MEANING_PREFIX_REGEX = /^(?:Nghĩa|Meaning|Definition|Định nghĩa)\s*[:：]\s*/i;
const IPA_PREFIX_REGEX = /^(?:IPA|Phonetic|Pronunciation|Phiên âm|Phát âm)\s*[:：]\s*/i;
const UK_PREFIX_REGEX = /^(?:UK|BrE|British|Phát âm UK|Phiên âm UK|UK Pronunciation|British Pronunciation)\s*[:：]\s*/i;
const US_PREFIX_REGEX = /^(?:US|AmE|American|Phát âm US|Phiên âm US|US Pronunciation|American Pronunciation)\s*[:：]\s*/i;
const EXAMPLE_PREFIX_REGEX = /^(?:Example|Ví dụ|Ex|e\.g\.)\s*[:：]?\s*/i;
const TRANSLATION_PREFIX_REGEX = /^(?:Dịch|Translation|Bản dịch)\s*[:：]\s*/i;
const ARROW_PREFIX_REGEX = /^[→⇒]\s*/;
const NOTE_PREFIX_REGEX = /^(?:Note|Notes|Ghi chú)\s*[:：]\s*/i;
const COLLOCATION_PREFIX_REGEX = /^(?:Collocation|Collocations|Cụm từ)\s*[:：]\s*/i;

const UNIT_HEADER_REGEX = /^(?:Unit|Lesson|Bài)\s*(\d+)?[:\s–—-]+([^\n\r]+)/i;
const TOPIC_HEADER_REGEX = /^(?:Topic|Chủ đề)[:\s–—-]+([^\n\r]+)/i;

/** POS pattern inside parentheses, e.g. (n), (v/n), (adj), (noun), (verb) - excludes UK/US labels */
const POS_PAREN_REGEX = /\((n|v|adj|adv|prep|conj|pron|phrase|idiom|noun|verb|adjective|adverb|cụm từ|thành ngữ|v\/n|n\/v|vt|vi|adj\/adv|a)(?:\/[a-zA-Z]+)?\)/i;

/** Check if a line contains predominantly Vietnamese characters (for auto-detecting example_vi) */
function isVietnameseText(text: string): boolean {
  // Vietnamese diacritics that don't appear in IPA or English
  const vietChars = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;
  return vietChars.test(text);
}

/** Check if an entire line is just IPA content (only /…/ or [brackets] with possible whitespace) */
function isIPAOnlyLine(line: string): boolean {
  const stripped = line.replace(/(?:\/[^/]+\/|\[[^\]]+\])/g, '').trim();
  return stripped.length === 0 && IPA_BRACKET_REGEX.test(line);
}

/**
 * Detect whether a line looks like a vocab start line (has an English word with optional POS/IPA/meaning).
 * Returns true if it appears to be a new vocab entry, false if it's a continuation or heading.
 */
function isVocabStartLine(line: string): boolean {
  // Must not be empty
  if (!line.trim()) return false;

  const cleaned = line.replace(/^[\d+.)\-–—*•\s]+/, '').trim();
  if (!cleaned) return false;

  // Must start with Latin characters (English word)
  if (!/^[a-zA-Z]/.test(cleaned)) return false;

  // Tab-separated entries are vocab start lines
  if (cleaned.includes('\t')) return true;

  // Must not be a heading
  if (UNIT_HEADER_REGEX.test(cleaned) || TOPIC_HEADER_REGEX.test(cleaned)) return false;

  // Must not be a continuation prefix line
  if (MEANING_PREFIX_REGEX.test(cleaned) || IPA_PREFIX_REGEX.test(cleaned) ||
      UK_PREFIX_REGEX.test(cleaned) || US_PREFIX_REGEX.test(cleaned) ||
      EXAMPLE_PREFIX_REGEX.test(cleaned) || TRANSLATION_PREFIX_REGEX.test(cleaned) ||
      NOTE_PREFIX_REGEX.test(cleaned) || COLLOCATION_PREFIX_REGEX.test(cleaned)) {
    return false;
  }

  // Check for typical vocab patterns:
  // - Has a delimiter (–, -, :, =) separating word from meaning
  // - Has POS in parentheses
  // - Has IPA
  // - Is a short English phrase (not a full sentence)
  const hasDelimiter = /\s*[:=–—]\s*|(?:\s+-\s*|\s*-\s+|\)\s*-\s*)/.test(cleaned);
  const hasPOS = POS_PAREN_REGEX.test(cleaned);
  const hasIPA = /[/\[].*[əɪʊɔʌɑæðθʃʒŋˈˌː].*[/\]]/.test(cleaned);
  const hasTab = cleaned.includes('\t');
  const wordCount = cleaned.split(/\s+/).length;

  // If has any vocab indicator, it's a start line
  if (hasDelimiter || hasPOS || hasIPA || hasTab) return true;

  // Short English-only text (1-5 words) can be a word entry without meaning
  if (wordCount <= 5 && /^[a-zA-Z\s'-]+$/.test(cleaned)) return true;

  return false;
}

/**
 * Accumulated data for a multi-line vocab entry being built.
 */
interface VocabEntryBuilder {
  word: string;
  pos: PartOfSpeech;
  phonetic_uk?: string;
  phonetic_us?: string;
  meaning_vi: string;
  example_en?: string;
  example_vi?: string;
  collocations?: string[];
  notes?: string;
  lastFieldWasExampleEn: boolean;
  hadDelimiter?: boolean;
}

/**
 * Parse a single vocab "start line" into a VocabEntryBuilder.
 * Extracts word, POS, IPA, meaning, and inline example.
 */
function parseVocabStartLine(rawLine: string): VocabEntryBuilder | null {
  let cleaned = rawLine.replace(/^[\d+.)\-–—*•\s]+/, '').trim();
  if (!cleaned) return null;

  const entry: VocabEntryBuilder = {
    word: '',
    pos: 'noun',
    meaning_vi: '',
    lastFieldWasExampleEn: false,
  };

  // 1. Tab-separated handling (often pasted from Excel / Quizlet)
  if (cleaned.includes('\t')) {
    const parts = cleaned.split('\t').map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length >= 2) {
      entry.word = parts[0];
      entry.meaning_vi = parts[1];
      if (parts.length >= 3) {
        const third = parts[2];
        if (['noun', 'verb', 'adj', 'adv', 'v', 'n', 'phrase', 'idiom'].includes(third.toLowerCase())) {
          entry.pos = normalizePartOfSpeech(third);
          if (parts[3]) entry.example_en = parts[3];
        } else {
          // Could be POS from normalizePartOfSpeech
          const normalizedPos = normalizePartOfSpeech(third);
          if (normalizedPos !== 'other') {
            entry.pos = normalizedPos;
            if (parts[3]) entry.example_en = parts[3];
          } else {
            entry.example_en = third;
          }
        }
      }
      return entry;
    }
  }

  // 2. Extract IPA
  const ipa = extractIPAFromText(cleaned);
  if (ipa.phonetic_uk) entry.phonetic_uk = ipa.phonetic_uk;
  if (ipa.phonetic_us) entry.phonetic_us = ipa.phonetic_us;
  cleaned = stripIPAFromText(cleaned);

  // 3. Extract POS if inside (...)
  const posMatch = cleaned.match(POS_PAREN_REGEX);
  if (posMatch) {
    entry.pos = normalizePartOfSpeech(posMatch[1]);
    cleaned = cleaned.replace(posMatch[0], ' ').trim();
  }

  // 4. Extract inline example
  const inlineExample = extractExampleFromText(cleaned);
  if (inlineExample.example_en) {
    entry.example_en = inlineExample.example_en;
    if (inlineExample.example_vi) {
      entry.example_vi = inlineExample.example_vi;
    }
    // Remove the example patterns from cleaned
    cleaned = cleaned
      .replace(/\((?:Ex|Ví dụ|Example):?\s*[^)]+\)/i, '')
      .replace(/[-–—]\s*(?:Ex|Ví dụ|Example|e\.g\.):?\s+.+$/i, '');

    const exIdx = cleaned.indexOf(inlineExample.example_en);
    if (exIdx !== -1) {
      cleaned = cleaned.substring(0, exIdx).replace(/[-–—]\s*$/, '').trim();
    }
    cleaned = cleaned.trim();
  }

  // 5. Split word and meaning by delimiter: "–", "—", "-", ":", "="
  // Colons, equals, en-dash, em-dash are always delimiters (never part of words)
  let delimMatch = cleaned.match(/\s*[:=–—]\s*/);
  // For hyphen "-", only treat as delimiter if it has whitespace or is preceded by ")" or at line end
  if (!delimMatch) {
    delimMatch = cleaned.match(/(?:\s+-\s*|\s*-\s+|\)\s*-\s*)/);
  }

  if (delimMatch && delimMatch.index !== undefined) {
    entry.word = cleaned.substring(0, delimMatch.index).trim();
    const rest = cleaned.substring(delimMatch.index + delimMatch[0].length).trim();
    entry.meaning_vi = rest;
    entry.hadDelimiter = true;
  } else {
    // No delimiter found — check if line is just the word (meaning may come on next line)
    // Or: English word(s) followed by Vietnamese text
    const langSplit = cleaned.match(/^([a-zA-Z\s'-]{2,35})\s+([^\x00-\x7F].+)$/);
    if (langSplit) {
      entry.word = langSplit[1].trim();
      entry.meaning_vi = langSplit[2].trim();
    } else {
      // Just the word, no meaning on this line
      entry.word = cleaned;
    }
  }

  if (!entry.word || entry.word.length < 2) return null;

  // Filter out lines that are obvious sentences or instructions
  if (entry.word.split(/\s+/).length > 6 || entry.word.endsWith('.') || entry.word.endsWith('?')) {
    return null;
  }

  return entry;
}

/**
 * Finalize a VocabEntryBuilder into a ParsedVocabularyRow, returning null if invalid.
 */
function finalizeEntry(
  builder: VocabEntryBuilder,
  index: number,
  topic: string,
  unit: string,
  today: string,
  idPrefix: string
): ParsedVocabularyRow | null {
  const word = builder.word.replace(/^[\d+.)\-–—*\s]+/, '').trim();
  if (!word || word.length < 2) return null;

  // Filter obvious sentences
  if (word.split(/\s+/).length > 6 || word.endsWith('.') || word.endsWith('?')) {
    return null;
  }

  let status: ParsedVocabularyRow['status'] = 'valid';
  let statusMessage = '';

  if (!word) {
    status = 'missing_word';
    statusMessage = 'Thiếu từ tiếng Anh';
  } else if (!builder.meaning_vi) {
    status = 'missing_meaning';
    statusMessage = 'Chưa nhận diện được nghĩa';
  } else if (!topic && !unit) {
    status = 'unassigned_category';
    statusMessage = 'Chưa xác định Topic/Unit';
  }

  return {
    id: `${idPrefix}_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
    selected: Boolean(word && builder.meaning_vi),
    word,
    pos: builder.pos,
    phonetic_uk: builder.phonetic_uk || undefined,
    phonetic_us: builder.phonetic_us || undefined,
    meaning_vi: builder.meaning_vi,
    example_en: builder.example_en || undefined,
    example_vi: builder.example_vi || undefined,
    collocations: builder.collocations && builder.collocations.length > 0 ? builder.collocations : undefined,
    notes: builder.notes || undefined,
    topic: topic || undefined,
    unit: unit || undefined,
    study_date: today,
    status,
    statusMessage: statusMessage || undefined,
  };
}

/**
 * Process continuation lines, updating the current VocabEntryBuilder.
 * Returns true if the line was consumed as a continuation.
 */
function processContinuationLine(line: string, builder: VocabEntryBuilder): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Meaning prefix: "Nghĩa:", "Meaning:", "Definition:"
  const meaningMatch = trimmed.match(MEANING_PREFIX_REGEX);
  if (meaningMatch) {
    const val = trimmed.substring(meaningMatch[0].length).trim();
    if (val) {
      builder.meaning_vi = builder.meaning_vi ? builder.meaning_vi + '; ' + val : val;
    }
    builder.lastFieldWasExampleEn = false;
    return true;
  }

  // UK IPA prefix: "UK:", "BrE:"
  const ukMatch = trimmed.match(UK_PREFIX_REGEX);
  if (ukMatch) {
    const rest = trimmed.substring(ukMatch[0].length).trim();
    const ipa = extractIPAFromText(rest);
    if (ipa.phonetic_us) {
      // extractIPAFromText defaults to phonetic_us when unlabeled,
      // but we know this is UK from the prefix
      builder.phonetic_uk = ipa.phonetic_us;
    } else if (ipa.phonetic_uk) {
      builder.phonetic_uk = ipa.phonetic_uk;
    } else {
      // Raw text after prefix — might be IPA without brackets
      const rawIPA = rest.replace(/[/[\]]/g, '').trim();
      if (rawIPA) builder.phonetic_uk = rawIPA;
    }
    builder.lastFieldWasExampleEn = false;
    return true;
  }

  // US IPA prefix: "US:", "AmE:"
  const usMatch = trimmed.match(US_PREFIX_REGEX);
  if (usMatch) {
    const rest = trimmed.substring(usMatch[0].length).trim();
    const ipa = extractIPAFromText(rest);
    if (ipa.phonetic_us) {
      builder.phonetic_us = ipa.phonetic_us;
    } else if (ipa.phonetic_uk) {
      builder.phonetic_us = ipa.phonetic_uk;
    } else {
      const rawIPA = rest.replace(/[/[\]]/g, '').trim();
      if (rawIPA) builder.phonetic_us = rawIPA;
    }
    builder.lastFieldWasExampleEn = false;
    return true;
  }

  // Generic IPA prefix: "IPA:", "Phonetic:", "Pronunciation:", "Phiên âm:", "Phát âm:"
  const ipaMatch = trimmed.match(IPA_PREFIX_REGEX);
  if (ipaMatch) {
    const rest = trimmed.substring(ipaMatch[0].length).trim();
    const ipa = extractIPAFromText(rest);
    if (ipa.phonetic_uk) builder.phonetic_uk = builder.phonetic_uk || ipa.phonetic_uk;
    if (ipa.phonetic_us) builder.phonetic_us = builder.phonetic_us || ipa.phonetic_us;
    if (!ipa.phonetic_uk && !ipa.phonetic_us) {
      // Raw IPA text
      const rawIPA = rest.replace(/[/[\]]/g, '').trim();
      if (rawIPA && !builder.phonetic_us) builder.phonetic_us = rawIPA;
    }
    builder.lastFieldWasExampleEn = false;
    return true;
  }

  // Example prefix: "Example:", "Ví dụ:", "Ex:", "e.g."
  const exMatch = trimmed.match(EXAMPLE_PREFIX_REGEX);
  if (exMatch) {
    const val = trimmed.substring(exMatch[0].length).trim();
    if (val) {
      builder.example_en = val;
      builder.lastFieldWasExampleEn = true;
    }
    return true;
  }

  // Translation prefix: "Dịch:", "Translation:", "Bản dịch:"
  const transMatch = trimmed.match(TRANSLATION_PREFIX_REGEX);
  if (transMatch) {
    const val = trimmed.substring(transMatch[0].length).trim();
    if (val) builder.example_vi = val;
    builder.lastFieldWasExampleEn = false;
    return true;
  }

  // Arrow prefix: "→", "⇒"
  const arrowMatch = trimmed.match(ARROW_PREFIX_REGEX);
  if (arrowMatch) {
    const val = trimmed.substring(arrowMatch[0].length).trim();
    if (val) builder.example_vi = val;
    builder.lastFieldWasExampleEn = false;
    return true;
  }

  // Note prefix: "Note:", "Ghi chú:"
  const noteMatch = trimmed.match(NOTE_PREFIX_REGEX);
  if (noteMatch) {
    const val = trimmed.substring(noteMatch[0].length).trim();
    if (val) builder.notes = builder.notes ? builder.notes + '; ' + val : val;
    builder.lastFieldWasExampleEn = false;
    return true;
  }

  // Collocation prefix: "Collocation:", "Cụm từ:"
  const collMatch = trimmed.match(COLLOCATION_PREFIX_REGEX);
  if (collMatch) {
    const val = trimmed.substring(collMatch[0].length).trim();
    if (val) {
      const items = val.split(/[;,|]+/).map((c) => c.trim()).filter((c) => c.length > 0);
      builder.collocations = builder.collocations ? [...builder.collocations, ...items] : items;
    }
    builder.lastFieldWasExampleEn = false;
    return true;
  }

  // IPA-only line (just /…/ or [brackets] with no other text)
  if (isIPAOnlyLine(trimmed)) {
    const ipa = extractIPAFromText(trimmed);
    if (ipa.phonetic_uk) builder.phonetic_uk = builder.phonetic_uk || ipa.phonetic_uk;
    if (ipa.phonetic_us) builder.phonetic_us = builder.phonetic_us || ipa.phonetic_us;
    builder.lastFieldWasExampleEn = false;
    return true;
  }

  // Vietnamese text line immediately after English example → example_vi
  if (builder.lastFieldWasExampleEn && builder.example_en && !builder.example_vi && isVietnameseText(trimmed)) {
    builder.example_vi = trimmed;
    builder.lastFieldWasExampleEn = false;
    return true;
  }

  // Standalone English sentence that could be an example (only if we have a word but no example yet)
  // Heuristic: starts with uppercase, ends with period, and has > 3 words
  if (builder.word && !builder.example_en && /^[A-Z]/.test(trimmed) && trimmed.endsWith('.') && trimmed.split(/\s+/).length > 3) {
    builder.example_en = trimmed;
    builder.lastFieldWasExampleEn = true;
    return true;
  }

  return false;
}

/**
 * Parse structured text lines using multi-line grouping.
 * Handles entries that span multiple lines (IPA, meaning, example, translation on separate lines).
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

  let currentBuilder: VocabEntryBuilder | null = null;
  let entryIndex = 0;

  function flushEntry(): void {
    if (currentBuilder) {
      const row = finalizeEntry(currentBuilder, entryIndex, currentTopic, currentUnit, today, 'txt');
      if (row) {
        result.push(row);
        entryIndex++;
      }
      currentBuilder = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check unit header
    const unitMatch = rawLine.match(UNIT_HEADER_REGEX);
    if (unitMatch) {
      flushEntry();
      currentUnit = rawLine.replace(/^#+\s*/, '').trim();
      continue;
    }

    // Check topic header
    const topicMatch = rawLine.match(TOPIC_HEADER_REGEX);
    if (topicMatch) {
      flushEntry();
      currentTopic = topicMatch[1].trim();
      continue;
    }

    // If we have a current entry, try to process as continuation
    if (currentBuilder && processContinuationLine(rawLine, currentBuilder)) {
      continue;
    }

    // Check if this is a new vocab start line
    if (isVocabStartLine(rawLine)) {
      // Finalize previous entry
      flushEntry();

      // Parse this line as a new entry
      currentBuilder = parseVocabStartLine(rawLine);
      continue;
    }

    // Check if line represents a vocab row missing the English word (e.g. "- đây là nghĩa nhưng thiếu từ")
    const missingWordMatch = rawLine.match(/^[-*•\s]*[:=–—-]\s*([^\x00-\x7F].+)$/);
    if (missingWordMatch) {
      flushEntry();
      result.push({
        id: `txt_${Date.now()}_${entryIndex}_${Math.random().toString(36).substring(2, 6)}`,
        selected: false,
        word: '',
        pos: 'noun',
        meaning_vi: missingWordMatch[1].trim(),
        topic: currentTopic || undefined,
        unit: currentUnit || undefined,
        study_date: today,
        status: 'missing_word',
        statusMessage: 'Thiếu từ tiếng Anh',
      });
      entryIndex++;
      continue;
    }

    // Line didn't match anything — if we have a current builder, 
    // check if it could be a Vietnamese meaning (continuation without prefix).
    // Only valid if builder didn't have an explicit delimiter and line is not a new bullet
    if (
      currentBuilder &&
      !currentBuilder.meaning_vi &&
      !currentBuilder.hadDelimiter &&
      !rawLine.match(/^[-*•\d+.)]/) &&
      isVietnameseText(rawLine)
    ) {
      currentBuilder.meaning_vi = rawLine;
      currentBuilder.lastFieldWasExampleEn = false;
      continue;
    }

    // Standalone line we can't attach — skip it
  }

  // Flush last entry
  flushEntry();

  return result;
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

  let currentBuilder: VocabEntryBuilder | null = null;
  let entryIndex = 0;

  function flushEntry(): void {
    if (currentBuilder) {
      const row = finalizeEntry(currentBuilder, entryIndex, currentTopic, currentUnit, today, 'free');
      if (row) {
        candidates.push(row);
        entryIndex++;
      }
      currentBuilder = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check headings
    const unitMatch = line.match(UNIT_HEADER_REGEX);
    if (unitMatch) {
      flushEntry();
      currentUnit = line.replace(/^[#*•\s]+/, '').trim();
      continue;
    }

    const topicMatch = line.match(TOPIC_HEADER_REGEX);
    if (topicMatch) {
      flushEntry();
      currentTopic = topicMatch[1].trim();
      continue;
    }

    // If we have a current entry, try continuation
    if (currentBuilder && processContinuationLine(line, currentBuilder)) {
      continue;
    }

    // Check if this is a vocab start line
    if (isVocabStartLine(line)) {
      flushEntry();
      currentBuilder = parseVocabStartLine(line);
      continue;
    }

    // Vietnamese meaning without prefix for current entry
    if (
      currentBuilder &&
      !currentBuilder.meaning_vi &&
      !currentBuilder.hadDelimiter &&
      !line.match(/^[-*•\d+.)]/) &&
      isVietnameseText(line)
    ) {
      currentBuilder.meaning_vi = line;
      currentBuilder.lastFieldWasExampleEn = false;
      continue;
    }

    // No current builder — try heuristic extraction for "Term: Meaning" patterns
    if (!currentBuilder) {
      const termDefMatch = line.match(/^[*•-]?\s*([A-Za-z\s'-]{2,30})\s*[:=]\s*(.+)$/);
      if (termDefMatch) {
        const term = termDefMatch[1].trim();
        const def = termDefMatch[2].trim();

        // Ensure term is not an instruction or label
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
  }

  // Flush last entry
  flushEntry();

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
  const dmy = val.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
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
