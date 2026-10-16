import React from 'react';
import Link from 'next/link';
import { BookOpen, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">My TOEIC Notebook</span>
          <span className="text-slate-300">|</span>
          <span>Sổ tay học từ vựng, Listening & Reading TOEIC cá nhân</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Bảo mật ghi chú cá nhân
          </span>
          <Link href="/settings" className="hover:text-blue-600 transition-colors">
            Sao lưu dữ liệu
          </Link>
        </div>
      </div>
    </footer>
  );
}
