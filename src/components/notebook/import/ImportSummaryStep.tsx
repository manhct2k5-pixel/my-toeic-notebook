'use client';

import React from 'react';
import { ImportSummaryResult, ParsedVocabularyRow, DuplicateStrategy } from '@/lib/file-parser/types';
import { 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Sparkles, 
  Layers, 
  Tag, 
  Copy, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ImportSummaryStepProps {
  selectedRows: ParsedVocabularyRow[];
  duplicateStrategy: DuplicateStrategy;
  result: ImportSummaryResult | null;
  isImporting: boolean;
  onConfirmImport: () => void;
  onFinish: () => void;
  onGoToPractice?: () => void;
}

export function ImportSummaryStep({
  selectedRows,
  duplicateStrategy,
  result,
  isImporting,
  onConfirmImport,
  onFinish,
  onGoToPractice,
}: ImportSummaryStepProps) {
  // Fire celebration confetti when import succeeds
  React.useEffect(() => {
    if (result && result.addedCount + result.updatedCount > 0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  }, [result]);

  // Pre-import calculations
  const totalSelected = selectedRows.length;
  const duplicateRows = selectedRows.filter((r) => r.status === 'duplicate');
  const newWordsCount = totalSelected - duplicateRows.length;

  // Collect distinct topics and units
  const distinctTopics = Array.from(new Set(selectedRows.map((r) => r.topic?.trim()).filter(Boolean))) as string[];
  const distinctUnits = Array.from(new Set(selectedRows.map((r) => r.unit?.trim()).filter(Boolean))) as string[];

  // If import has already run and returned a result:
  if (result) {
    const isSuccess = result.addedCount + result.updatedCount > 0 || (result.skippedCount > 0 && result.failedCount === 0);

    return (
      <div className="space-y-5 text-center py-4">
        {/* Success / Status Icon */}
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
          isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
        }`}>
          {isSuccess ? <CheckCircle2 className="w-9 h-9" /> : <AlertCircle className="w-9 h-9" />}
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">
            {isSuccess ? 'Nhập từ vựng vào Sổ tay thành công!' : 'Đã hoàn tất quá trình nhập dữ liệu'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Dữ liệu đã được lưu vào Sổ từ vựng dùng chung và sẵn sàng cho cả 2 hồ sơ học tập.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto text-center">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-lg font-black text-emerald-700">{result.addedCount}</span>
            <p className="text-[11px] font-medium text-emerald-800 mt-0.5">Từ mới đã thêm</p>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
            <span className="text-lg font-black text-indigo-700">{result.updatedCount}</span>
            <p className="text-[11px] font-medium text-indigo-800 mt-0.5">Từ đã cập nhật</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-lg font-black text-slate-700">{result.skippedCount}</span>
            <p className="text-[11px] font-medium text-slate-600 mt-0.5">Từ trùng bỏ qua</p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-lg font-black text-amber-700">{result.createdTopicsCount + result.createdUnitsCount}</span>
            <p className="text-[11px] font-medium text-amber-800 mt-0.5">Topic & Unit mới</p>
          </div>
        </div>

        {/* Created Topics and Units list if any */}
        {(result.createdTopicNames.length > 0 || result.createdUnitTitles.length > 0) && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-1.5">
            {result.createdTopicNames.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Chủ đề mới: <strong>{result.createdTopicNames.join(', ')}</strong></span>
              </div>
            )}
            {result.createdUnitTitles.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Unit mới: <strong>{result.createdUnitTitles.join(', ')}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Error warnings if any */}
        {result.errors.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-left text-xs text-rose-800 max-w-md mx-auto space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Một số dòng không thể xử lý:</span>
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              {result.errors.map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            onClick={onFinish}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Xem từ trong Sổ tay</span>
          </button>

          {onGoToPractice && (
            <button
              onClick={onGoToPractice}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-black shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Luyện tập Flashcard ngay</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Pre-import confirmation review
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Xác nhận thông tin trước khi nhập vào Sổ tay</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Vui lòng kiểm tra lại số lượng và phương án nhập. Hệ thống sẽ không thay đổi bất kỳ từ vựng nào ngoài danh sách bạn đã chọn.
        </p>
      </div>

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Tổng từ sẽ nhập</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalSelected}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">từ vựng được chọn</p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Từ vựng mới</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{newWordsCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">chưa từng có trong sổ</p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Từ trùng lặp</span>
            <Copy className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-1">{duplicateRows.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {duplicateStrategy === 'skip' && 'sẽ bỏ qua'}
            {duplicateStrategy === 'merge_notes_and_examples' && 'bổ sung ví dụ & ghi chú'}
            {duplicateStrategy === 'add_topics_units' && 'gắn thêm Topic/Unit'}
            {duplicateStrategy === 'update_fields' && 'cập nhật trường'}
            {duplicateStrategy === 'create_new' && 'lưu thành từ mới'}
          </p>
        </div>
      </div>

      {/* Topics & Units to be created / used */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
        <div className="font-semibold text-slate-800">Phân loại Sổ tay liên quan:</div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            Chủ đề ({distinctTopics.length}):{' '}
            {distinctTopics.length > 0 ? <strong>{distinctTopics.join(', ')}</strong> : <em>Chưa gán</em>}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            Unit / Lesson ({distinctUnits.length}):{' '}
            {distinctUnits.length > 0 ? <strong>{distinctUnits.join(', ')}</strong> : <em>Chưa gán</em>}
          </span>
        </div>
      </div>

      {/* Safe note notice */}
      <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 text-xs text-blue-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold">Bảo vệ dữ liệu an toàn tuyệt đối:</p>
          <p className="text-blue-800/80 leading-relaxed text-[11px]">
            Toàn bộ từ vựng hiện có, lịch sử học tập và tiến độ Flashcard/Quiz của cả Người A và Người B đều được giữ nguyên vẹn.
          </p>
        </div>
      </div>

      {/* Confirmation Button */}
      <div className="pt-2">
        <button
          onClick={onConfirmImport}
          disabled={isImporting || totalSelected === 0}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isImporting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang lưu dữ liệu vào Sổ từ vựng...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận nhập {totalSelected} từ vào My Notebook</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
