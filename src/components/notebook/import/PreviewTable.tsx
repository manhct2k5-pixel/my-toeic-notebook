'use client';

import React, { useState, useMemo } from 'react';
import { 
  Check, 
  Trash2, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Tag, 
  Layers, 
  Filter, 
  Edit3,
  Search,
  ChevronDown
} from 'lucide-react';
import { ParsedVocabularyRow } from '@/lib/file-parser/types';
import { PartOfSpeech, Topic, Unit } from '@/types';

interface PreviewTableProps {
  rows: ParsedVocabularyRow[];
  onRowsChange: (newRows: ParsedVocabularyRow[]) => void;
  existingTopics: Topic[];
  existingUnits: Unit[];
}

const POS_LIST: { value: PartOfSpeech; label: string }[] = [
  { value: 'noun', label: 'noun (n)' },
  { value: 'verb', label: 'verb (v)' },
  { value: 'adjective', label: 'adj' },
  { value: 'adverb', label: 'adv' },
  { value: 'phrase', label: 'phrase' },
  { value: 'preposition', label: 'prep' },
  { value: 'conjunction', label: 'conj' },
  { value: 'idiom', label: 'idiom' },
  { value: 'other', label: 'other' },
];

export function PreviewTable({
  rows,
  onRowsChange,
  existingTopics,
  existingUnits,
}: PreviewTableProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'duplicate' | 'issues'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  
  // Batch toolbar states
  const [batchTopic, setBatchTopic] = useState('');
  const [batchUnit, setBatchUnit] = useState('');
  const [showBatchTools, setShowBatchTools] = useState(false);

  // Status counts
  const totalCount = rows.length;
  const selectedCount = rows.filter((r) => r.selected).length;
  const validCount = rows.filter((r) => r.status === 'valid').length;
  const duplicateCount = rows.filter((r) => r.status === 'duplicate').length;
  const issueCount = rows.filter((r) => r.status === 'missing_word' || r.status === 'missing_meaning').length;

  // Filtered rows for display
  const displayedRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Status filter
      if (statusFilter === 'valid' && r.status !== 'valid') return false;
      if (statusFilter === 'duplicate' && r.status !== 'duplicate') return false;
      if (statusFilter === 'issues' && r.status !== 'missing_word' && r.status !== 'missing_meaning') return false;

      // 2. Search query
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchWord = r.word.toLowerCase().includes(q);
        const matchMeaning = r.meaning_vi.toLowerCase().includes(q);
        const matchTopic = (r.topic || '').toLowerCase().includes(q);
        const matchUnit = (r.unit || '').toLowerCase().includes(q);
        return matchWord || matchMeaning || matchTopic || matchUnit;
      }

      return true;
    });
  }, [rows, statusFilter, searchFilter]);

  // Handlers
  const handleSelectAll = (select: boolean) => {
    onRowsChange(rows.map((r) => ({ ...r, selected: select })));
  };

  const handleRowSelect = (id: string, selected: boolean) => {
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, selected } : r)));
  };

  const handleRowChange = (id: string, updates: Partial<ParsedVocabularyRow>) => {
    onRowsChange(
      rows.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };

        // Re-evaluate simple status
        if (!updated.word.trim()) {
          updated.status = 'missing_word';
          updated.statusMessage = 'Thiếu từ tiếng Anh';
        } else if (!updated.meaning_vi.trim()) {
          updated.status = 'missing_meaning';
          updated.statusMessage = 'Chưa nhận diện được nghĩa';
        } else if (r.status === 'duplicate') {
          // Keep duplicate state if original was duplicate
          updated.status = 'duplicate';
        } else if (!updated.topic && !updated.unit) {
          updated.status = 'unassigned_category';
          updated.statusMessage = 'Chưa gán Topic/Unit';
        } else {
          updated.status = 'valid';
          updated.statusMessage = undefined;
        }

        return updated;
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    onRowsChange(rows.filter((r) => r.id !== id));
  };

  const handleAddRow = () => {
    const newRow: ParsedVocabularyRow = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      selected: true,
      word: '',
      pos: 'noun',
      meaning_vi: '',
      topic: batchTopic || existingTopics[0]?.name || '',
      unit: batchUnit || existingUnits[0]?.title || '',
      study_date: new Date().toISOString().split('T')[0],
      status: 'missing_word',
      statusMessage: 'Vui lòng nhập từ tiếng Anh',
    };
    onRowsChange([newRow, ...rows]);
  };

  const handleApplyBatchTopic = () => {
    if (!batchTopic.trim()) return;
    onRowsChange(
      rows.map((r) => {
        if (!r.selected) return r;
        return {
          ...r,
          topic: batchTopic.trim(),
          status: r.status === 'unassigned_category' && r.word && r.meaning_vi ? 'valid' : r.status,
        };
      })
    );
  };

  const handleApplyBatchUnit = () => {
    if (!batchUnit.trim()) return;
    onRowsChange(
      rows.map((r) => {
        if (!r.selected) return r;
        return {
          ...r,
          unit: batchUnit.trim(),
          status: r.status === 'unassigned_category' && r.word && r.meaning_vi ? 'valid' : r.status,
        };
      })
    );
  };

  const areAllSelected = displayedRows.length > 0 && displayedRows.every((r) => r.selected);

  return (
    <div className="space-y-3">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Status Filter Buttons */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả ({totalCount})
          </button>

          <button
            onClick={() => setStatusFilter('valid')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              statusFilter === 'valid'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Hợp lệ ({validCount})
          </button>

          {duplicateCount > 0 && (
            <button
              onClick={() => setStatusFilter('duplicate')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                statusFilter === 'duplicate'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              Trùng lặp ({duplicateCount})
            </button>
          )}

          {issueCount > 0 && (
            <button
              onClick={() => setStatusFilter('issues')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                statusFilter === 'issues'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Cần sửa ({issueCount})
            </button>
          )}
        </div>

        {/* Quick Search and Batch Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Lọc từ, nghĩa..."
              className="pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
            />
          </div>

          <button
            onClick={() => setShowBatchTools(!showBatchTools)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1 transition-colors ${
              showBatchTools
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Gán hàng loạt</span>
          </button>

          <button
            onClick={handleAddRow}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm dòng</span>
          </button>
        </div>
      </div>

      {/* 2. Batch Assignment Toolbar (Collapsible) */}
      {showBatchTools && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-700 font-semibold">
            <span>Áp dụng Topic / Unit nhanh cho {selectedCount} từ đang được chọn</span>
            <span className="text-[11px] text-slate-400 italic">Nhập tên mới hoặc chọn có sẵn</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Batch Topic */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                list="topics-datalist"
                value={batchTopic}
                onChange={(e) => setBatchTopic(e.target.value)}
                placeholder="Tên Chủ đề (ví dụ: Contracts)"
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="topics-datalist">
                {existingTopics.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
              <button
                onClick={handleApplyBatchTopic}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 font-medium shrink-0"
              >
                Gán Topic
              </button>
            </div>

            {/* Batch Unit */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                list="units-datalist"
                value={batchUnit}
                onChange={(e) => setBatchUnit(e.target.value)}
                placeholder="Tên Unit / Lesson (ví dụ: Lesson 01)"
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="units-datalist">
                {existingUnits.map((u) => (
                  <option key={u.id} value={u.title} />
                ))}
              </datalist>
              <button
                onClick={handleApplyBatchUnit}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 font-medium shrink-0"
              >
                Gán Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Editable Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 z-10 text-[11px] text-slate-700">
              <tr>
                <th className="w-10 px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={areAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="min-w-[140px] px-3 py-2.5 font-bold">Từ tiếng Anh (Word) *</th>
                <th className="w-24 px-2 py-2.5 font-bold">Loại từ</th>
                <th className="min-w-[160px] px-3 py-2.5 font-bold">Nghĩa tiếng Việt *</th>
                <th className="min-w-[180px] px-3 py-2.5 font-medium text-slate-600">Câu ví dụ (Example)</th>
                <th className="min-w-[130px] px-3 py-2.5 font-medium text-slate-600">Ghi chú (Notes)</th>
                <th className="w-32 px-2 py-2.5 font-medium text-slate-600">Chủ đề (Topic)</th>
                <th className="w-36 px-2 py-2.5 font-medium text-slate-600">Unit / Bài học</th>
                <th className="w-28 px-3 py-2.5 font-medium text-slate-600">Trạng thái</th>
                <th className="w-10 px-2 py-2.5 text-center">Xóa</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {displayedRows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    !row.selected ? 'opacity-50 bg-slate-50/40' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* Word */}
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.word}
                      onChange={(e) => handleRowChange(row.id, { word: e.target.value })}
                      placeholder="Nhập từ..."
                      className={`w-full px-2 py-1 text-xs rounded border focus:outline-none focus:ring-1 ${
                        !row.word.trim()
                          ? 'border-rose-300 bg-rose-50 text-rose-900 font-semibold focus:ring-rose-500'
                          : 'border-slate-200 font-semibold text-slate-900 focus:ring-blue-500'
                      }`}
                    />
                  </td>

                  {/* Part of Speech */}
                  <td className="px-1.5 py-1.5">
                    <select
                      value={row.pos}
                      onChange={(e) => handleRowChange(row.id, { pos: e.target.value as PartOfSpeech })}
                      className="w-full px-1.5 py-1 text-[11px] rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {POS_LIST.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Meaning VI */}
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.meaning_vi}
                      onChange={(e) => handleRowChange(row.id, { meaning_vi: e.target.value })}
                      placeholder="Nhập nghĩa..."
                      className={`w-full px-2 py-1 text-xs rounded border focus:outline-none focus:ring-1 ${
                        !row.meaning_vi.trim()
                          ? 'border-amber-300 bg-amber-50 text-amber-900 focus:ring-amber-500'
                          : 'border-slate-200 text-slate-800 focus:ring-blue-500'
                      }`}
                    />
                  </td>

                  {/* Example EN */}
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.example_en || ''}
                      onChange={(e) => handleRowChange(row.id, { example_en: e.target.value })}
                      placeholder="Câu ví dụ..."
                      className="w-full px-2 py-1 text-xs rounded border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  {/* Notes */}
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.notes || ''}
                      onChange={(e) => handleRowChange(row.id, { notes: e.target.value })}
                      placeholder="Ghi chú thêm..."
                      className="w-full px-2 py-1 text-xs rounded border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  {/* Topic */}
                  <td className="px-1.5 py-1.5">
                    <input
                      type="text"
                      list="topics-datalist"
                      value={row.topic || ''}
                      onChange={(e) => handleRowChange(row.id, { topic: e.target.value })}
                      placeholder="Chủ đề..."
                      className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  {/* Unit */}
                  <td className="px-1.5 py-1.5">
                    <input
                      type="text"
                      list="units-datalist"
                      value={row.unit || ''}
                      onChange={(e) => handleRowChange(row.id, { unit: e.target.value })}
                      placeholder="Unit / Lesson..."
                      className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  {/* Status Badge */}
                  <td className="px-3 py-1.5">
                    {row.status === 'valid' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Hợp lệ</span>
                      </span>
                    )}

                    {row.status === 'duplicate' && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800 cursor-help"
                        title={row.statusMessage}
                      >
                        <Copy className="w-3 h-3" />
                        <span>Trùng từ</span>
                      </span>
                    )}

                    {row.status === 'missing_word' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                        <AlertCircle className="w-3 h-3" />
                        <span>Thiếu từ</span>
                      </span>
                    )}

                    {row.status === 'missing_meaning' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                        <AlertCircle className="w-3 h-3" />
                        <span>Thiếu nghĩa</span>
                      </span>
                    )}

                    {row.status === 'unassigned_category' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        <span>Chưa gán</span>
                      </span>
                    )}
                  </td>

                  {/* Delete row */}
                  <td className="px-2 py-1.5 text-center">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Xóa dòng này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {displayedRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-xs text-slate-400 italic">
                    Không tìm thấy dòng từ vựng nào khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with selection stats */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Đang chọn <span className="font-bold text-slate-900">{selectedCount}</span> / {totalCount} từ vựng
            {selectedCount < totalCount && (
              <span className="text-slate-400 ml-2">
                (Các dòng không chọn sẽ không được lưu vào sổ)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectAll(true)}
              className="text-blue-600 hover:underline font-medium"
            >
              Chọn tất cả
            </button>
            <span>•</span>
            <button
              onClick={() => handleSelectAll(false)}
              className="text-slate-500 hover:underline"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
