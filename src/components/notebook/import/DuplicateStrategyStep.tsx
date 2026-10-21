'use client';

import React from 'react';
import { DuplicateStrategy, ParsedVocabularyRow } from '@/lib/file-parser/types';
import { Copy, ShieldCheck, PlusCircle, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

interface DuplicateStrategyStepProps {
  strategy: DuplicateStrategy;
  onStrategyChange: (strategy: DuplicateStrategy) => void;
  duplicateRows: ParsedVocabularyRow[];
}

const STRATEGY_OPTIONS: {
  value: DuplicateStrategy;
  title: string;
  badge?: string;
  description: string;
  icon: any;
}[] = [
  {
    value: 'skip',
    title: 'Bỏ qua từ trùng (Khuyến nghị)',
    badge: 'An toàn nhất',
    description: 'Giữ nguyên dữ liệu từ cũ trong sổ tay, không can thiệp hay thay đổi thông tin hiện có.',
    icon: ShieldCheck,
  },
  {
    value: 'merge_notes_and_examples',
    title: 'Bổ sung ghi chú & ví dụ mới',
    badge: 'Học tập sâu',
    description: 'Giữ lại từ và ghi chú cũ, nối thêm câu ví dụ và ghi chú từ file vào cuối sổ tay mà không xóa bất kỳ nội dung cũ nào.',
    icon: FileText,
  },
  {
    value: 'add_topics_units',
    title: 'Gắn thêm vào Topic / Unit mới',
    description: 'Nếu từ trong file thuộc một Unit hoặc Chủ đề mới, liên kết từ cũ vào thêm mục đó để bạn dễ ôn tập đa chiều.',
    icon: Copy,
  },
  {
    value: 'update_fields',
    title: 'Cập nhật trường thông tin mới',
    description: 'Điền thêm các trường còn thiếu (phiên âm, ví dụ, nghĩa...) nếu file có dữ liệu mới.',
    icon: RefreshCw,
  },
  {
    value: 'create_new',
    title: 'Tạo thành mục từ riêng biệt',
    description: 'Lưu thành từ mới độc lập. Phù hợp khi từ có cùng cách viết nhưng khác nghĩa hoặc khác loại từ.',
    icon: PlusCircle,
  },
];

export function DuplicateStrategyStep({
  strategy,
  onStrategyChange,
  duplicateRows,
}: DuplicateStrategyStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <Copy className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold text-slate-900">
            Phát hiện {duplicateRows.length} từ vựng đã tồn tại trong Sổ tay
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống đã chuẩn hóa và so sánh từ vựng. Vui lòng chọn cách xử lý đối với các từ trùng lặp bên dưới:
        </p>
      </div>

      {/* Strategies List */}
      <div className="space-y-2.5">
        {STRATEGY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = strategy === opt.value;

          return (
            <div
              key={opt.value}
              onClick={() => onStrategyChange(opt.value)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-600/30'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{opt.title}</p>
                      {opt.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </div>

                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                  isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                }`}>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* List of Duplicate Words Preview */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 text-xs">
        <div className="px-3 py-2 bg-slate-100/70 border-b border-slate-200 font-semibold text-slate-700 flex items-center justify-between">
          <span>Danh sách các từ trùng ({duplicateRows.length})</span>
          <span className="text-[11px] text-slate-500 font-normal">Từ file → Sổ tay hiện tại</span>
        </div>
        <div className="p-3 max-h-36 overflow-y-auto space-y-1.5">
          {duplicateRows.map((row) => (
            <div
              key={row.id}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-slate-900">{row.word}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                  {row.pos}
                </span>
                <span className="text-slate-500 truncate text-[11px]">- {row.meaning_vi}</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-medium shrink-0 ml-2">
                {row.statusMessage || 'Đã có trong sổ'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
