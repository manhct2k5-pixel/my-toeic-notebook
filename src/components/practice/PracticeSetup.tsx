'use client';

import React, { useState } from 'react';
import { 
  BookMarked, 
  Layers, 
  Tag, 
  Calendar, 
  AlertCircle, 
  Clock, 
  Sparkles,
  Headphones,
  CheckCircle2,
  FileQuestion,
  Shuffle
} from 'lucide-react';
import { Topic, Unit, VocabularyItem, QuizMode, QuizScope } from '@/types';

interface PracticeSetupProps {
  words: VocabularyItem[];
  topics: Topic[];
  units: Unit[];
  onStart: (config: {
    mode: QuizMode;
    scope: QuizScope;
    scopeId?: string;
    questionCount: number;
    filteredWords: VocabularyItem[];
  }) => void;
}

export function PracticeSetup({ words, topics, units, onStart }: PracticeSetupProps) {
  const [mode, setMode] = useState<QuizMode>('flashcard');
  const [scope, setScope] = useState<QuizScope>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || '');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [questionCountChoice, setQuestionCountChoice] = useState<'10' | '20' | '30' | 'all'>('10');

  // Available study dates
  const availableDates = React.useMemo(() => {
    const set = new Set<string>();
    words.forEach((w) => {
      if (w.study_date) set.add(w.study_date);
    });
    return Array.from(set).sort().reverse();
  }, [words]);

  // Compute matching words based on scope
  const targetWords = React.useMemo(() => {
    let list = words;
    if (scope === 'topic' && selectedTopicId) {
      list = list.filter((w) => w.topic_ids.includes(selectedTopicId));
    } else if (scope === 'unit' && selectedUnitId) {
      list = list.filter((w) => w.unit_ids.includes(selectedUnitId));
    } else if (scope === 'date' && selectedDate) {
      list = list.filter((w) => w.study_date === selectedDate);
    } else if (scope === 'unmemorized') {
      list = list.filter((w) => !w.is_memorized);
    } else if (scope === 'incorrect') {
      list = list.filter((w) => w.needs_review || (w.incorrect_count && w.incorrect_count > 0));
    }
    return list;
  }, [words, scope, selectedTopicId, selectedUnitId, selectedDate]);

  const maxAvailable = targetWords.length;

  const handleStart = () => {
    if (targetWords.length === 0) return;

    // Shuffle words
    const shuffled = [...targetWords].sort(() => 0.5 - Math.random());
    const count = questionCountChoice === 'all' ? shuffled.length : Math.min(parseInt(questionCountChoice, 10), shuffled.length);
    const finalWords = shuffled.slice(0, count);

    let scopeId: string | undefined;
    if (scope === 'topic') scopeId = selectedTopicId;
    if (scope === 'unit') scopeId = selectedUnitId;
    if (scope === 'date') scopeId = selectedDate;

    onStart({
      mode,
      scope,
      scopeId,
      questionCount: finalWords.length,
      filteredWords: finalWords,
    });
  };

  const modeOptions: { id: QuizMode; title: string; desc: string; icon: any }[] = [
    {
      id: 'flashcard',
      title: 'Flashcard lật thẻ',
      desc: 'Mặt trước tiếng Anh, mặt sau nghĩa tiếng Việt, ví dụ và ghi chú cá nhân.',
      icon: Sparkles,
    },
    {
      id: 'multiple_choice',
      title: 'Trắc nghiệm 4 đáp án',
      desc: 'Xem từ vựng tiếng Anh và chọn nghĩa tiếng Việt chính xác nhất.',
      icon: CheckCircle2,
    },
    {
      id: 'fill_in',
      title: 'Gõ từ tiếng Anh',
      desc: 'Cho nghĩa tiếng Việt, bạn tự gõ chính xác từ vựng tiếng Anh.',
      icon: FileQuestion,
    },
    {
      id: 'listening',
      title: 'Listening Vocabulary',
      desc: 'Nghe phát âm chuẩn UK/US và gõ lại từ vựng bạn nghe được.',
      icon: Headphones,
    },
    {
      id: 'mixed',
      title: 'Mixed Quiz (Tổng hợp)',
      desc: 'Kết hợp linh hoạt cả 3 dạng: trắc nghiệm, gõ từ và nghe từ.',
      icon: Shuffle,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-blue-600" />
          <span>Kiểm tra & Ôn tập từ vựng</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Tùy chỉnh chế độ kiểm tra từ chính cuốn sổ tay từ vựng của bạn để ghi nhớ lâu hơn.
        </p>
      </div>

      {/* 1. Select Quiz Mode */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          1. Chọn chế độ kiểm tra
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modeOptions.map((item) => {
            const Icon = item.icon;
            const isSelected = mode === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setMode(item.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Select Scope */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          2. Phạm vi từ vựng ôn tập
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setScope('all')}
            className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
              scope === 'all'
                ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Tất cả sổ ({words.length} từ)
          </button>

          <button
            type="button"
            onClick={() => setScope('topic')}
            className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
              scope === 'topic'
                ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Theo Chủ đề ({topics.length})
          </button>

          <button
            type="button"
            onClick={() => setScope('unit')}
            className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
              scope === 'unit'
                ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Theo Unit / Lesson ({units.length})
          </button>

          <button
            type="button"
            onClick={() => setScope('date')}
            className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
              scope === 'date'
                ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Theo Ngày học
          </button>

          <button
            type="button"
            onClick={() => setScope('unmemorized')}
            className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
              scope === 'unmemorized'
                ? 'border-amber-600 bg-amber-50 text-amber-900 font-semibold'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Từ chưa nhớ ({words.filter((w) => !w.is_memorized).length})
          </button>

          <button
            type="button"
            onClick={() => setScope('incorrect')}
            className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
              scope === 'incorrect'
                ? 'border-rose-600 bg-rose-50 text-rose-900 font-semibold'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Từ cần ôn / hay sai ({words.filter((w) => w.needs_review || (w.incorrect_count && w.incorrect_count > 0)).length})
          </button>
        </div>

        {/* Sub-select for Topic */}
        {scope === 'topic' && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chọn chủ đề cụ thể:
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full p-2 text-xs rounded-md border border-slate-200 bg-white focus:outline-none"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({words.filter((w) => w.topic_ids.includes(t.id)).length} từ)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sub-select for Unit */}
        {scope === 'unit' && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chọn Unit / Lesson cụ thể:
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full p-2 text-xs rounded-md border border-slate-200 bg-white focus:outline-none"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title} ({words.filter((w) => w.unit_ids.includes(u.id)).length} từ)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sub-select for Date */}
        {scope === 'date' && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chọn ngày học:
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 text-xs rounded-md border border-slate-200 bg-white focus:outline-none"
            >
              <option value="">-- Chọn ngày --</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d} ({words.filter((w) => w.study_date === d).length} từ)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3. Number of questions */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            3. Số lượng câu hỏi
          </label>
          <span className="text-xs text-slate-500">
            Khả dụng: <strong>{maxAvailable} từ</strong>
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {(['10', '20', '30', 'all'] as const).map((cnt) => (
            <button
              key={cnt}
              type="button"
              onClick={() => setQuestionCountChoice(cnt)}
              className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                questionCountChoice === cnt
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cnt === 'all' ? 'Tất cả' : `${cnt} câu`}
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
        <span className="text-xs text-slate-500">
          Sẽ kiểm tra {Math.min(questionCountChoice === 'all' ? maxAvailable : parseInt(questionCountChoice, 10), maxAvailable)} từ vựng.
        </span>

        <button
          onClick={handleStart}
          disabled={maxAvailable === 0}
          className="px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {maxAvailable === 0 ? 'Không có từ nào phù hợp' : 'Bắt đầu kiểm tra'}
        </button>
      </div>

    </div>
  );
}
