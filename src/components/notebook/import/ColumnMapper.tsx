'use client';

import React from 'react';
import { ColumnField, ColumnMapping } from '@/lib/file-parser/types';
import { Table, Check, ArrowRight } from 'lucide-react';

interface ColumnMapperProps {
  headers: string[];
  rawRows: Record<string, string>[];
  mapping: ColumnMapping;
  onMappingChange: (newMapping: ColumnMapping) => void;
}

const FIELD_OPTIONS: { value: ColumnField; label: string; required?: boolean }[] = [
  { value: 'word', label: '★ Từ tiếng Anh (Word)', required: true },
  { value: 'meaning_vi', label: '★ Nghĩa tiếng Việt (Meaning)', required: true },
  { value: 'pos', label: 'Loại từ (Part of Speech)' },
  { value: 'phonetic_uk', label: 'Phiên âm UK (IPA)' },
  { value: 'phonetic_us', label: 'Phiên âm US (IPA)' },
  { value: 'example_en', label: 'Câu ví dụ tiếng Anh (Example)' },
  { value: 'example_vi', label: 'Dịch câu ví dụ (Example VI)' },
  { value: 'collocations', label: 'Cụm từ liên quan (Collocations)' },
  { value: 'notes', label: 'Ghi chú cá nhân (Notes)' },
  { value: 'topic', label: 'Chủ đề (Topic)' },
  { value: 'unit', label: 'Bài học (Unit / Lesson)' },
  { value: 'study_date', label: 'Ngày học (Study Date)' },
  { value: 'ignore', label: '-- Bỏ qua cột này --' },
];

export function ColumnMapper({
  headers,
  rawRows,
  mapping,
  onMappingChange,
}: ColumnMapperProps) {
  const handleFieldChange = (header: string, field: ColumnField) => {
    onMappingChange({
      ...mapping,
      [header]: field,
    });
  };

  const sampleRows = rawRows.slice(0, 3);

  const hasWordMapped = Object.values(mapping).includes('word');
  const hasMeaningMapped = Object.values(mapping).includes('meaning_vi');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Table className="w-4 h-4 text-blue-600" />
            <span>Ánh xạ cột dữ liệu từ file bảng</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Hệ thống tự động phát hiện tiêu đề. Bạn có thể điều chỉnh lại để khớp với các trường trong Sổ từ vựng.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            hasWordMapped ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {hasWordMapped ? '✓ Đã có cột Từ' : '✗ Thiếu cột Từ'}
          </span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            hasMeaningMapped ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {hasMeaningMapped ? '✓ Đã có cột Nghĩa' : '✗ Thiếu cột Nghĩa'}
          </span>
        </div>
      </div>

      {/* Grid of Column Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {headers.map((header) => {
          const currentField = mapping[header] || 'ignore';
          const sampleVal = sampleRows[0]?.[header] || '';

          return (
            <div
              key={header}
              className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-900 truncate" title={header}>
                  {header}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">Cột gốc</span>
              </div>

              {sampleVal && (
                <p className="text-[11px] text-slate-500 truncate bg-slate-50 px-2 py-1 rounded border border-slate-100" title={sampleVal}>
                  Ví dụ: <span className="text-slate-700 font-mono">{sampleVal}</span>
                </p>
              )}

              <select
                value={currentField}
                onChange={(e) => handleFieldChange(header, e.target.value as ColumnField)}
                className={`w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border focus:outline-none transition-colors ${
                  currentField === 'word' || currentField === 'meaning_vi'
                    ? 'border-blue-500 bg-blue-50/60 text-blue-900 font-semibold'
                    : currentField === 'ignore'
                    ? 'border-slate-200 bg-slate-50 text-slate-400'
                    : 'border-slate-300 bg-white text-slate-800'
                }`}
              >
                {FIELD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Sample Table Preview */}
      {sampleRows.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
            Xem trước 3 dòng dữ liệu đầu tiên
          </div>
          <div className="overflow-x-auto max-h-48 text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] text-slate-600">
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold truncate max-w-[160px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sampleRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-slate-700 truncate max-w-[160px]">
                        {r[h] || <span className="text-slate-300 italic">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
