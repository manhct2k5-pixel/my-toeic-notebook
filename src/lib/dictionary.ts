import { PartOfSpeech } from '@/types';

export interface DictionarySuggestion {
  word: string;
  pos?: PartOfSpeech;
  phonetic_uk?: string;
  phonetic_us?: string;
  audio_uk?: string;
  audio_us?: string;
  meaning_vi?: string;
  meaning_en?: string;
  example_en?: string;
  collocations?: string[];
}

export async function lookupDictionary(rawWord: string): Promise<DictionarySuggestion | null> {
  const cleanWord = rawWord.trim().toLowerCase().replace(/[^a-zA-Z\s-]/g, '');
  if (!cleanWord) return null;

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'force-cache',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const entry = data[0];
    let phonetic_uk = '';
    let phonetic_us = '';
    let audio_uk = '';
    let audio_us = '';

    if (Array.isArray(entry.phonetics)) {
      for (const p of entry.phonetics) {
        const audioUrl: string = p.audio || '';
        const text: string = p.text || '';

        if (audioUrl.includes('-uk.') || audioUrl.includes('/uk/')) {
          if (!audio_uk) audio_uk = audioUrl;
          if (!phonetic_uk && text) phonetic_uk = text;
        } else if (audioUrl.includes('-us.') || audioUrl.includes('/us/')) {
          if (!audio_us) audio_us = audioUrl;
          if (!phonetic_us && text) phonetic_us = text;
        } else if (audioUrl) {
          if (!audio_us) audio_us = audioUrl;
        }

        if (text && !phonetic_us && !phonetic_uk) {
          phonetic_us = text;
          phonetic_uk = text;
        }
      }
    }

    if (!phonetic_uk && entry.phonetic) {
      phonetic_uk = entry.phonetic;
      phonetic_us = entry.phonetic;
    }

    let detectedPos: PartOfSpeech = 'noun';
    let meaning_en = '';
    let example_en = '';
    const collocations: string[] = [];

    if (Array.isArray(entry.meanings) && entry.meanings.length > 0) {
      const firstMeaning = entry.meanings[0];
      const rawPos = (firstMeaning.partOfSpeech || '').toLowerCase();
      
      if (['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'phrase', 'idiom'].includes(rawPos)) {
        detectedPos = rawPos as PartOfSpeech;
      }

      if (Array.isArray(firstMeaning.definitions) && firstMeaning.definitions.length > 0) {
        const def = firstMeaning.definitions[0];
        meaning_en = def.definition || '';
        example_en = def.example || '';

        // Extract synonyms or related collocations if available
        if (Array.isArray(firstMeaning.synonyms) && firstMeaning.synonyms.length > 0) {
          firstMeaning.synonyms.slice(0, 3).forEach((syn: string) => {
            collocations.push(`Synonym: ${syn}`);
          });
        }
      }
    }

    return {
      word: entry.word || cleanWord,
      pos: detectedPos,
      phonetic_uk: phonetic_uk || undefined,
      phonetic_us: phonetic_us || undefined,
      audio_uk: audio_uk || undefined,
      audio_us: audio_us || undefined,
      meaning_en: meaning_en || undefined,
      example_en: example_en || undefined,
      collocations: collocations.length > 0 ? collocations : undefined,
    };
  } catch {
    // Return null when fetch fails, offline or not found
    return null;
  }
}
