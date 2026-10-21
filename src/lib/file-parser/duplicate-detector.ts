import { VocabularyItem } from '@/types';
import { ParsedVocabularyRow } from './types';

/**
 * Standardize word for robust duplicate detection
 */
export function normalizeWordString(word: string): string {
  if (!word) return '';
  return word
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^['"“‘]+|['"”’]+$/g, '');
}

/**
 * Checks parsed rows against existing vocabulary items in the notebook and intra-file duplicates.
 */
export function detectDuplicates(
  parsedRows: ParsedVocabularyRow[],
  existingVocabulary: VocabularyItem[]
): ParsedVocabularyRow[] {
  // Map of existing vocabulary by normalized word text
  const existingMap = new Map<string, VocabularyItem>();
  existingVocabulary.forEach((item) => {
    const key = normalizeWordString(item.word);
    if (!existingMap.has(key)) {
      existingMap.set(key, item);
    }
  });

  // Track seen words in current batch to catch intra-file duplicates
  const seenInBatch = new Map<string, string>(); // key -> rowId

  return parsedRows.map((row) => {
    const cleanKey = normalizeWordString(row.word);
    if (!cleanKey) return row;

    // Check notebook duplicates
    const existing = existingMap.get(cleanKey);
    if (existing) {
      const posMatches = existing.pos === row.pos;
      const msg = posMatches
        ? `Trùng với từ "${existing.word}" đã có trong sổ tay`
        : `Trùng từ "${existing.word}" nhưng khác loại từ (sổ: ${existing.pos}, file: ${row.pos})`;

      return {
        ...row,
        status: 'duplicate',
        statusMessage: msg,
        existingWordId: existing.id,
        existingWordText: existing.word,
      };
    }

    // Check intra-file duplicate
    if (seenInBatch.has(cleanKey)) {
      return {
        ...row,
        status: 'duplicate',
        statusMessage: `Từ "${row.word}" xuất hiện nhiều lần trong file`,
      };
    }

    seenInBatch.set(cleanKey, row.id);
    return row;
  });
}
