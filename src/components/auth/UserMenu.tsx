'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, 
  LogOut, 
  Cloud, 
  CloudOff, 
  CloudUpload, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown,
  Settings
} from 'lucide-react';
import { useAuth, SyncStatus } from '@/lib/auth-context';
import { AuthModal } from './AuthModal';
import { MigrateModal } from './MigrateModal';
import { subscribeToSync, notifyListeners } from '@/lib/storage';
import Link from 'next/link';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [migrateModalOpen, setMigrateModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | undefined>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToSync((status, err) => {
      setSyncState(status);
      setSyncError(err);
      if (status === 'saved') {
        const timer = setTimeout(() => {
          setSyncState('idle');
        }, 3000);
        return () => clearTimeout(timer);
      }
    });
    return () => unsub();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSync = () => {
    notifyListeners();
    setDropdownOpen(false);
  };

  const getInitials = (email?: string): string => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <>
      <div className="flex items-center gap-2" ref={dropdownRef}>
        
        {/* Real-time Sync Status Badge */}
        {syncState === 'saving' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium animate-pulse">
            <span className="w-2.5 h-2.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span>Đang lưu...</span>
          </div>
        )}

        {syncState === 'saved' && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium transition-all">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã lưu</span>
          </div>
        )}

        {syncState === 'error' && (
          <button
            onClick={handleManualSync}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[11px] font-medium transition-colors"
            title={syncError || 'Nhấn để thử lưu lại'}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Không thể lưu – Thử lại</span>
          </button>
        )}

        {syncState === 'offline' && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
            <CloudOff className="w-3.5 h-3.5 text-slate-500" />
            <span>Ngoại tuyến</span>
          </div>
        )}

        {/* User Account / Login Button */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {getInitials(user.email)}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                {user.email?.split('@')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Đã đăng nhập tài khoản
                  </span>
                  <p className="text-xs font-bold text-slate-900 truncate" title={user.email}>
                    {user.email}
                  </p>
                  <div className="flex items-center gap-1 pt-1 text-[11px] text-emerald-700">
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đồng bộ Supabase Cloud</span>
                  </div>
                </div>

                <div className="py-1 text-xs">
                  <button
                    onClick={() => {
                      setMigrateModalOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <CloudUpload className="w-4 h-4 text-blue-600" />
                    <span>Chuyển dữ liệu máy này lên Cloud</span>
                  </button>

                  <button
                    onClick={handleManualSync}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                    <span>Đồng bộ dữ liệu ngay</span>
                  </button>

                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Cài đặt & Sao lưu dữ liệu</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={async () => {
                      setDropdownOpen(false);
                      await signOut();
                    }}
                    className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-xs font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-xs transition-all"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          // Suggest migrating local data if exists
          setMigrateModalOpen(true);
        }}
      />

      <MigrateModal
        isOpen={migrateModalOpen}
        onClose={() => setMigrateModalOpen(false)}
      />
    </>
  );
}
