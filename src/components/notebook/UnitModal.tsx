'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Layers } from 'lucide-react';
import { Unit } from '@/types';
import { saveUnit } from '@/lib/storage';

interface UnitModalProps {
  isOpen: boolean;
  unit?: Unit | null;
  onClose: () => void;
  onSaved: (savedUnit: Unit) => void;
}

export function UnitModal({ isOpen, unit, onClose, onSaved }: UnitModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Listening' | 'Reading' | 'General'>('General');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (unit) {
      setTitle(unit.title);
      setDescription(unit.description || '');
      setCategory(unit.category || 'General');
    } else {
      setTitle('');
      setDescription('');
      setCategory('General');
    }
    setError('');
  }, [unit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên Unit / Bài học');
      return;
    }

    try {
      setIsSaving(true);
      const saved = await saveUnit({
        id: unit ? unit.id : undefined,
        title: title.trim(),
        description: description.trim(),
        category,
      });
      setIsSaving(false);
      onSaved(saved);
      onClose();
    } catch {
      setIsSaving(false);
      setError('Không thể lưu Unit. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-base">
              {unit ? 'Chỉnh sửa Unit / Lesson' : 'Tạo Unit / Lesson mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên Unit / Bài học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Lesson 01 – Contracts, TOEIC Part 2 Unit 01..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phân loại bài học
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['General', 'Listening', 'Reading'] as const).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    category === cat
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'General' ? 'Tổng hợp' : cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mô tả nội dung bài học
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Mô tả mục tiêu từ vựng hoặc phần kiến thức của Unit..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : unit ? 'Lưu thay đổi' : 'Tạo Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
