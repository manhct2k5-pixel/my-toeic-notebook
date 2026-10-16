'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Tag, 
  Layers, 
  Calendar, 
  Sparkles,
  ExternalLink,
  Save,
  Bold,
  Italic,
  List,
  Quote,
  Lightbulb
} from 'lucide-react';
import { VocabularyItem, Topic, Unit } from '@/types';
import { playAudioOrSpeak } from '@/lib/speech';
import { updateWordNotes, updateWordMemoryStatus, updateWordStudyDate } from '@/lib/storage';

interface WordDetailProps {
  word: VocabularyItem | null;
  topics: Topic[];
  units: Unit[];
  onEditFull: (word: VocabularyItem) => void;
  onDelete: (wordId: string) => void;
  onFilterByTopic?: (topicId: string) => void;
  onFilterByUnit?: (unitId: string) => void;
}

export function WordDetail({
  word,
  topics,
  units,
  onEditFull,
  onDelete,
  onFilterByTopic,
  onFilterByUnit,
}: WordDetailProps) {
  const [noteContent, setNoteContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [editingDate, setEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const noteDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const topicMap = React.useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const unitMap = React.useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);

  // Synchronize noteContent when word changes
  useEffect(() => {
    if (word) {
      setNoteContent(word.notes || '');
      setDateValue(word.study_date || '');
      setSaveStatus('idle');
      setEditingDate(false);
    }
  }, [word?.id, word?.notes, word?.study_date]);

  if (!word) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white text-slate-400 select-none">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
          <Edit3 className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-600">Chọn một từ vựng để xem chi tiết</p>
        <p className="text-xs text-slate-400 mt-1">
          Hoặc nhấn &quot;Thêm từ&quot; để ghi chép kiến thức mới
        </p>
      </div>
    );
  }

  // Handle Note Auto-Save
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setNoteContent(newVal);
    setSaveStatus('saving');

    if (noteDebounceTimer.current) {
      clearTimeout(noteDebounceTimer.current);
    }

    noteDebounceTimer.current = setTimeout(async () => {
      if (word) {
        await updateWordNotes(word.id, newVal);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    }, 700);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('notebook-notes-area') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = noteContent.substring(start, end);
    const replacement = `${prefix}${selected || 'nội dung'}${suffix}`;
    const newContent = noteContent.substring(0, start) + replacement + noteContent.substring(end);
    
    setNoteContent(newContent);
    setSaveStatus('saving');
    
    if (noteDebounceTimer.current) clearTimeout(noteDebounceTimer.current);
    noteDebounceTimer.current = setTimeout(async () => {
      await updateWordNotes(word.id, newContent);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }, 500);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 7));
    }, 50);
  };

  const handleAudio = (accent: 'uk' | 'us') => {
    const url = accent === 'uk' ? word.audio_uk : word.audio_us;
    playAudioOrSpeak(word.word, accent, url);
  };

  const toggleMemorized = async () => {
    const nextState = !word.is_memorized;
    await updateWordMemoryStatus(word.id, nextState, !nextState);
  };

  const toggleNeedsReview = async () => {
    const nextState = !word.needs_review;
    await updateWordMemoryStatus(word.id, word.is_memorized, nextState);
  };

  const handleDateSave = async () => {
    if (dateValue && dateValue !== word.study_date) {
      await updateWordStudyDate(word.id, dateValue);
    }
    setEditingDate(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
      
      {/* Top action toolbar */}
      <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between gap-2 bg-slate-50/50 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMemorized}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
              word.is_memorized
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${word.is_memorized ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{word.is_memorized ? 'Đã thuộc' : 'Chưa nhớ'}</span>
          </button>

          <button
            onClick={toggleNeedsReview}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
              word.needs_review
                ? 'bg-rose-50 text-rose-700 border-rose-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${word.needs_review ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Cần ôn</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEditFull(word)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
            title="Chỉnh sửa toàn bộ thông tin từ"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Sửa</span>
          </button>
          <button
            onClick={() => {
              if (confirm(`Bạn có chắc chắn muốn xóa từ "${word.word}" khỏi sổ tay?`)) {
                onDelete(word.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Xóa từ khỏi sổ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-6 flex-1">
        
        {/* Word Title + Pronunciation */}
        <div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {word.word}
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
              {word.pos}
            </span>
          </div>

          {/* Pronunciation UK / US buttons */}
          <div className="flex items-center gap-4 mt-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-500">UK</span>
              <span className="text-xs font-mono text-slate-700">{word.phonetic_uk || '—'}</span>
              <button
                onClick={() => handleAudio('uk')}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                title="Nghe giọng Anh (UK)"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-500">US</span>
              <span className="text-xs font-mono text-slate-700">{word.phonetic_us || '—'}</span>
              <button
                onClick={() => handleAudio('us')}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                title="Nghe giọng Mỹ (US)"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Vietnamese Meaning */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block mb-1">
            Nghĩa tiếng Việt
          </span>
          <p className="text-base font-semibold text-slate-900">
            {word.meaning_vi || '(Chưa điền nghĩa tiếng Việt)'}
          </p>
        </div>

        {/* Examples */}
        {(word.example_en || word.example_vi) && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Ví dụ mẫu
            </span>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1 text-sm">
              {word.example_en && (
                <p className="text-slate-800 font-medium italic">&quot;{word.example_en}&quot;</p>
              )}
              {word.example_vi && (
                <p className="text-slate-600 text-xs">→ {word.example_vi}</p>
              )}
            </div>
          </div>
        )}

        {/* Collocations */}
        {word.collocations && word.collocations.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Cụm từ / Collocations thường gặp
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {word.collocations.map((col, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 text-xs font-mono bg-slate-50 rounded-md border border-slate-200/60 text-slate-800"
                >
                  {col}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GHI CHÚ NHƯ MỘT CUỐN SỔ THẬT (CRITICAL REQUIREMENT) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Ghi chép sổ tay (Tự do ghi chú & Mẹo nhớ)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <span className="text-[11px] text-amber-600 font-medium">Đang lưu...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-[11px] text-emerald-600 font-medium">✓ Đã tự động lưu</span>
              )}
            </div>
          </div>

          {/* Quick Markdown Formatting Toolbar */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-slate-600">
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**')}
              className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-colors"
              title="In đậm (**chữ**)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('*', '*')}
              className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-colors"
              title="In nghiêng (*chữ*)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('* ')}
              className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-colors"
              title="Gạch đầu dòng (* item)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('> **Mẹo nhớ:** ')}
              className="p-1.5 hover:bg-white rounded hover:text-slate-900 transition-colors"
              title="Mẹo nhớ (> trích dẫn)"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('`', '`')}
              className="px-2 py-0.5 text-xs font-mono hover:bg-white rounded hover:text-slate-900 transition-colors"
              title="Mã / cụm từ (`code`)"
            >
              `code`
            </button>
          </div>

          {/* Editable Textarea with auto-save */}
          <textarea
            id="notebook-notes-area"
            value={noteContent}
            onChange={handleNoteChange}
            rows={6}
            placeholder="Viết ghi chú, mẹo nhớ, cấu trúc ngữ pháp tại đây...&#10;• schedule a meeting: sắp xếp cuộc họp&#10;• ahead of schedule: sớm hơn dự kiến&#10;• Chú ý phát âm UK và US..."
            className="w-full p-3.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed font-sans shadow-2xs"
          />
          <p className="text-[11px] text-slate-400">
            * Nội dung ghi chú được tự động lưu lại khi bạn gõ, không lo mất dữ liệu khi chuyển sang từ khác.
          </p>
        </div>

        {/* Metadata: Topics, Units, Date, Sources */}
        <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
          
          {/* Topics */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              Chủ đề:
            </span>
            {word.topic_ids.length > 0 ? (
              word.topic_ids.map((tid) => {
                const top = topicMap.get(tid);
                return (
                  <button
                    key={tid}
                    onClick={() => onFilterByTopic && onFilterByTopic(tid)}
                    className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    {top?.name || tid}
                  </button>
                );
              })
            ) : (
              <span className="text-slate-400 italic">Chưa gắn chủ đề</span>
            )}
          </div>

          {/* Units */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Unit / Lesson:
            </span>
            {word.unit_ids.length > 0 ? (
              word.unit_ids.map((uid) => {
                const u = unitMap.get(uid);
                return (
                  <button
                    key={uid}
                    onClick={() => onFilterByUnit && onFilterByUnit(uid)}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    {u?.title || uid}
                  </button>
                );
              })
            ) : (
              <span className="text-slate-400 italic">Chưa gắn Unit</span>
            )}
          </div>

          {/* Study Date with Inline Edit */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Ngày học:
            </span>
            {editingDate ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  className="px-2 py-0.5 border border-slate-300 rounded text-xs"
                />
                <button
                  onClick={handleDateSave}
                  className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs"
                >
                  Lưu
                </button>
                <button
                  onClick={() => setEditingDate(false)}
                  className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 rounded text-xs"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-800 font-medium">{word.study_date || 'Chưa có'}</span>
                <button
                  onClick={() => setEditingDate(true)}
                  className="text-blue-600 hover:underline text-[11px]"
                >
                  (Đổi ngày)
                </button>
              </div>
            )}
          </div>

          {/* Sources (From Listening / Reading) */}
          {word.sources && word.sources.length > 0 && (
            <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="font-semibold text-slate-600 block text-[11px] uppercase tracking-wider">
                Nguồn học & Ngữ cảnh bài tập:
              </span>
              {word.sources.map((src, i) => (
                <div key={i} className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">
                    [{src.type === 'listening' ? 'Listening' : src.type === 'reading' ? 'Reading' : 'Thủ công'}] {src.lessonTitle || ''}
                  </span>
                  {src.contextSentence && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      &quot;{src.contextSentence}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
