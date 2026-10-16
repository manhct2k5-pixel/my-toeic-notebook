'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  RotateCcw, 
  ShieldCheck, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle,
  Database
} from 'lucide-react';
import { 
  exportData, 
  importData, 
  exportCSV, 
  resetToSampleData 
} from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function SettingsPage() {
  const [supabaseActive, setSupabaseActive] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [resetStatus, setResetStatus] = useState(false);

  useEffect(() => {
    setSupabaseActive(isSupabaseConfigured());
  }, []);

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
          <span>Cài đặt & Sao lưu dữ liệu</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Quản lý trạng thái lưu trữ, sao lưu JSON/CSV và khôi phục dữ liệu học tập cá nhân.
        </p>
      </div>

      {/* Storage Mode Notice */}
      <div className="p-5 rounded-2xl border bg-amber-50/80 border-amber-200 text-amber-950 space-y-3">
        <div className="flex items-start gap-3">
          <HardDrive className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-bold text-amber-900">
              Lưu trữ độc lập trên từng thiết bị (Local-First Storage)
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              Website hoạt động hoàn toàn độc lập trên từng trình duyệt. Khi bạn chia sẻ link cho bạn bè, <strong>mỗi người sẽ có cuốn sổ tay riêng biệt và không bao giờ bị ghi đè dữ liệu của nhau</strong>.
            </p>
          </div>
        </div>

        <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
          <p className="font-semibold text-rose-700 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            Lưu ý bảo quản ghi chú:
          </p>
          <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
            <li>Tải lại trang (F5) hoặc đóng tab <strong>không làm mất dữ liệu</strong>.</li>
            <li>Hạn chế dùng chế độ Ẩn danh (Incognito) vì trình duyệt sẽ tự xóa dữ liệu khi đóng cửa sổ.</li>
            <li>Nếu bạn thực hiện thao tác &quot;Xóa dữ liệu duyệt web/Cookies/Storage&quot; trên trình duyệt, các ghi chú có thể bị mất.</li>
            <li><strong>Khuyến nghị:</strong> Hãy thường xuyên nhấn <em>&quot;Xuất toàn bộ dữ liệu (JSON)&quot;</em> bên dưới để lưu file sao lưu về máy tính!</li>
          </ul>
        </div>
      </div>

      {/* Backup and Export Section */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Sao lưu & Xuất dữ liệu</h2>
          <p className="text-xs text-slate-500">
            Tải bản sao lưu toàn bộ sổ từ vựng, bài tập và lịch sử kiểm tra để tránh mất dữ liệu.
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

      {/* Import Section */}
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

      {/* Reset to Sample Data */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Dữ liệu mẫu ban đầu</h2>
          <p className="text-xs text-slate-500">
            Đặt lại hệ thống về bộ từ vựng và bài học mẫu ban đầu (Office & Work, Finance, Contracts, Marketing).
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

    </div>
  );
}
