'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookPlus, 
  Sparkles, 
  Tag, 
  Layers, 
  CheckCircle2, 
  Volume2, 
  AlertCircle 
} from 'lucide-react';
import { Topic, Unit, VocabularyItem, PartOfSpeech } from '@/types';
import { lookupDictionary } from '@/lib/dictionary';
import { playAudioOrSpeak } from '@/lib/speech';
import { saveWord, findWordByText } from '@/lib/storage';
import { getTodayISO } from '@/lib/srs';

interface SaveWordModalProps {
  isOpen: boolean;
  selectedText: string;
  contextSentence?: string;
  sourceLessonTitle: string;
  sourceType: 'listening' | 'reading';
  topics: Topic[];
  units: Unit[];
  onClose: () => void;
  onSuccess: (word: VocabularyItem) => void;
}

export function SaveWordModal({
  isOpen,
  selectedText,
  contextSentence,
  sourceLessonTitle,
  sourceType,
  topics,
  units,
  onClose,
  onSuccess,
}: SaveWordModalProps) {
  const [wordText, setWordText] = useState('');
  const [pos, setPos] = useState<PartOfSpeech>('noun');
  const [meaningVi, setMeaningVi] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingWord, setExistingWord] = useState<VocabularyItem | null>(null);

  useEffect(() => {
    if (isOpen && selectedText) {
      const clean = selectedText.trim().replace(/[.,!?;:"'()]/g, '');
      setWordText(clean);
      setMeaningVi('');
      setPhonetic('');
      setAudioUrl('');
      setNotes('');
      setSelectedTopicId(topics[0]?.id || '');
      setSelectedUnitId(units[0]?.id || '');

      // Check if duplicate exists
      findWordByText(clean).then((existing) => {
        if (existing) {
          setExistingWord(existing);
          setMeaningVi(existing.meaning_vi || '');
          setPos(existing.pos || 'noun');
          setPhonetic(existing.phonetic_us || existing.phonetic_uk || '');
        } else {
          setExistingWord(null);
          // Auto lookup dictionary
          setIsLookingUp(true);
          lookupDictionary(clean).then((res) => {
            setIsLookingUp(false);
            if (res) {
              if (res.pos) setPos(res.pos);
              if (res.phonetic_us || res.phonetic_uk) {
                setPhonetic(res.phonetic_us || res.phonetic_uk || '');
              }
              if (res.audio_us || res.audio_uk) {
                setAudioUrl(res.audio_us || res.audio_uk || '');
              }
            }
          });
        }
      });
    }
  }, [isOpen, selectedText, topics, units]);

  if (!isOpen) return null;

  const handleAudio = () => {
    if (!wordText) return;
    playAudioOrSpeak(wordText, 'us', audioUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordText.trim()) return;

    try {
      setIsSaving(true);
      const saved = await saveWord({
        word: wordText.trim(),
        pos,
        phonetic_us: phonetic,
        audio_us: audioUrl,
        meaning_vi: meaningVi.trim(),
        notes: notes.trim(),
        topic_ids: selectedTopicId ? [selectedTopicId] : [],
        unit_ids: selectedUnitId ? [selectedUnitId] : [],
        study_date: getTodayISO(),
        is_memorized: false,
        needs_review: true,
        sources: [
          {
            type: sourceType,
            lessonTitle: sourceLessonTitle,
            contextSentence: contextSentence || selectedText,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      setIsSaving(false);
      onSuccess(saved);
      onClose();
    } catch {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
              Lưu từ mới vào Sổ từ vựng
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Word Alert */}
        {existingWord && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Từ &quot;{existingWord.word}&quot; đã có trong sổ. Hệ thống sẽ tự động liên kết thêm nguồn bài học này vào hồ sơ từ.
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-3.5">
          {/* Word + Audio */}
          <div className="flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Từ vựng được chọn
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-slate-900">{wordText}</span>
                <span className="text-xs font-semibold text-blue-600">({pos})</span>
                {phonetic && (
                  <span className="text-xs font-mono text-slate-500">{phonetic}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAudio}
              className="p-2 rounded-full bg-white text-blue-600 hover:bg-blue-50 border border-slate-200 shadow-2xs"
              title="Nghe phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Meaning Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nghĩa tiếng Việt <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={meaningVi}
              onChange={(e) => setMeaningVi(e.target.value)}
              placeholder="VD: cuộc hẹn, ngân sách, đàm phán..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoFocus
              required
            />
          </div>

          {/* Context Sentence Auto-attached */}
          {contextSentence && (
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-semibold text-slate-500 text-[10px] uppercase block">
                Câu gốc trong bài Reading:
              </span>
              <p className="text-slate-800 italic">&quot;{contextSentence}&quot;</p>
              <p className="text-[11px] text-blue-600 font-medium">Nguồn: {sourceLessonTitle}</p>
            </div>
          )}

          {/* Topics and Units assignment */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                <Tag className="w-3 h-3 text-blue-600" />
                Gắn Chủ đề:
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value="">-- Không gắn --</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                <Layers className="w-3 h-3 text-indigo-600" />
                Gắn Unit:
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
              >
                <option value="">-- Không gắn --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Personal Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú nhanh vào sổ
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: cụm từ hay gặp trong Part 7..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving || !meaningVi.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu vào My Notebook'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
