'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Volume2, 
  BookPlus, 
  AlertCircle, 
  Calendar, 
  Tag, 
  Layers,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { VocabularyItem, Topic, Unit, PartOfSpeech } from '@/types';
import { lookupDictionary } from '@/lib/dictionary';
import { playAudioOrSpeak } from '@/lib/speech';
import { findWordByText, saveWord } from '@/lib/storage';
import { getTodayISO } from '@/lib/srs';

interface WordModalProps {
  isOpen: boolean;
  word?: VocabularyItem | null;
  topics: Topic[];
  units: Unit[];
  initialTopicId?: string;
  initialUnitId?: string;
  initialDate?: string;
  onClose: () => void;
  onSaved: (savedWord: VocabularyItem) => void;
  onSelectExistingWord?: (word: VocabularyItem) => void;
}

const POS_OPTIONS: { value: PartOfSpeech; label: string }[] = [
  { value: 'noun', label: 'Danh từ (n)' },
  { value: 'verb', label: 'Động từ (v)' },
  { value: 'adjective', label: 'Tính từ (adj)' },
  { value: 'adverb', label: 'Trạng từ (adv)' },
  { value: 'phrase', label: 'Cụm từ (phrase)' },
  { value: 'preposition', label: 'Giới từ (prep)' },
  { value: 'conjunction', label: 'Liên từ (conj)' },
  { value: 'idiom', label: 'Thành ngữ (idiom)' },
  { value: 'other', label: 'Khác' },
];

