'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Check, 
  Edit2, 
  CloudCheck, 
  CloudOff, 
  RefreshCw, 
  AlertCircle,
  Share2,
  X,
  Sparkles
} from 'lucide-react';
import { useNotebook } from '@/lib/notebook-context';
import { ShareLinkModal } from './ShareLinkModal';

export function ProfileSwitcher() {
  const {
    activeProfile,
    profileNames,
    switchProfile,
    updateNames,
    syncStatus,
    token,
  } = useNotebook();

  const [mounted, setMounted] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [nameA, setNameA] = useState(profileNames.profile_a);
  const [nameB, setNameB] = useState(profileNames.profile_b);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [savingNames, setSavingNames] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key and scroll lock for Rename modal
  useEffect(() => {
    if (!isRenameOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsRenameOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isRenameOpen]);

  const handleOpenRename = () => {
    setNameA(profileNames.profile_a);
    setNameB(profileNames.profile_b);
    setIsRenameOpen(true);
  };

  const handleSaveNames = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameA.trim() || !nameB.trim()) return;
    setSavingNames(true);
    try {
      await updateNames(nameA.trim(), nameB.trim());
      setIsRenameOpen(false);
    } finally {
      setSavingNames(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Sync Status Badge */}
        <div className="hidden sm:flex items-center">
          {syncStatus === 'saving' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
              <span>Đang lưu...</span>
            </span>
          )}
          {syncStatus === 'saved' && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200" title="Đã lưu trực tuyến">
              <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã lưu</span>
            </span>
          )}
          {syncStatus === 'error' && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200" title="Chưa đồng bộ được với Cloud">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Lỗi lưu</span>
            </span>
          )}
          {syncStatus === 'offline' && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200" title="Chế độ ngoại tuyến">
              <CloudOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Ngoại tuyến</span>
            </span>
          )}
        </div>

        {/* 2-Profile Switcher Pills */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => switchProfile('profile_a')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeProfile === 'profile_a'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title={`Chuyển sang hồ sơ ${profileNames.profile_a}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300 ring-2 ring-blue-400/40 shrink-0" />
            <span className="max-w-[50px] xs:max-w-[70px] sm:max-w-[110px] truncate">{profileNames.profile_a}</span>
          </button>

          <button
            type="button"
            onClick={() => switchProfile('profile_b')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeProfile === 'profile_b'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title={`Chuyển sang hồ sơ ${profileNames.profile_b}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 ring-2 ring-indigo-400/40 shrink-0" />
            <span className="max-w-[50px] xs:max-w-[70px] sm:max-w-[110px] truncate">{profileNames.profile_b}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenRename}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
            title="Đổi tên 2 hồ sơ"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Share Link Button */}
        <button
          type="button"
          onClick={() => setIsShareOpen(true)}
          className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium transition-all ${
            token
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
          title="Xem link chia sẻ riêng cho 2 người"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-semibold">
            {token ? 'Link riêng' : 'Tạo link'}
          </span>
        </button>
      </div>

      {/* Share Link Modal */}
      <ShareLinkModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />

      {/* Rename Profiles Modal */}
      {isRenameOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-900/35 backdrop-blur-[2px] flex min-h-full items-center justify-center animate-in fade-in duration-150"
          onClick={() => setIsRenameOpen(false)}
        >
          <div 
            className="w-full max-w-sm my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Đổi tên 2 hồ sơ</h3>
                  <p className="text-xs text-slate-500">Dễ nhận biết khi bạn và bạn học cùng ôn tập</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRenameOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNames} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Hồ sơ 1 (Hiện tại: {profileNames.profile_a})
                </label>
                <input
                  type="text"
                  value={nameA}
                  onChange={(e) => setNameA(e.target.value)}
                  placeholder="Ví dụ: Nam, Minh, Lan..."
                  maxLength={25}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Hồ sơ 2 (Hiện tại: {profileNames.profile_b})
                </label>
                <input
                  type="text"
                  value={nameB}
                  onChange={(e) => setNameB(e.target.value)}
                  placeholder="Ví dụ: Bạn học, Mai, Hùng..."
                  maxLength={25}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Hai bạn cùng học chung 1 sổ từ vựng, nhưng lịch ôn tập, kết quả Quiz và tiến độ nhớ từ được lưu tách biệt theo hồ sơ.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingNames || !nameA.trim() || !nameB.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {savingNames ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
