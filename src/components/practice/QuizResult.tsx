'use client';

import React, { useEffect } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { VocabularyItem } from '@/types';
import confetti from 'canvas-confetti';
import Link from 'next/link';

interface QuizResultProps {
  total: number;
  correctCount: number;
  wrongWordIds: string[];
  history: { word: VocabularyItem; correct: boolean; userAnswer?: string }[];
  onRetryWrongOnly: () => void;
  onNewQuiz: () => void;
}

export function QuizResult({
  total,
  correctCount,
  wrongWordIds,
  history,
  onRetryWrongOnly,
  onNewQuiz,
}: QuizResultProps) {
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const wrongWords = history.filter((h) => !h.correct).map((h) => h.word);

  useEffect(() => {
    if (percentage >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }
    }
  }, [percentage]);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Score Summary Card */}
      <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          {percentage >= 80 ? (
            <Trophy className="w-8 h-8 text-amber-500" />
          ) : percentage >= 50 ? (
            <Sparkles className="w-8 h-8 text-blue-600" />
          ) : (
            <RotateCcw className="w-8 h-8 text-rose-500" />
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {percentage >= 80
              ? 'Xuất sắc! Bạn đã ghi nhớ rất tốt'
              : percentage >= 50
              ? 'Khá tốt! Hãy tiếp tục ôn tập'
              : 'Cần ôn thêm! Đừng nản chí'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kết quả bài kiểm tra từ vựng
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2 max-w-md mx-auto">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Số câu đúng</span>
            <span className="text-xl font-bold text-emerald-600">
              {correctCount} / {total}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Tỷ lệ đúng</span>
            <span className="text-xl font-bold text-blue-600">{percentage}%</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Từ làm sai</span>
            <span className="text-xl font-bold text-rose-600">{wrongWords.length}</span>
          </div>
        </div>

        {/* Notice about wrong words added to needs review */}
        {wrongWords.length > 0 && (
          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 justify-center">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              {wrongWords.length} từ trả lời sai đã được tự động gắn nhãn &quot;Cần ôn tập&quot; trong Sổ từ vựng.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-3">
          {wrongWords.length > 0 && (
            <button
              onClick={onRetryWrongOnly}
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại chỉ các từ sai ({wrongWords.length})</span>
            </button>
          )}

          <button
            onClick={onNewQuiz}
            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            Bài kiểm tra mới
          </button>

          <Link
            href="/notebook"
            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Mở Sổ từ vựng</span>
          </Link>
        </div>
      </div>

      {/* Detailed Question Breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Chi tiết từng từ trong bài kiểm tra
        </h3>

        <div className="space-y-2">
          {history.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border bg-white flex items-start justify-between gap-3 ${
                item.correct ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {item.correct ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-bold text-sm text-slate-900">{item.word.word}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    {item.word.pos}
                  </span>
                  {item.word.phonetic_us && (
                    <span className="text-xs font-mono text-slate-400">
                      {item.word.phonetic_us}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700">
                  Nghĩa: <strong>{item.word.meaning_vi}</strong>
                </p>

                {item.userAnswer && !item.correct && (
                  <p className="text-[11px] text-rose-600">
                    Bạn đã chọn/nhập: &quot;{item.userAnswer}&quot;
                  </p>
                )}

                {item.word.example_en && (
                  <p className="text-[11px] text-slate-500 italic">
                    &quot;{item.word.example_en}&quot;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
