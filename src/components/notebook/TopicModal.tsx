'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FolderPlus, Tag } from 'lucide-react';
import { Topic } from '@/types';
import { saveTopic } from '@/lib/storage';

interface TopicModalProps {
  isOpen: boolean;
  topic?: Topic | null;
  onClose: () => void;
  onSaved: (savedTopic: Topic) => void;
}

const COLOR_OPTIONS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#7c3aed', // Purple
  '#ea580c', // Orange
  '#db2777', // Pink
  '#4f46e5', // Indigo
  '#0891b2', // Cyan
  '#475569', // Slate
];

export function TopicModal({ isOpen, topic, onClose, onSaved }: TopicModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (topic) {
      setName(topic.name);
      setDescription(topic.description || '');
      setColor(topic.color || COLOR_OPTIONS[0]);
    } else {
      setName('');
      setDescription('');
      setColor(COLOR_OPTIONS[0]);
    }
    setError('');
  }, [topic, isOpen]);

  // Handle ESC key and scroll lock
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên chủ đề');
      return;
    }

    try {
      setIsSaving(true);
      const saved = await saveTopic({
        id: topic ? topic.id : undefined,
        name: name.trim(),
        description: description.trim(),
        color,
      });
      setIsSaving(false);
      onSaved(saved);
      onClose();
    } catch {
      setIsSaving(false);
      setError('Không thể lưu chủ đề. Vui lòng thử lại.');
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-900/35 backdrop-blur-[2px] flex min-h-full items-center justify-center animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600 shrink-0" />
            <h3 className="font-semibold text-slate-900 text-base">
              {topic ? 'Chỉnh sửa chủ đề' : 'Tạo chủ đề mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {error}
              </div>
            )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên chủ đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Office & Work, Finance, Contracts..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mô tả ngắn gọn
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Mô tả nhóm từ vựng của chủ đề này..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Màu biểu thị
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-800' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Đang lưu...' : topic ? 'Lưu thay đổi' : 'Tạo chủ đề'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
