'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Upload, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Table, 
  Copy, 
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { FileDropzone } from './FileDropzone';
import { ColumnMapper } from './ColumnMapper';
import { PreviewTable } from './PreviewTable';
import { DuplicateStrategyStep } from './DuplicateStrategyStep';
import { ImportSummaryStep } from './ImportSummaryStep';
import { extractDocumentData } from '@/lib/file-parser/text-extractor';
import { autoMapColumns, analyzeExtractedDocument } from '@/lib/file-parser/vocabulary-analyzer';
import { detectDuplicates } from '@/lib/file-parser/duplicate-detector';
import { executeImport } from '@/lib/file-parser/import-executor';
import {
  ExtractedDocumentData,
  ImportMode,
  ColumnMapping,
  ParsedVocabularyRow,
  DuplicateStrategy,
  ImportSummaryResult,
} from '@/lib/file-parser/types';
import { Topic, Unit, VocabularyItem } from '@/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTopics: Topic[];
  existingUnits: Unit[];
  existingVocabulary: VocabularyItem[];
  onImportSuccess?: (result: ImportSummaryResult) => void;
}

type ModalStep = 'upload' | 'mapping' | 'preview' | 'duplicates' | 'confirm';

const emptySubscribe = () => () => {};

export function ImportModal({
  isOpen,
  onClose,
  existingTopics,
  existingUnits,
  existingVocabulary,
  onImportSuccess,
}: ImportModalProps) {
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Flow State
  const [currentStep, setCurrentStep] = useState<ModalStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('structured');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  // Extracted Document Data
  const [docData, setDocData] = useState<ExtractedDocumentData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});

  // Parsed Rows & Strategy
  const [parsedRows, setParsedRows] = useState<ParsedVocabularyRow[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip');

  // Execution & Result
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportSummaryResult | null>(null);



  // Handle ESC and body overflow
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isImporting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, isImporting]);

  // Reset state when opened or closed
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('upload');
      setSelectedFile(null);
      setImportMode('structured');
      setIsLoading(false);
      setFileError(null);
      setDocData(null);
      setColumnMapping({});
      setParsedRows([]);
      setDuplicateStrategy('skip');
      setIsImporting(false);
      setImportResult(null);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // -------------------------------------------------------------
  // STEP 1 -> STEP 2 TRANSITION: Read & Analyze File
  // -------------------------------------------------------------
  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setFileError(null);
    setIsLoading(true);
    setLoadingMessage('Đang đọc nội dung file trong bộ nhớ...');

    try {
      const extracted = await extractDocumentData(file);
      setDocData(extracted);
      setImportMode(extracted.suggestedMode);

      // If tabular with headers, compute initial column mapping
      if (extracted.headers && extracted.headers.length > 0) {
        const mapping = autoMapColumns(extracted.headers);
        setColumnMapping(mapping);
      }

      setIsLoading(false);
    } catch (err: unknown) {
      setIsLoading(false);
      setFileError(err instanceof Error ? err.message : 'Lỗi khi đọc file');
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setDocData(null);
    setFileError(null);
    setColumnMapping({});
    setParsedRows([]);
  };

  const handleProceedFromUpload = () => {
    if (!docData) return;

    // If tabular and in structured mode, go to column mapping step
    if (docData.rawRows && docData.rawRows.length > 0 && docData.headers && docData.headers.length >= 2 && importMode === 'structured') {
      setCurrentStep('mapping');
      return;
    }

    // Otherwise, directly run analyzer and go to preview
    processAndGoToPreview(docData, importMode, columnMapping);
  };

  const handleProceedFromMapping = () => {
    if (!docData) return;
    processAndGoToPreview(docData, importMode, columnMapping);
  };

  const processAndGoToPreview = (
    data: ExtractedDocumentData,
    mode: ImportMode,
    mapping?: ColumnMapping
  ) => {
    setIsLoading(true);
    setLoadingMessage('Đang phân tích cấu trúc từ vựng...');

    setTimeout(() => {
      try {
        const rows = analyzeExtractedDocument(data, mode, mapping);
        const rowsWithDuplicates = detectDuplicates(rows, existingVocabulary);
        setParsedRows(rowsWithDuplicates);
        setIsLoading(false);
        setCurrentStep('preview');
      } catch (err: unknown) {
        setIsLoading(false);
        setFileError(err instanceof Error ? err.message : 'Lỗi phân tích từ vựng');
      }
    }, 100);
  };

  // -------------------------------------------------------------
  // STEP 2 -> STEP 3: Preview -> Duplicate Check / Confirmation
  // -------------------------------------------------------------
  const selectedRows = parsedRows.filter((r) => r.selected);
  const duplicateSelectedRows = selectedRows.filter((r) => r.status === 'duplicate');

  const handleProceedFromPreview = () => {
    if (selectedRows.length === 0) return;

    // If there are duplicate words among selected, prompt user to choose strategy
    if (duplicateSelectedRows.length > 0) {
      setCurrentStep('duplicates');
    } else {
      setCurrentStep('confirm');
    }
  };

  const handleProceedFromDuplicates = () => {
    setCurrentStep('confirm');
  };

  // -------------------------------------------------------------
  // STEP 3: Execute Actual Import
  // -------------------------------------------------------------
  const handleConfirmImport = async () => {
    if (selectedRows.length === 0) return;
    setIsImporting(true);

    try {
      const res = await executeImport(
        selectedRows,
        duplicateStrategy,
        existingTopics[0]?.id,
        existingUnits[0]?.id
      );
      setImportResult(res);
      setIsImporting(false);
      if (onImportSuccess) {
        onImportSuccess(res);
      }
    } catch (err: unknown) {
      setIsImporting(false);
      setFileError(err instanceof Error ? err.message : 'Lỗi khi nhập từ vựng');
    }
  };

  const handleFinish = () => {
    onClose();
  };

  const handleGoToPractice = () => {
    onClose();
    window.location.href = '/practice';
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Nhập từ vựng từ File vào Sổ tay
              </h2>
              <p className="text-[11px] text-slate-500">
                Hỗ trợ TXT, DOCX, CSV, Excel & PDF • Xem trước và chỉnh sửa an toàn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="px-5 py-2.5 bg-slate-100/60 border-b border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            <span className={`font-semibold flex items-center gap-1.5 ${
              currentStep === 'upload' ? 'text-blue-600' : 'text-slate-600'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>1</span>
              <span>Chọn file</span>
            </span>

            <span className="text-slate-300">›</span>

            {docData?.rawRows && docData.rawRows.length > 0 && importMode === 'structured' && (
              <>
                <span className={`font-semibold flex items-center gap-1.5 ${
                  currentStep === 'mapping' ? 'text-blue-600' : 'text-slate-600'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep === 'mapping' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>2</span>
                  <span>Ánh xạ cột</span>
                </span>
                <span className="text-slate-300">›</span>
              </>
            )}

            <span className={`font-semibold flex items-center gap-1.5 ${
              currentStep === 'preview' ? 'text-blue-600' : 'text-slate-600'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {docData?.rawRows && docData.rawRows.length > 0 && importMode === 'structured' ? '3' : '2'}
              </span>
              <span>Xem trước ({selectedRows.length})</span>
            </span>

            {duplicateSelectedRows.length > 0 && (
              <>
                <span className="text-slate-300">›</span>
                <span className={`font-semibold flex items-center gap-1.5 ${
                  currentStep === 'duplicates' ? 'text-indigo-600' : 'text-slate-600'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep === 'duplicates' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>!</span>
                  <span>Từ trùng ({duplicateSelectedRows.length})</span>
                </span>
              </>
            )}

            <span className="text-slate-300">›</span>

            <span className={`font-semibold flex items-center gap-1.5 ${
              currentStep === 'confirm' ? 'text-blue-600' : 'text-slate-600'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 'confirm' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>✓</span>
              <span>Xác nhận</span>
            </span>
          </div>

          <div className="hidden sm:block text-[11px] text-slate-400">
            Chưa lưu dữ liệu vào sổ trước khi xác nhận
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
          {/* STEP 1: Upload */}
          {currentStep === 'upload' && (
            <FileDropzone
              selectedFile={selectedFile}
              onFileSelected={handleFileSelected}
              onClearFile={handleClearFile}
              importMode={importMode}
              onModeChange={setImportMode}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              error={fileError}
            />
          )}

          {/* STEP 1.5: Mapping (if tabular) */}
          {currentStep === 'mapping' && docData && docData.headers && docData.rawRows && (
            <ColumnMapper
              headers={docData.headers}
              rawRows={docData.rawRows}
              mapping={columnMapping}
              onMappingChange={setColumnMapping}
            />
          )}

          {/* STEP 2: Preview Table */}
          {currentStep === 'preview' && (
            <PreviewTable
              rows={parsedRows}
              onRowsChange={setParsedRows}
              existingTopics={existingTopics}
              existingUnits={existingUnits}
            />
          )}

          {/* STEP 2.5: Duplicate Resolution */}
          {currentStep === 'duplicates' && (
            <DuplicateStrategyStep
              strategy={duplicateStrategy}
              onStrategyChange={setDuplicateStrategy}
              duplicateRows={duplicateSelectedRows}
            />
          )}

          {/* STEP 3: Confirm & Summary */}
          {currentStep === 'confirm' && (
            <ImportSummaryStep
              selectedRows={selectedRows}
              duplicateStrategy={duplicateStrategy}
              result={importResult}
              isImporting={isImporting}
              onConfirmImport={handleConfirmImport}
              onFinish={handleFinish}
              onGoToPractice={handleGoToPractice}
            />
          )}
        </div>

        {/* Modal Footer Controls (hide if post-import result displayed) */}
        {!importResult && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
            <div>
              {currentStep !== 'upload' && (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 'confirm') {
                      setCurrentStep(duplicateSelectedRows.length > 0 ? 'duplicates' : 'preview');
                    } else if (currentStep === 'duplicates') {
                      setCurrentStep('preview');
                    } else if (currentStep === 'preview') {
                      if (docData?.rawRows && docData.rawRows.length > 0 && importMode === 'structured') {
                        setCurrentStep('mapping');
                      } else {
                        setCurrentStep('upload');
                      }
                    } else if (currentStep === 'mapping') {
                      setCurrentStep('upload');
                    }
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                Hủy
              </button>

              {currentStep === 'upload' && (
                <button
                  type="button"
                  onClick={handleProceedFromUpload}
                  disabled={!docData || isLoading}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>Tiếp tục phân tích</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStep === 'mapping' && (
                <button
                  type="button"
                  onClick={handleProceedFromMapping}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Xem trước danh sách từ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStep === 'preview' && (
                <button
                  type="button"
                  onClick={handleProceedFromPreview}
                  disabled={selectedRows.length === 0}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>Tiếp tục ({selectedRows.length} từ)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStep === 'duplicates' && (
                <button
                  type="button"
                  onClick={handleProceedFromDuplicates}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Xác nhận phương án</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
