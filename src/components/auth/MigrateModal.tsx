'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  CloudUpload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Tag, 
  BookMarked, 
  Edit3,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getLocalSnapshot, migrateLocalDataToCloud, exportData } from '@/lib/storage';

interface MigrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrated?: () => void;
}

export function MigrateModal({ isOpen, onClose, onMigrated }: MigrateModalProps) {
  const { user } = useAuth();
  const snapshot = useMemo(() => {
    if (!isOpen) return { topics: [], units: [], vocabulary: [], quiz_attempts: [], totalWords: 0, totalTopics: 0, totalUnits: 0, notesCount: 0 };
    return getLocalSnapshot();
  }, [isOpen]);

  const [loading, setLoading] = useState(false);
  const [downloadedBackup, setDownloadedBackup] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    migratedTopics: number;
    migratedUnits: number;
    migratedWords: number;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-toeic-notebook-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadedBackup(true);
    } catch (e) {
      console.error('Backup download error', e);
    }
  };

  const handleStartMigration = async () => {
    if (!user) return;
    setLoading(true);
    setResult(null);

    const res = await migrateLocalDataToCloud(user.id);
    setLoading(false);
    setResult(res);

    if (res.success && onMigrated) {
      onMigrated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Chuyển dữ liệu học tập lên Cloud
              </h2>
              <p className="text-xs text-slate-500">
                Đồng bộ từ vựng đã lưu trên máy này vào tài khoản của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Summary of local data detected */}
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Dữ liệu phát hiện trên thiết bị này:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <BookMarked className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="text-base font-bold text-slate-900 block">{snapshot.totalWords}</span>
                <span className="text-[11px] text-slate-500">Từ vựng</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Tag className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <span className="text-base font-bold text-slate-900 block">{snapshot.totalTopics}</span>
                <span className="text-[11px] text-slate-500">Chủ đề</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Layers className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-base font-bold text-slate-900 block">{snapshot.totalUnits}</span>
                <span className="text-[11px] text-slate-500">Unit / Bài học</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Edit3 className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <span className="text-base font-bold text-slate-900 block">{snapshot.notesCount}</span>
                <span className="text-[11px] text-slate-500">Có ghi chú</span>
              </div>
            </div>
          </div>

          {/* Pre-migration backup guarantee */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-800 block">Sao lưu dữ liệu trước khi chuyển</span>
              <p className="text-[11px] text-slate-500">
                Tải file JSON dự phòng về máy để đảm bảo không mất mát dữ liệu
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                downloadedBackup
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {downloadedBackup ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã tải JSON</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tải sao lưu</span>
                </>
              )}
            </button>
          </div>

          {/* Migration Result Banner */}
          {result && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1 animate-in fade-in ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {result.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Chuyển dữ liệu lên Cloud thành công!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Chuyển dữ liệu thất bại</span>
                  </>
                )}
              </div>
              {result.success ? (
                <p className="text-xs text-emerald-800">
                  Đã tải lên tài khoản: <strong>{result.migratedWords} từ vựng</strong>,{' '}
                  <strong>{result.migratedTopics} chủ đề</strong> và <strong>{result.migratedUnits} Unit</strong>. 
                  Bạn có thể mở website trên bất kỳ thiết bị nào khác và đăng nhập để học tiếp.
                </p>
              ) : (
                <p className="text-xs text-rose-800">{result.error}</p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {result?.success ? 'Đóng' : 'Để sau'}
            </button>

            {!result?.success && (
              <button
                type="button"
                disabled={loading || snapshot.totalWords === 0}
                onClick={handleStartMigration}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang chuyển dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Chuyển vào tài khoản</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Dữ liệu trên máy của bạn được giữ nguyên vẹn an toàn, không bị xóa tự động.</span>
          </div>

        </div>
      </div>
    </div>
  );
}
