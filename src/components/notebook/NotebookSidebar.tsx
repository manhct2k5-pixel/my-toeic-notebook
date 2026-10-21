'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Tag, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  FolderPlus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Clock,
  Upload
} from 'lucide-react';
import { Topic, Unit, VocabularyItem } from '@/types';

export type NotebookViewType = 
  | 'all' 
  | 'unmemorized' 
  | 'needs_review' 
  | 'topic' 
  | 'unit' 
  | 'date';

interface NotebookSidebarProps {
  currentViewType: NotebookViewType;
  selectedId: string | null;
  onSelectView: (viewType: NotebookViewType, id?: string) => void;
  topics: Topic[];
  units: Unit[];
  words: VocabularyItem[];
  onOpenNewTopic: () => void;
  onEditTopic: (topic: Topic) => void;
  onDeleteTopic: (topicId: string) => void;
  onOpenNewUnit: () => void;
  onEditUnit: (unit: Unit) => void;
  onDeleteUnit: (unitId: string) => void;
  onOpenImport?: () => void;
}

export function NotebookSidebar({
  currentViewType,
  selectedId,
  onSelectView,
  topics,
  units,
  words,
  onOpenNewTopic,
  onEditTopic,
  onDeleteTopic,
  onOpenNewUnit,
  onEditUnit,
  onDeleteUnit,
  onOpenImport,
}: NotebookSidebarProps) {
  const [topicsExpanded, setTopicsExpanded] = useState(true);
  const [unitsExpanded, setUnitsExpanded] = useState(true);
  const [datesExpanded, setDatesExpanded] = useState(true);

  // Group study dates with word count
  const dateCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    words.forEach((w) => {
      const d = w.study_date || 'Không có ngày';
      map.set(d, (map.get(d) || 0) + 1);
    });
    // Sort descending by date
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [words]);

  const totalWords = words.length;
  const unmemorizedCount = words.filter((w) => !w.is_memorized).length;
  const needsReviewCount = words.filter((w) => w.needs_review).length;

  const formatDateDisplay = (isoDate: string) => {
    if (isoDate === 'Không có ngày') return isoDate;
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  return (
    <aside className="w-full h-full flex flex-col bg-slate-50/70 border-r border-slate-200 select-none overflow-y-auto">
      {/* Top quick filters */}
      <div className="p-3 border-b border-slate-200/80 space-y-1">
        <button
          onClick={() => onSelectView('all')}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
            currentViewType === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-200/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Tất cả từ vựng</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${
            currentViewType === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {totalWords}
          </span>
        </button>

        <button
          onClick={() => onSelectView('unmemorized')}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
            currentViewType === 'unmemorized'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-200/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 group-hover:text-amber-600" />
            <span>Từ chưa nhớ</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${
            currentViewType === 'unmemorized' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'
          }`}>
            {unmemorizedCount}
          </span>
        </button>

        <button
          onClick={() => onSelectView('needs_review')}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
            currentViewType === 'needs_review'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-200/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-500" />
            <span>Từ cần ôn tập</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${
            currentViewType === 'needs_review' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
          }`}>
            {needsReviewCount}
          </span>
        </button>
      </div>

      {/* Main Categories Section */}
      <div className="p-3 space-y-4 flex-1">
        
        {/* A. TOPICS SECTION */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mb-1.5">
            <button
              onClick={() => setTopicsExpanded(!topicsExpanded)}
              className="flex items-center gap-1.5 hover:text-slate-800"
            >
              {topicsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>Chủ đề ({topics.length})</span>
            </button>
            <button
              onClick={onOpenNewTopic}
              className="p-1 hover:text-blue-600 hover:bg-slate-200/70 rounded-md transition-colors"
              title="Tạo chủ đề mới"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {topicsExpanded && (
            <div className="space-y-0.5 pl-1">
              {topics.map((t) => {
                const count = words.filter((w) => w.topic_ids.includes(t.id)).length;
                const isSelected = currentViewType === 'topic' && selectedId === t.id;

                return (
                  <div
                    key={t.id}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-100/90 text-blue-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-200/50'
                    }`}
                    onClick={() => onSelectView('topic', t.id)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: t.color || '#2563eb' }}
                      />
                      <span className="truncate">{t.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 group-hover:hidden">
                        {count}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTopic(t);
                          }}
                          className="p-0.5 text-slate-400 hover:text-blue-600 rounded"
                          title="Sửa chủ đề"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Bạn có chắc chắn muốn xóa chủ đề "${t.name}"? (Các từ vựng trong chủ đề vẫn được giữ nguyên)`)) {
                              onDeleteTopic(t.id);
                            }
                          }}
                          className="p-0.5 text-slate-400 hover:text-red-600 rounded"
                          title="Xóa chủ đề"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {topics.length === 0 && (
                <div className="px-2 py-1 text-xs text-slate-400 italic">Chưa có chủ đề</div>
              )}
            </div>
          )}
        </div>

        {/* B. UNITS SECTION */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mb-1.5">
            <button
              onClick={() => setUnitsExpanded(!unitsExpanded)}
              className="flex items-center gap-1.5 hover:text-slate-800"
            >
              {unitsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>Unit / Lesson ({units.length})</span>
            </button>
            <button
              onClick={onOpenNewUnit}
              className="p-1 hover:text-indigo-600 hover:bg-slate-200/70 rounded-md transition-colors"
              title="Tạo Unit mới"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {unitsExpanded && (
            <div className="space-y-0.5 pl-1">
              {units.map((u) => {
                const count = words.filter((w) => w.unit_ids.includes(u.id)).length;
                const isSelected = currentViewType === 'unit' && selectedId === u.id;

                return (
                  <div
                    key={u.id}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-100/90 text-indigo-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-200/50'
                    }`}
                    onClick={() => onSelectView('unit', u.id)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{u.title}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 group-hover:hidden">
                        {count}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditUnit(u);
                          }}
                          className="p-0.5 text-slate-400 hover:text-indigo-600 rounded"
                          title="Sửa Unit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Bạn có chắc muốn xóa Unit "${u.title}"? (Các từ vựng trong Unit vẫn được giữ nguyên)`)) {
                              onDeleteUnit(u.id);
                            }
                          }}
                          className="p-0.5 text-slate-400 hover:text-red-600 rounded"
                          title="Xóa Unit"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {units.length === 0 && (
                <div className="px-2 py-1 text-xs text-slate-400 italic">Chưa có Unit</div>
              )}
            </div>
          )}
        </div>

        {/* C. STUDY DATES SECTION */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mb-1.5">
            <button
              onClick={() => setDatesExpanded(!datesExpanded)}
              className="flex items-center gap-1.5 hover:text-slate-800"
            >
              {datesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>Ngày học ({dateCounts.length})</span>
            </button>
          </div>

          {datesExpanded && (
            <div className="space-y-0.5 pl-1 max-h-48 overflow-y-auto">
              {dateCounts.map(([dateStr, count]) => {
                const isSelected = currentViewType === 'date' && selectedId === dateStr;

                return (
                  <div
                    key={dateStr}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-300/80 text-slate-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-200/50'
                    }`}
                    onClick={() => onSelectView('date', dateStr)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDateDisplay(dateStr)}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 px-1.5 py-0.5 bg-slate-200/70 rounded">
                      {count} từ
                    </span>
                  </div>
                );
              })}
              {dateCounts.length === 0 && (
                <div className="px-2 py-1 text-xs text-slate-400 italic">Chưa có lịch sử ngày</div>
              )}
            </div>
          )}
        </div>

        {/* D. IMPORT FROM FILE SHORTCUT */}
        {onOpenImport && (
          <div className="pt-2 border-t border-slate-200/80">
            <button
              onClick={onOpenImport}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200 transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Nhập từ file</span>
            </button>
          </div>
        )}

      </div>
    </aside>
  );
}
