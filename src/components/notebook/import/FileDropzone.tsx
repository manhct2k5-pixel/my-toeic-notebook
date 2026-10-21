'use client';

import React, { useRef, useState } from 'react';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { validateFile, MAX_FILE_SIZE } from '@/lib/file-parser/text-extractor';
import { ImportMode, SupportedFileExtension } from '@/lib/file-parser/types';

interface FileDropzoneProps {
  selectedFile: File | null;
  onFileSelected: (file: File) => void;
  onClearFile: () => void;
  importMode: ImportMode;
  onModeChange: (mode: ImportMode) => void;
  isLoading: boolean;
  loadingMessage?: string;
  error?: string | null;
}

const FORMAT_BADGES: { ext: string; label: string; desc: string; icon: string }[] = [
  { ext: 'TXT', label: 'Văn bản thuần', desc: 'Danh sách từ - nghĩa, tab hoặc dấu gạch ngang', icon: 'txt' },
  { ext: 'DOCX', label: 'Microsoft Word', desc: 'Tài liệu bảng từ vựng, bài học Unit & ghi chú', icon: 'docx' },
  { ext: 'CSV', label: 'Bảng CSV', desc: 'File dữ liệu xuất từ Anki, Quizlet, Excel', icon: 'csv' },
  { ext: 'XLSX', label: 'Microsoft Excel', desc: 'Bảng tính với các cột English, Meaning, Example...', icon: 'xlsx' },
  { ext: 'PDF', label: 'PDF có chữ', desc: 'Tài liệu bài học có lớp văn bản trích xuất được', icon: 'pdf' },
];

export function FileDropzone({
  selectedFile,
  onFileSelected,
  onClearFile,
  importMode,
  onModeChange,
  isLoading,
  loadingMessage,
  error,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setLocalError(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
    // Reset input so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processSelectedFile = (file: File) => {
    setLocalError(null);
    const validation = validateFile(file);

    if (!validation.valid) {
      setLocalError(validation.error || 'File không hợp lệ');
      return;
    }

    onFileSelected(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeError = localError || error;

  return (
    <div className="space-y-5">
      {/* 1. Drag & Drop Zone */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-150 ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.xlsx,.xls,.docx,.pdf,.doc"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              isDragOver ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
            }`}>
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Kéo thả file tài liệu vào đây, hoặc <span className="text-blue-600 underline underline-offset-2">chọn từ thiết bị</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Hỗ trợ TXT, DOCX, CSV, XLSX, XLS và PDF (Tối đa 25 MB)
              </p>
            </div>

            <button
              type="button"
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Chọn file từ máy tính
            </button>
          </div>
        </div>
      ) : (
        /* Selected file card */
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-900 truncate">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">
                {formatFileSize(selectedFile.size)} • Định dạng .{selectedFile.name.split('.').pop()?.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClearFile}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
            title="Chọn file khác"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <div className="text-xs text-blue-900">
            <p className="font-semibold">{loadingMessage || 'Đang đọc và phân tích dữ liệu tài liệu...'}</p>
            <p className="text-blue-700/80 mt-0.5">Xử lý an toàn trong bộ nhớ trình duyệt, không tải dữ liệu lên ngoài.</p>
          </div>
        </div>
      )}

      {/* Error alert with actionable advice */}
      {activeError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Không thể đọc file:</p>
            <p className="leading-relaxed">{activeError}</p>
          </div>
        </div>
      )}

      {/* 2. Import Mode Selection (Chế độ A vs Chế độ B) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Chế độ nhập dữ liệu</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mode A: Structured */}
          <div
            onClick={() => onModeChange('structured')}
            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
              importMode === 'structured'
                ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Chế độ A: Danh sách có cấu trúc</span>
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                importMode === 'structured' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
              }`}>
                {importMode === 'structured' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dành cho CSV, Excel, TXT/DOCX có các cột rõ ràng hoặc dạng <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">từ (n) – nghĩa</code>. Tự nhận diện tiêu đề cột.
            </p>
          </div>

          {/* Mode B: Freeform */}
          <div
            onClick={() => onModeChange('freeform')}
            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
              importMode === 'freeform'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Chế độ B: Tài liệu / Ghi chú tự do</span>
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                importMode === 'freeform' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
              }`}>
                {importMode === 'freeform' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dành cho giáo trình, tài liệu ôn thi có đoạn văn, tiêu đề Unit và mục từ vựng xen kẽ. Hệ thống tự trích xuất danh sách đề xuất.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Supported Formats List & Description */}
      <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Định dạng và cách nhập hỗ trợ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {FORMAT_BADGES.map((b) => (
            <div key={b.ext} className="p-2 rounded-lg bg-white border border-slate-200/70 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                  {b.ext}
                </span>
                <span className="font-semibold text-slate-800 text-[11px]">{b.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">{b.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60">
          💡 Với file PDF ảnh scan, vui lòng sử dụng file có lớp văn bản hoặc chuyển sang DOCX để đảm bảo trích xuất chính xác nhất.
        </p>
      </div>
    </div>
  );
}
