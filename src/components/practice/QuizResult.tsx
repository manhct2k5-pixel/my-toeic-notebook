'use client';

import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Sparkles,
  Volume2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { VocabularyItem } from '@/types';
import { playAudioOrSpeak } from '@/lib/speech';
import confetti from 'canvas-confetti';
import Link from 'next/link';

interface QuizResultProps {
  total: number;
  correctCount: number;
  wrongWordIds: string[];
  history: { word: VocabularyItem; correct: boolean; userAnswer?: string }[];
  onRetryAll: () => void;
  onRetryWrongOnly: () => void;
  onNewQuiz: () => void;
}

export function QuizResult({
  total,
  correctCount,
  wrongWordIds,
  history,
  onRetryAll,
  onRetryWrongOnly,
  onNewQuiz,
}: QuizResultProps) {
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const wrongWords = history.filter((h) => !h.correct).map((h) => h.word);
  const [playingId, setPlayingId] = useState<string | null>(null);

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

  const handleAudio = (word: VocabularyItem) => {
    setPlayingId(word.id);
    playAudioOrSpeak({
      text: word.word,
      accent: 'us',
      directAudioUrl: word.audio_us || word.audio_uk,
      onStart: () => setPlayingId(word.id),
      onEnd: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      
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
            Tổng kết kết quả kiểm tra từ vựng cá nhân
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

        {/* Notice about wrong words auto-prioritized in notebook */}
        {wrongWords.length > 0 && (
          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 justify-center">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              {wrongWords.length} từ trả lời sai đã được tự động gắn nhãn &quot;Cần ôn tập&quot; và ưu tiên trong lần ôn tiếp theo.
            </span>
          </div>
        )}

        {/* Action Buttons: Retry All, Retry Wrong Only, New Quiz, Open Notebook */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
          {wrongWords.length > 0 && (
            <button
              onClick={onRetryWrongOnly}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chỉ ôn những từ sai ({wrongWords.length})</span>
            </button>
          )}

          <button
            onClick={onRetryAll}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Làm lại toàn bộ</span>
          </button>

          <button
            onClick={onNewQuiz}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            Bài kiểm tra mới
          </button>

          <Link
            href="/notebook"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Mở My Notebook</span>
          </Link>
        </div>
      </div>

      {/* Detailed Word-by-Word Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Chi tiết kết quả từng từ ({history.length} từ)
          </h3>
          <span className="text-[11px] text-slate-400">
            Nhấn vào &quot;Xem trong Sổ&quot; để mở chi tiết hoặc chỉnh sửa ghi chú
          </span>
        </div>

        <div className="space-y-2.5">
          {history.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                item.correct ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.correct ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-bold text-base text-slate-900">{item.word.word}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    {item.word.pos}
                  </span>
                  {item.word.phonetic_us && (
                    <span className="text-xs font-mono text-slate-400">
                      {item.word.phonetic_us}
                    </span>
                  )}
                  <button
                    onClick={() => handleAudio(item.word)}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${playingId === item.word.id ? 'text-blue-600 animate-pulse' : ''}`} />
                  </button>
                </div>

                <p className="text-xs text-slate-700">
                  Nghĩa tiếng Việt: <strong className="text-slate-900">{item.word.meaning_vi}</strong>
                </p>

                {item.userAnswer && !item.correct && (
                  <p className="text-[11px] text-rose-600">
                    Bạn đã chọn/gõ: &quot;{item.userAnswer}&quot;
                  </p>
                )}

                {item.word.notes && (
                  <p className="text-[11px] text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/50 inline-block mt-0.5">
                    Ghi chú: {item.word.notes}
                  </p>
                )}
              </div>

              {/* 1-click Link to My Notebook for this word */}
              <Link
                href={`/notebook?wordId=${item.word.id}`}
                target="_blank"
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors"
                title="Mở từ vựng trong My Notebook ở tab mới"
              >
                <span>Xem trong Sổ</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
