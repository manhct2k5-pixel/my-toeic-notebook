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
  Cloud,
  CloudUpload,
  KeyRound,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { 
  exportData, 
  importData, 
  exportCSV, 
  resetToSampleData,
  getLocalSnapshot
} from '@/lib/storage';
import { 
  isSupabaseConfigured, 
  getEffectiveSupabaseConfig, 
  saveRuntimeSupabaseConfig, 
  clearRuntimeSupabaseConfig,
  getSupabase
} from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { MigrateModal } from '@/components/auth/MigrateModal';
import { AuthModal } from '@/components/auth/AuthModal';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [supabaseActive, setSupabaseActive] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [resetStatus, setResetStatus] = useState(false);
  const [migrateModalOpen, setMigrateModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Runtime Supabase configuration form
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [configStatus, setConfigStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const localSnapshot = getLocalSnapshot();

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

      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        // If error is about authentication or network
        if (error.code === 'PGRST301' || error.message.includes('JWT') || error.message.includes('apikey')) {
          setConfigStatus({ message: `Khóa API hoặc URL không đúng: ${error.message}`, isError: true });
          return;
        }
      }

      setSupabaseActive(true);
      setConfigStatus({
        message: 'Kết nối Supabase thành công! Bạn có thể đăng nhập hoặc tạo tài khoản để đồng bộ.',
        isError: false,
      });
      setTimeout(() => window.location.reload(), 1500);
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
    a.download = `my_toeic_notebook_backup_${new Date().toISOString().split('T')[0]}.json`;
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
      const content = event.target?.result as string;
      const res = await importData(content);
      if (res.success) {
        setImportStatus({
          message: `Nhập thành công ${res.count} từ vựng vào sổ tay!`,
          isError: false,
        });
      } else {
        setImportStatus({
          message: res.error || 'Có lỗi xảy ra khi nhập dữ liệu.',
          isError: true,
        });
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = async () => {
    if (confirm('Bạn có chắc muốn khôi phục về dữ liệu mẫu ban đầu? Tất cả từ đã lưu tự thêm sẽ được đưa về mẫu.')) {
      await resetToSampleData();
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
          <span>Cài đặt & Đồng bộ đám mây</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Quản lý tài khoản, đồng bộ Supabase Cloud, sao lưu JSON/CSV và khôi phục dữ liệu học tập.
        </p>
      </div>

      {/* 1. Account & Cloud Status Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              user ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {user ? 'Tài khoản người dùng Cloud' : 'Chưa đăng nhập'}
              </h2>
              <p className="text-xs text-slate-500">
                {user ? user.email : 'Đăng nhập để đồng bộ dữ liệu giữa máy tính và điện thoại'}
              </p>
            </div>
          </div>

          <div>
            {user ? (
              <button
                onClick={() => signOut()}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-rose-600 transition-colors"
              >
                Đăng xuất
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors"
              >
                Đăng nhập ngay
              </button>
            )}
          </div>
        </div>

        {user && localSnapshot.totalWords > 0 && (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-blue-900 block">
                Phát hiện {localSnapshot.totalWords} từ vựng trong bộ nhớ máy này
              </span>
              <p className="text-blue-700">
                Bạn có thể chuyển toàn bộ từ vựng và ghi chú này vào tài khoản trực tuyến của mình.
              </p>
            </div>
            <button
              onClick={() => setMigrateModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Chuyển vào tài khoản</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Supabase Configuration (Custom Project Connection) */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Cấu hình Supabase Cloud (PostgreSQL & RLS)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kết nối dự án Supabase của bạn để kích hoạt cơ sở dữ liệu PostgreSQL trực tuyến và đăng nhập Google.
            </p>
          </div>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium shrink-0"
          >
            <span>Tạo tài khoản Supabase</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {configStatus && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            configStatus.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {configStatus.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{configStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project URL
            </label>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://your-project-id.supabase.co"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Anon / Public API Key
            </label>
            <input
              type="password"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chỉ sử dụng Public Anon Key, không bao giờ nhập Service Role Key</span>
            </div>

            <div className="flex items-center gap-2">
              {supabaseActive && (
                <button
                  type="button"
                  onClick={handleClearSupabaseConfig}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa cấu hình</span>
                </button>
              )}

              <button
                type="submit"
                disabled={testingConnection}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {testingConnection ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang kiểm tra kết nối...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Lưu & Kết nối Supabase</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Backup and Export Section */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Sao lưu & Xuất dữ liệu</h2>
          <p className="text-xs text-slate-500">
            Tải bản sao lưu toàn bộ sổ từ vựng, bài tập và lịch sử kiểm tra về máy tính hoặc điện thoại.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Xuất toàn bộ dữ liệu (JSON)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất danh sách từ vựng (CSV)</span>
          </button>
        </div>
      </div>

      {/* 4. Import Section */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Nhập dữ liệu từ bản sao lưu</h2>
          <p className="text-xs text-slate-500">
            Khôi phục từ tệp JSON đã xuất trước đó. Dữ liệu sẽ được hợp nhất thông minh, không ghi đè dữ liệu trùng ngoài ý muốn.
          </p>
        </div>

        {importStatus && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            importStatus.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {importStatus.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Chọn tệp JSON để nhập</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 5. Reset to Sample Data */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Dữ liệu mẫu ban đầu</h2>
          <p className="text-xs text-slate-500">
            Đặt lại hệ thống về bộ từ vựng mẫu ban đầu (Office & Work, Finance, Contracts, Marketing).
          </p>
        </div>

        {resetStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã khôi phục dữ liệu mẫu ban đầu thành công!</span>
          </div>
        )}

        <div>
          <button
            onClick={handleResetData}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Khôi phục dữ liệu mẫu</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <MigrateModal
        isOpen={migrateModalOpen}
        onClose={() => setMigrateModalOpen(false)}
      />

    </div>
  );
}