export function WordModal({
  isOpen,
  word,
  topics,
  units,
  initialTopicId,
  initialUnitId,
  initialDate,
  onClose,
  onSaved,
  onSelectExistingWord,
}: WordModalProps) {
  const [wordText, setWordText] = useState('');
  const [pos, setPos] = useState<PartOfSpeech>('noun');
  const [phoneticUk, setPhoneticUk] = useState('');
  const [phoneticUs, setPhoneticUs] = useState('');
  const [audioUk, setAudioUk] = useState('');
  const [audioUs, setAudioUs] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [exampleEn, setExampleEn] = useState('');
  const [exampleVi, setExampleVi] = useState('');
  const [collocationsText, setCollocationsText] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [studyDate, setStudyDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isMemorized, setIsMemorized] = useState(false);

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const [duplicateExisting, setDuplicateExisting] = useState<VocabularyItem | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load word or defaults
  useEffect(() => {
    if (word) {
      setWordText(word.word);
      setPos(word.pos);
      setPhoneticUk(word.phonetic_uk || '');
      setPhoneticUs(word.phonetic_us || '');
      setAudioUk(word.audio_uk || '');
      setAudioUs(word.audio_us || '');
      setMeaningVi(word.meaning_vi || '');
      setExampleEn(word.example_en || '');
      setExampleVi(word.example_vi || '');
      setCollocationsText((word.collocations || []).join('\n'));
      setSelectedTopicIds(word.topic_ids || []);
      setSelectedUnitIds(word.unit_ids || []);
      setStudyDate(word.study_date || getTodayISO());
      setNotes(word.notes || '');
      setIsMemorized(word.is_memorized || false);
    } else {
      setWordText('');
      setPos('noun');
      setPhoneticUk('');
      setPhoneticUs('');
      setAudioUk('');
      setAudioUs('');
      setMeaningVi('');
      setExampleEn('');
      setExampleVi('');
      setCollocationsText('');
      setSelectedTopicIds(initialTopicId ? [initialTopicId] : []);
      setSelectedUnitIds(initialUnitId ? [initialUnitId] : []);
      setStudyDate(initialDate || getTodayISO());
      setNotes('');
      setIsMemorized(false);
    }
    setDuplicateExisting(null);
    setLookupMessage('');
    setError('');
  }, [word, isOpen, initialTopicId, initialUnitId, initialDate]);

  if (!isOpen) return null;

  // Check duplicate on blur
  const handleWordBlur = async () => {
    if (!wordText.trim()) return;
    if (word && word.word.trim().toLowerCase() === wordText.trim().toLowerCase()) return;

    const existing = await findWordByText(wordText);
    if (existing && existing.id !== word?.id) {
      setDuplicateExisting(existing);
    } else {
      setDuplicateExisting(null);
    }
  };

  // Lookup dictionary suggestion
  const handleAutoLookup = async () => {
    if (!wordText.trim()) {
      setError('Vui lòng nhập từ tiếng Anh để tra cứu');
      return;
    }
    setIsLookingUp(true);
    setLookupMessage('');
    setError('');

    const result = await lookupDictionary(wordText);
    setIsLookingUp(false);

    if (result) {
      if (result.pos && !pos) setPos(result.pos);
      if (result.phonetic_uk && !phoneticUk) setPhoneticUk(result.phonetic_uk);
      if (result.phonetic_us && !phoneticUs) setPhoneticUs(result.phonetic_us);
      if (result.audio_uk) setAudioUk(result.audio_uk);
      if (result.audio_us) setAudioUs(result.audio_us);
      if (result.example_en && !exampleEn) setExampleEn(result.example_en);
      if (result.collocations && result.collocations.length > 0 && !collocationsText) {
        setCollocationsText(result.collocations.join('\n'));
      }
      setLookupMessage(
        `Đã gợi ý phiên âm IPA${result.audio_uk || result.audio_us ? ' và phát âm chuẩn' : ''}${result.example_en ? ', ví dụ' : ''}.`
      );
    } else {
      setLookupMessage('Từ điển trực tuyến không tìm thấy từ này. Bạn có thể tự điền thông tin bên dưới.');
    }
  };

  const handleTestAudio = (accent: 'uk' | 'us') => {
    if (!wordText.trim()) return;
    const url = accent === 'uk' ? audioUk : audioUs;
    playAudioOrSpeak(wordText, accent, url);
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordText.trim()) {
      setError('Từ vựng tiếng Anh là bắt buộc');
      return;
    }

    try {
      setIsSaving(true);
      const collocations = collocationsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const saved = await saveWord({
        id: word ? word.id : undefined,
        word: wordText.trim(),
        pos,
        phonetic_uk: phoneticUk.trim(),
        phonetic_us: phoneticUs.trim(),
        audio_uk: audioUk.trim(),
        audio_us: audioUs.trim(),
        meaning_vi: meaningVi.trim(),
        example_en: exampleEn.trim(),
        example_vi: exampleVi.trim(),
        collocations,
        topic_ids: selectedTopicIds,
        unit_ids: selectedUnitIds,
        study_date: studyDate,
        notes: notes.trim(),
        is_memorized: isMemorized,
        needs_review: !isMemorized,
      });

      setIsSaving(false);
      onSaved(saved);
      onClose();
    } catch {
      setIsSaving(false);
      setError('Không thể lưu từ vựng. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-base sm:text-lg">
              {word ? 'Chỉnh sửa từ vựng' : 'Thêm từ mới vào My Notebook'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate alert if found */}
        {duplicateExisting && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  Từ &quot;{duplicateExisting.word}&quot; đã tồn tại trong sổ tay!
                </p>
                <p className="text-amber-800 text-xs">
                  Nghĩa: {duplicateExisting.meaning_vi || '(Chưa có nghĩa)'} • Ngày học: {duplicateExisting.study_date}
                </p>
              </div>
            </div>
            {onSelectExistingWord && (
              <button
                type="button"
                onClick={() => {
                  onSelectExistingWord(duplicateExisting);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 shrink-0"
              >
                Mở từ cũ để bổ sung
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              {error}
            </div>
          )}

          {/* Word + Auto Lookup button */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Từ tiếng Anh <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={wordText}
                onChange={(e) => setWordText(e.target.value)}
                onBlur={handleWordBlur}
                placeholder="VD: appointment, schedule, negotiate..."
                className="flex-1 px-3.5 py-2.5 text-sm sm:text-base font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAutoLookup}
                disabled={isLookingUp || !wordText.trim()}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 disabled:opacity-50 shrink-0"
                title="Gợi ý tự động từ điển chuẩn"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isLookingUp ? 'Đang tra...' : 'Gợi ý từ điển'}
              </button>
            </div>
            {lookupMessage && (
              <p className="text-[11px] text-slate-500 mt-1 italic">{lookupMessage}</p>
            )}
          </div>

          {/* POS + Phonetics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại từ</label>
              <select
                value={pos}
                onChange={(e) => setPos(e.target.value as PartOfSpeech)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {POS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Phiên âm UK</label>
                <button
                  type="button"
                  onClick={() => handleTestAudio('uk')}
                  className="text-blue-600 hover:text-blue-800 text-[11px] flex items-center gap-0.5"
                >
                  <Volume2 className="w-3 h-3" /> Nghe
                </button>
              </div>
              <input
                type="text"
                value={phoneticUk}
                onChange={(e) => setPhoneticUk(e.target.value)}
                placeholder="/əˈpɔɪnt.mənt/"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Phiên âm US</label>
                <button
                  type="button"
                  onClick={() => handleTestAudio('us')}
                  className="text-blue-600 hover:text-blue-800 text-[11px] flex items-center gap-0.5"
                >
                  <Volume2 className="w-3 h-3" /> Nghe
                </button>
              </div>
              <input
                type="text"
                value={phoneticUs}
                onChange={(e) => setPhoneticUs(e.target.value)}
                placeholder="/əˈpɔɪnt.mənt/"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Vietnamese meaning */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nghĩa tiếng Việt
            </label>
            <input
              type="text"
              value={meaningVi}
              onChange={(e) => setMeaningVi(e.target.value)}
              placeholder="VD: cuộc hẹn, sự bổ nhiệm"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Example EN & VI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ví dụ tiếng Anh
              </label>
              <textarea
                value={exampleEn}
                onChange={(e) => setExampleEn(e.target.value)}
                rows={2}
                placeholder="VD: I made an appointment with the director."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dịch ví dụ sang tiếng Việt
              </label>
              <textarea
                value={exampleVi}
                onChange={(e) => setExampleVi(e.target.value)}
                rows={2}
                placeholder="VD: Tôi đã đặt lịch hẹn với giám đốc."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Collocations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Collocations / Cụm từ liên quan (mỗi dòng một cụm)
            </label>
            <textarea
              value={collocationsText}
              onChange={(e) => setCollocationsText(e.target.value)}
              rows={2}
              placeholder="make an appointment: đặt cuộc hẹn&#10;cancel an appointment: hủy cuộc hẹn"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono resize-none"
            />
          </div>

          {/* Topics & Units selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                Gắn vào Chủ đề (Topics)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg border border-slate-200 bg-slate-50/50">
                {topics.map((t) => {
                  const isChecked = selectedTopicIds.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => toggleTopic(t.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? '✓ ' : ''}{t.name}
                    </button>
                  );
                })}
                {topics.length === 0 && (
                  <span className="text-xs text-slate-400 italic">Chưa có chủ đề nào</span>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Gắn vào Unit / Lesson
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg border border-slate-200 bg-slate-50/50">
                {units.map((u) => {
                  const isChecked = selectedUnitIds.includes(u.id);
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => toggleUnit(u.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? '✓ ' : ''}{u.title}
                    </button>
                  );
                })}
                {units.length === 0 && (
                  <span className="text-xs text-slate-400 italic">Chưa có Unit nào</span>
                )}
              </div>
            </div>
          </div>

          {/* Study date + Memory Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Ngày học
              </label>
              <input
                type="date"
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isMemorized}
                  onChange={(e) => setIsMemorized(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  Đã nhớ từ này (thuộc lòng)
                </span>
              </label>
            </div>
          </div>

          {/* Personal Note (Markdown-supported) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Ghi chú cá nhân (hỗ trợ nhiều dòng, mẹo nhớ, cấu trúc)
              </label>
              <span className="text-[11px] text-slate-400">Tự do ghi chú như sổ thật</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="VD: Cấu trúc: schedule a meeting&#10;Mẹo: chú ý phát âm UK ('sh') và US ('sk')"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : word ? 'Cập nhật từ vựng' : 'Lưu vào sổ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
