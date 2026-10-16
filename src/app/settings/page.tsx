'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Users,
  Copy,
  Check,
  Share2,
  KeyRound,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  exportData, 
  importData, 
  exportCSV, 
  resetToSampleData
} from '@/lib/storage';
import { 
  isSupabaseConfigured, 
  getEffectiveSupabaseConfig, 
  saveRuntimeSupabaseConfig, 
  clearRuntimeSupabaseConfig,
  getSupabase
} from '@/lib/supabase';
import { useNotebook } from '@/lib/notebook-context';
import { ShareLinkModal } from '@/components/notebook/ShareLinkModal';

export default function SettingsPage() {
  const { 
    activeProfile, 
    profileNames, 
    switchProfile, 
    updateNames, 
    token, 
    shareUrl, 
    createSharedNotebook
  } = useNotebook();

  const [supabaseActive, setSupabaseActive] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [resetStatus, setResetStatus] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Profile names editing state
  const [nameA, setNameA] = useState(profileNames.profile_a);
  const [nameB, setNameB] = useState(profileNames.profile_b);
  const [savedProfilesMsg, setSavedProfilesMsg] = useState(false);

  // Runtime Supabase configuration form
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [configStatus, setConfigStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNameA(profileNames.profile_a);
      setNameB(profileNames.profile_b);
    }, 0);
    return () => clearTimeout(timer);
  }, [profileNames.profile_a, profileNames.profile_b]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSupabaseActive(isSupabaseConfigured());
      const cfg = getEffectiveSupabaseConfig();
      if (cfg) {
        setCustomUrl(cfg.url);
        setCustomKey(cfg.key);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveProfiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameA.trim() || !nameB.trim()) return;
    await updateNames(nameA.trim(), nameB.trim());
    setSavedProfilesMsg(true);
    setTimeout(() => setSavedProfilesMsg(false), 2500);
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      setConfigStatus({ message: 'Vui lòng nhập đầy đủ URL và Anon Key', isError: true });
      return;
    }

    if (!customUrl.startsWith('https://')) {
      setConfigStatus({ message: 'Supabase URL phải bắt đầu bằng https://', isError: true });
      return;
    }

    setTestingConnection(true);
    setConfigStatus(null);

    try {
      saveRuntimeSupabaseConfig(customUrl, customKey);
      const client = getSupabase();
      if (!client) throw new Error('Không thể khởi tạo client');

      // Test simple ping query
      const { error } = await client.from('vocabulary').select('id').limit(1);
      setTestingConnection(false);

      if (error && !error.message.includes('relation') && !error.message.includes('does not exist') && !error.message.includes('permission denied')) {
        if (error.code === 'PGRST301' || error.message.includes('JWT') || error.message.includes('apikey')) {
          setConfigStatus({ message: `Khóa API hoặc URL không đúng: ${error.message}`, isError: true });
          return;
        }
      }

      setSupabaseActive(true);
      setConfigStatus({
        message: 'Kết nối Supabase thành công! Dữ liệu 2 hồ sơ sẽ được đồng bộ trực tuyến.',
        isError: false,
      });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: unknown) {
      setTestingConnection(false);
      const errMsg = err instanceof Error ? err.message : 'Vui lòng kiểm tra lại URL và Anon Key';
      setConfigStatus({
        message: `Lỗi kết nối: ${errMsg}`,
        isError: true,
      });
    }
  };

  const handleClearSupabaseConfig = () => {
    if (confirm('Bạn có chắc muốn xóa cấu hình Supabase đã lưu trên trình duyệt này?')) {
      clearRuntimeSupabaseConfig();
      setCustomUrl('');
      setCustomKey('');
      setSupabaseActive(false);
      setConfigStatus({ message: 'Đã xóa cấu hình Supabase.', isError: false });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleExportJSON = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_toeic_notebook_2profiles_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    const csv = await exportCSV();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_toeic_vocabulary_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const res = await importData(parsed);
        if (res.success) {
          setImportStatus({
            message: `Nhập thành công ${res.addedWords} từ vựng, ${res.addedTopics} chủ đề vào sổ tay!`,
            isError: false,
          });
        } else {
          setImportStatus({
            message: res.error || 'Có lỗi xảy ra khi nhập dữ liệu.',
            isError: true,
          });
        }
      } catch {
        setImportStatus({ message: 'File JSON không đúng định dạng', isError: true });
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = async () => {
    if (confirm('Bạn có chắc muốn khôi phục về dữ liệu mẫu ban đầu? Tất cả từ vựng tự thêm sẽ bị đặt lại về mặc định.')) {
      resetToSampleData();
      setResetStatus(true);
      setTimeout(() => setResetStatus(false), 3000);
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      
      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          <span>Cài đặt & Sổ từ vựng 2 người học</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Quản lý tên 2 hồ sơ, liên kết chia sẻ riêng, đồng bộ Supabase Cloud và sao lưu JSON/CSV.
        </p>
      </div>

      {/* 1. 2-Profile Management Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2 Hồ sơ cùng học từ vựng
              </h2>
              <p className="text-xs text-slate-500">
                Sổ từ vựng dùng chung – Tiến độ nhớ từ & Quiz lưu riêng biệt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Hồ sơ thiết bị này:</span>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => switchProfile('profile_a')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeProfile === 'profile_a' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {profileNames.profile_a}
              </button>
              <button
                type="button"
                onClick={() => switchProfile('profile_b')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeProfile === 'profile_b' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {profileNames.profile_b}
              </button>
            </div>
          </div>
        </div>

        {/* Rename form */}
        <form onSubmit={handleSaveProfiles} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên Hồ sơ 1 (Người A)
            </label>
            <input
              type="text"
              value={nameA}
              onChange={(e) => setNameA(e.target.value)}
              placeholder="Ví dụ: Nam, Minh..."
              maxLength={25}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên Hồ sơ 2 (Người B)
            </label>
            <input
              type="text"
              value={nameB}
              onChange={(e) => setNameB(e.target.value)}
              placeholder="Ví dụ: Lan, Mai..."
              maxLength={25}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              * Khi đổi tên, cả 2 bạn đều thấy tên mới được cập nhật trên website.
            </span>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Lưu tên hồ sơ</span>
            </button>
          </div>
        </form>

        {savedProfilesMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Đã cập nhật tên hồ sơ thành công!</span>
          </div>
        )}
      </div>

      {/* 2. Capability Share Link Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Liên kết truy cập riêng (Không cần tài khoản)
              </h2>
              <p className="text-xs text-slate-500">
                {token ? 'Hai bạn cùng truy cập bằng đường link này' : 'Chưa tạo mã liên kết'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            Quản lý link
          </button>
        </div>

        {token ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-700 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 ${
                  copiedLink ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Đã sao chép' : 'Sao chép link'}</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Bảo mật Capability-based URL</span>
              </div>
              <p>
                Không yêu cầu đăng ký hay mật khẩu. Bất kỳ ai mở đường link trên đều xem và sửa được sổ từ vựng chung của 2 bạn. Nếu lỡ gửi link cho người ngoài, bạn có thể bấm <strong>Quản lý link</strong> để thu hồi và cấp lại link mới ngay lập tức.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
            <span>Bạn chưa tạo link riêng để chia sẻ cùng bạn học.</span>
            <button
              type="button"
              onClick={createSharedNotebook}
              className="flex items-center gap-1.5 px-3 py-1.5 font-bold bg-blue-600 text-white rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo link ngay</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Supabase Cloud Configuration Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              supabaseActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cơ sở dữ liệu Supabase (PostgreSQL Cloud)
              </h2>
              <p className="text-xs text-slate-500">
                {supabaseActive ? 'Đang kết nối trực tuyến – Lưu và đồng bộ tự động' : 'Đang chạy ở chế độ ngoại tuyến (localStorage)'}
              </p>
            </div>
          </div>

          {supabaseActive && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đang kết nối</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Anon Key (Public)
            </label>
            <input
              type="password"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {configStatus && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              configStatus.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {configStatus.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{configStatus.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-400">
              * Chỉ dùng Anon Public Key. Tuyệt đối không nhập Service Role Secret Key.
            </span>

            <div className="flex items-center gap-2">
              {supabaseActive && (
                <button
                  type="button"
                  onClick={handleClearSupabaseConfig}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  Xóa cấu hình
                </button>
              )}
              <button
                type="submit"
                disabled={testingConnection || !customUrl.trim() || !customKey.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs"
              >
                {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                <span>{testingConnection ? 'Đang kiểm tra...' : 'Lưu & Kiểm tra kết nối'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 4. Backup & Restore Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Sao lưu & Khôi phục dữ liệu</h2>
          <p className="text-xs text-slate-500">
            Xuất file JSON sao lưu đầy đủ 2 hồ sơ, xuất bảng tính Excel/CSV, hoặc nhập lại dữ liệu cũ.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportJSON}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-center group"
          >
            <Download className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Tải file JSON dự phòng</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Sổ từ vựng & 2 tiến độ</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-center group"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Xuất file CSV (Excel)</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Mở bằng Excel / Sheets</span>
          </button>

          <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all text-center cursor-pointer group">
            <Upload className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Nhập dữ liệu từ file JSON</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Khôi phục từ bản sao lưu</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            importStatus.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {importStatus.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{importStatus.message}</span>
          </div>
        )}

        {/* Danger Zone: Reset to sample */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-700 block">Đặt lại dữ liệu mẫu</span>
            <span className="text-slate-400">Khôi phục danh sách từ vựng TOEIC mẫu ban đầu</span>
          </div>

          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại mẫu</span>
          </button>
        </div>

        {resetStatus && (
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã khôi phục về dữ liệu mẫu ban đầu thành công!</span>
          </p>
        )}
      </div>

      {/* Share Link Modal */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

    </div>
  );
}
