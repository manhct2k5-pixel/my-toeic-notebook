import { Topic, Unit, VocabularyItem } from '@/types';
import {
  getTopics,
  getUnits,
  getVocabulary,
  saveTopic,
  saveUnit,
  saveWord,
  getCapabilityToken,
  syncWithCloud,
} from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { normalizeWordString } from './duplicate-detector';
import { DuplicateStrategy, ImportSummaryResult, ParsedVocabularyRow } from './types';

// Predefined palette for auto-generated topics
const TOPIC_PALETTE = [
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // rose
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#ea580c', // orange
  '#4f46e5', // indigo
];

/**
 * Normalizes string for loose name comparison (removes redundant spaces, lowercases)
 */
function normalizeName(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function executeImport(
  selectedRows: ParsedVocabularyRow[],
  duplicateStrategy: DuplicateStrategy,
  fallbackTopicId?: string,
  fallbackUnitId?: string
): Promise<ImportSummaryResult> {
  const result: ImportSummaryResult = {
    totalSelected: selectedRows.length,
    addedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    createdTopicsCount: 0,
    createdUnitsCount: 0,
    createdTopicNames: [],
    createdUnitTitles: [],
    errors: [],
    importedWordIds: [],
  };

  if (selectedRows.length === 0) {
    return result;
  }

  // 1. Fetch current topics, units, and vocabulary
  const [existingTopics, existingUnits, existingWords] = await Promise.all([
    getTopics(),
    getUnits(),
    getVocabulary(),
  ]);

  // Topic lookup map (normalized name -> Topic)
  const topicMap = new Map<string, Topic>();
  existingTopics.forEach((t) => topicMap.set(normalizeName(t.name), t));

  // Unit lookup map (normalized title -> Unit)
  const unitMap = new Map<string, Unit>();
  existingUnits.forEach((u) => unitMap.set(normalizeName(u.title), u));

  // Word lookup map (normalized word -> VocabularyItem)
  const wordMap = new Map<string, VocabularyItem>();
  existingWords.forEach((w) => {
    const key = normalizeWordString(w.word);
    if (!wordMap.has(key)) wordMap.set(key, w);
  });

  // 2. Resolve / Create Topics
  const topicIdsToAssign = new Map<string, string>(); // row.id -> topicId
  const unitIdsToAssign = new Map<string, string>();  // row.id -> unitId

  for (const row of selectedRows) {
    // Topic resolution
    const rawTopic = row.topic?.trim();
    if (rawTopic) {
      const norm = normalizeName(rawTopic);
      if (topicMap.has(norm)) {
        topicIdsToAssign.set(row.id, topicMap.get(norm)!.id);
      } else {
        // Create new Topic
        try {
          const color = TOPIC_PALETTE[existingTopics.length % TOPIC_PALETTE.length];
          const newTopic = await saveTopic({
            name: rawTopic,
            description: `Tạo tự động từ file nhập`,
            color,
          });
          topicMap.set(norm, newTopic);
          existingTopics.push(newTopic);
          topicIdsToAssign.set(row.id, newTopic.id);
          result.createdTopicsCount++;
          result.createdTopicNames.push(rawTopic);
        } catch (err: unknown) {
          result.errors.push(`Không thể tạo chủ đề "${rawTopic}": ${err instanceof Error ? err.message : ''}`);
        }
      }
    } else if (fallbackTopicId) {
      topicIdsToAssign.set(row.id, fallbackTopicId);
    }

    // Unit resolution
    const rawUnit = row.unit?.trim();
    if (rawUnit) {
      const norm = normalizeName(rawUnit);
      if (unitMap.has(norm)) {
        unitIdsToAssign.set(row.id, unitMap.get(norm)!.id);
      } else {
        // Create new Unit
        try {
          const newUnit = await saveUnit({
            title: rawUnit,
            description: `Tạo tự động từ file nhập`,
            category: 'General',
          });
          unitMap.set(norm, newUnit);
          existingUnits.push(newUnit);
          unitIdsToAssign.set(row.id, newUnit.id);
          result.createdUnitsCount++;
          result.createdUnitTitles.push(rawUnit);
        } catch (err: unknown) {
          result.errors.push(`Không thể tạo Unit "${rawUnit}": ${err instanceof Error ? err.message : ''}`);
        }
      }
    } else if (fallbackUnitId) {
      unitIdsToAssign.set(row.id, fallbackUnitId);
    }
  }

  // 3. Process each vocabulary row
  const now = new Date().toISOString();
  const dateFormatted = new Date().toLocaleDateString('vi-VN');

  for (const row of selectedRows) {
    try {
      const cleanWord = row.word.trim();
      const cleanMeaning = row.meaning_vi.trim();

      if (!cleanWord || !cleanMeaning) {
        result.failedCount++;
        result.errors.push(`Bỏ qua dòng thiếu thông tin: "${cleanWord || 'Không có từ'}" - "${cleanMeaning || 'Không có nghĩa'}"`);
        continue;
      }

      const key = normalizeWordString(cleanWord);
      const existing = wordMap.get(key);

      const targetTopicId = topicIdsToAssign.get(row.id);
      const targetUnitId = unitIdsToAssign.get(row.id);

      // Handle duplicate word
      if (existing && duplicateStrategy !== 'create_new') {
        if (duplicateStrategy === 'skip') {
          result.skippedCount++;
          continue;
        }

        if (duplicateStrategy === 'merge_notes_and_examples') {
          const mergedNotes = [
            existing.notes || '',
            row.notes ? `\n\n> 📝 Ghi chú từ file (${dateFormatted}):\n${row.notes}` : '',
          ].filter(Boolean).join('');

          const updatedTopicIds = targetTopicId && !existing.topic_ids.includes(targetTopicId)
            ? [...existing.topic_ids, targetTopicId]
            : existing.topic_ids;

          const updatedUnitIds = targetUnitId && !existing.unit_ids.includes(targetUnitId)
            ? [...existing.unit_ids, targetUnitId]
            : existing.unit_ids;

          const updatedExampleEn = existing.example_en
            ? (row.example_en && row.example_en !== existing.example_en
                ? `${existing.example_en}\n• ${row.example_en}`
                : existing.example_en)
            : (row.example_en || '');

          const updatedCollocations = Array.from(new Set([
            ...(existing.collocations || []),
            ...(row.collocations || []),
          ]));

          const saved = await saveWord({
            ...existing,
            notes: mergedNotes,
            example_en: updatedExampleEn,
            collocations: updatedCollocations,
            topic_ids: updatedTopicIds,
            unit_ids: updatedUnitIds,
          });

          wordMap.set(key, saved);
          result.updatedCount++;
          result.importedWordIds.push(saved.id);
          continue;
        }

        if (duplicateStrategy === 'add_topics_units') {
          const updatedTopicIds = targetTopicId && !existing.topic_ids.includes(targetTopicId)
            ? [...existing.topic_ids, targetTopicId]
            : existing.topic_ids;

          const updatedUnitIds = targetUnitId && !existing.unit_ids.includes(targetUnitId)
            ? [...existing.unit_ids, targetUnitId]
            : existing.unit_ids;

          const saved = await saveWord({
            ...existing,
            topic_ids: updatedTopicIds,
            unit_ids: updatedUnitIds,
          });

          wordMap.set(key, saved);
          result.updatedCount++;
          result.importedWordIds.push(saved.id);
          continue;
        }

        if (duplicateStrategy === 'update_fields') {
          const saved = await saveWord({
            ...existing,
            pos: row.pos || existing.pos,
            phonetic_uk: row.phonetic_uk || existing.phonetic_uk,
            phonetic_us: row.phonetic_us || existing.phonetic_us,
            meaning_vi: row.meaning_vi || existing.meaning_vi,
            example_en: row.example_en || existing.example_en,
            example_vi: row.example_vi || existing.example_vi,
            collocations: row.collocations && row.collocations.length > 0 ? row.collocations : existing.collocations,
            notes: row.notes ? (existing.notes ? `${existing.notes}\n\n${row.notes}` : row.notes) : existing.notes,
            topic_ids: targetTopicId && !existing.topic_ids.includes(targetTopicId)
              ? [...existing.topic_ids, targetTopicId]
              : existing.topic_ids,
            unit_ids: targetUnitId && !existing.unit_ids.includes(targetUnitId)
              ? [...existing.unit_ids, targetUnitId]
              : existing.unit_ids,
          });

          wordMap.set(key, saved);
          result.updatedCount++;
          result.importedWordIds.push(saved.id);
          continue;
        }
      }

      // Create new vocabulary item
      const newWordData: Partial<VocabularyItem> & { word: string; meaning_vi: string } = {
        word: cleanWord,
        pos: row.pos || 'noun',
        phonetic_uk: row.phonetic_uk || '',
        phonetic_us: row.phonetic_us || '',
        meaning_vi: cleanMeaning,
        example_en: row.example_en || '',
        example_vi: row.example_vi || '',
        collocations: row.collocations || [],
        notes: row.notes || '',
        study_date: row.study_date || now.split('T')[0],
        topic_ids: targetTopicId ? [targetTopicId] : [],
        unit_ids: targetUnitId ? [targetUnitId] : [],
        is_memorized: false,
        needs_review: true,
        sources: [
          {
            type: 'manual',
            lessonTitle: row.unit || undefined,
            timestamp: now,
          },
        ],
      };

      const saved = await saveWord(newWordData);
      wordMap.set(key, saved);
      result.addedCount++;
      result.importedWordIds.push(saved.id);
    } catch (err: unknown) {
      result.failedCount++;
      result.errors.push(`Lỗi nhập từ "${row.word}": ${err instanceof Error ? err.message : 'Không xác định'}`);
    }
  }

  // 4. Trigger cloud sync if Supabase is connected
  const token = getCapabilityToken();
  if (token && isSupabaseConfigured()) {
    try {
      await syncWithCloud(token, true);
    } catch (err) {
      console.warn('Import cloud sync warning:', err);
    }
  }

  return result;
}
