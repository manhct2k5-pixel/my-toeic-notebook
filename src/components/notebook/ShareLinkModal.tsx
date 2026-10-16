'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Copy, 
  Check, 
  ShieldCheck, 
  Share2, 
  RotateCcw, 
  KeyRound, 
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useNotebook } from '@/lib/notebook-context';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareLinkModal({ isOpen, onClose }: ShareLinkModalProps) {
  const { 
    token, 
    shareUrl, 
    profileNames, 
    createSharedNotebook, 
    connectWithToken, 
    rotateLink 
  } = useNotebook();

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  const [rotateSuccess, setRotateSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key and prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCreateNew = async () => {
    setLoading(true);
    try {
      await createSharedNotebook();
    } finally {
      setLoading(false);
    }
  };

  const handleConnectManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;

    let clean = manualToken.trim();
    // If user pasted a full URL, extract token from search or hash
    if (clean.includes('token=')) {
      try {
        const url = new URL(clean);
        const t = url.searchParams.get('token') || new URLSearchParams(url.hash.substring(1)).get('token');
        if (t) clean = t;
      } catch {
        const match = clean.match(/token=([a-zA-Z0-9_-]+)/);
        if (match) clean = match[1];
      }
    }

    setLoading(true);
    setManualError(null);
    try {
      const ok = await connectWithToken(clean);
      if (ok) {
        setShowManualInput(false);
        setManualToken('');
      } else {
        setManualError('Không tìm thấy sổ tay với mã liên kết này');
      }
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : 'Lỗi kết nối mã liên kết');
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async () => {
    setLoading(true);
    setShowRotateConfirm(false);
    try {
      const res = await rotateLink();
      if (res) {
        setRotateSuccess(true);
        setTimeout(() => setRotateSuccess(false), 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-900/35 backdrop-blur-[2px] flex min-h-full items-center justify-center animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Liên kết dùng chung cho 2 người</h3>
              <p className="text-xs text-slate-500">
                {profileNames.profile_a} &amp; {profileNames.profile_b}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {token ? (
            <>
              {/* Link Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Đường link truy cập trực tiếp
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-700 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Security info card */}
              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Cách thức hoạt động (Không cần tài khoản)</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Đường link này chứa mã truy cập ngẫu nhiên an toàn. Bất kỳ ai mở link này đều vào thẳng sổ từ vựng dùng chung của 2 bạn mà không phải tạo tài khoản, điền mật khẩu hay xác thực email.
                </p>
                <ul className="text-xs text-blue-700 space-y-1 pl-4 list-disc">
                  <li><strong>Gửi cho bạn cùng học:</strong> Bạn học mở link là có thể học và thêm từ vựng ngay.</li>
                  <li><strong>Lưu vào Bookmark:</strong> Cả 2 nên lưu link vào thanh dấu trang để truy cập lại trên máy tính hoặc điện thoại.</li>
                </ul>
              </div>

              {rotateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã thu hồi link cũ và tạo đường link mới thành công! Link cũ hiện không thể truy cập được nữa.</span>
                </div>
              )}

              {/* Actions row: rotate or switch token */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                {!showRotateConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowRotateConfirm(true)}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-amber-700 font-medium py-1"
                    title="Nếu lỡ gửi nhầm link cho người ngoài"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Thu hồi & tạo link mới</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Thu hồi link cũ?</span>
                    <button
                      type="button"
                      onClick={handleRotate}
                      disabled={loading}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs"
                    >
                      Xác nhận
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRotateConfirm(false)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-800 text-xs"
                    >
                      Hủy
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium py-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{showManualInput ? 'Đóng' : 'Nhập mã liên kết khác'}</span>
                </button>
              </div>
            </>
          ) : (
            /* No token state */
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Bắt đầu học chung cùng bạn bè</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Tạo một đường link riêng để cả hai bạn cùng thêm từ vựng, học chung một sổ tay nhưng theo dõi tiến độ nhớ từ riêng biệt.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Tạo link riêng mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <span>Tôi đã có mã liên kết</span>
                </button>
              </div>
            </div>
          )}

          {/* Manual Input Form */}
          {showManualInput && (
            <form onSubmit={handleConnectManual} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dán đường link đầy đủ hoặc mã token của bạn cùng học
                </label>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="https://.../?token=toeic_... hoặc toeic_..."
                  required
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {manualError && (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{manualError}</span>
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !manualToken.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Kết nối sổ tay</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
