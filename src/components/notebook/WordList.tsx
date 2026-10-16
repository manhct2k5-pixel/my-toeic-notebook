'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Volume2
} from 'lucide-react';
import { VocabularyItem, Topic, Unit } from '@/types';
import { playAudioOrSpeak } from '@/lib/speech';

interface WordListProps {
  words: VocabularyItem[];
  topics: Topic[];
  units: Unit[];
  selectedWordId: string | null;
  onSelectWord: (word: VocabularyItem) => void;
  onOpenAddModal: () => void;
  viewTitle: string;
}

export function WordList({
  words,
  topics,
  units,
  selectedWordId,
  onSelectWord,
  onOpenAddModal,
  viewTitle,
}: WordListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'memorized' | 'unmemorized' | 'needs_review'>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');

  const topicMap = useMemo(() => new Map(topics.map((t) => [t.id, t.name])), [topics]);
  const unitMap = useMemo(() => new Map(units.map((u) => [u.id, u.title])), [units]);

  // Combined search across word, meaning, notes, topic, unit
  const filteredWords = useMemo(() => {
    let result = words;

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((w) => {
        const matchWord = w.word.toLowerCase().includes(q);
        const matchMeaning = w.meaning_vi.toLowerCase().includes(q);
        const matchNotes = (w.notes || '').toLowerCase().includes(q);
        const matchTopic = w.topic_ids.some((tid) =>
          (topicMap.get(tid) || '').toLowerCase().includes(q)
        );
        const matchUnit = w.unit_ids.some((uid) =>
          (unitMap.get(uid) || '').toLowerCase().includes(q)
        );
        return matchWord || matchMeaning || matchNotes || matchTopic || matchUnit;
      });
    }

    // 2. Status Filter
    if (statusFilter === 'memorized') {
      result = result.filter((w) => w.is_memorized);
    } else if (statusFilter === 'unmemorized') {
      result = result.filter((w) => !w.is_memorized);
    } else if (statusFilter === 'needs_review') {
      result = result.filter((w) => w.needs_review);
    }

    // 3. Sort
    result = [...result].sort((a, b) => {
      if (sortOption === 'az') return a.word.localeCompare(b.word);
      if (sortOption === 'za') return b.word.localeCompare(a.word);
      if (sortOption === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      // default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [words, searchQuery, statusFilter, sortOption, topicMap, unitMap]);

  const handleQuickAudio = (e: React.MouseEvent, word: VocabularyItem) => {
    e.stopPropagation();
    playAudioOrSpeak(word.word, 'us', word.audio_us || word.audio_uk);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200">
      
      {/* Top Header: Title + Add Word Button */}
      <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between gap-2">
        <div className="truncate">
          <h2 className="text-sm font-bold text-slate-900 truncate">
            {viewTitle}
          </h2>
          <p className="text-[11px] text-slate-500">
            {filteredWords.length} / {words.length} từ vựng
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm từ</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-100 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo từ, nghĩa, ghi chú, chủ đề..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2 py-1 text-[11px] rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="unmemorized">Chưa nhớ</option>
              <option value="memorized">Đã nhớ</option>
              <option value="needs_review">Cần ôn tập</option>
            </select>
          </div>
          <div className="flex-1">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="w-full px-2 py-1 text-[11px] rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Word List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredWords.map((item) => {
          const isSelected = item.id === selectedWordId;
          const posShort = item.pos === 'noun' ? 'n' : item.pos === 'verb' ? 'v' : item.pos === 'adjective' ? 'adj' : item.pos === 'adverb' ? 'adv' : item.pos;

          return (
            <div
              key={item.id}
              onClick={() => onSelectWord(item)}
              className={`p-3 cursor-pointer transition-colors select-none ${
                isSelected
                  ? 'bg-blue-50/80 border-l-3 border-blue-600'
                  : 'hover:bg-slate-50 border-l-3 border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-slate-900 hover:text-blue-600">
                    {item.word}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                    {posShort}
                  </span>
                  {item.phonetic_us && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      {item.phonetic_us}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleQuickAudio(e, item)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  {item.is_memorized ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã nhớ" />
                  ) : item.needs_review ? (
                    <span className="w-2 h-2 rounded-full bg-rose-500" title="Cần ôn" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400" title="Đang học" />
                  )}
                </div>
              </div>

              {/* Short Vietnamese Meaning */}
              <p className="text-xs text-slate-600 line-clamp-1">
                {item.meaning_vi || '(Chưa có nghĩa tiếng Việt)'}
              </p>

              {/* Metadata tags: Topic or Unit or Date */}
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                {item.study_date && <span>{item.study_date}</span>}
                {item.topic_ids.length > 0 && (
                  <span className="text-blue-600 truncate max-w-[100px]">
                    {topicMap.get(item.topic_ids[0]) || ''}
                  </span>
                )}
                {item.notes && <span className="text-slate-400 italic">• Có ghi chú</span>}
              </div>
            </div>
          );
        })}

        {filteredWords.length === 0 && (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <p className="text-sm font-medium text-slate-500">Không tìm thấy từ vựng nào</p>
            <p className="text-xs">
              {searchQuery ? 'Thử thay đổi từ khóa hoặc bộ lọc' : 'Nhấn "Thêm từ" để ghi chép từ đầu tiên'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
