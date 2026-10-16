'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  BookMarked,
  ShieldCheck,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { 
  getVocabulary, 
  getQuizAttempts,
  subscribeToStorage 
} from '@/lib/storage';
import { VocabularyItem, QuizAttempt } from '@/types';
import { isDueForReview, getTodayISO } from '@/lib/srs';

export default function HomePage() {
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const [todayISO, setTodayISO] = useState<string>('2026-10-16');
  const [greeting, setGreeting] = useState<string>('Chào bạn!');

  const loadData = async () => {
    try {
      const [v, qa] = await Promise.all([
        getVocabulary(),
        getQuizAttempts(),
      ]);
      setWords(v);
      setQuizAttempts(qa);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setTodayISO(getTodayISO());
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chào buổi sáng!');
    else if (hour < 18) setGreeting('Chào buổi chiều!');
    else setGreeting('Chào buổi tối!');

    const unsubscribe = subscribeToStorage(() => loadData());
    return () => unsubscribe();
  }, []);

  const totalWords = words.length;
  const wordsDueToday = words.filter((w) => isDueForReview(w, todayISO)).length;
  const unmemorizedWords = words.filter((w) => !w.is_memorized).length;
  const needsReviewWords = words.filter((w) => w.needs_review || (w.incorrect_count && w.incorrect_count > 0)).length;

  const lastAttempt = quizAttempts[0];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Đang tải thông tin sổ tay...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* 1. Lời chào cá nhân & Mục tiêu */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sổ học từ vựng TOEIC thông minh</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {greeting} Chúc bạn một buổi học tập hiệu quả.
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
          Quản lý từ vựng TOEIC theo chủ đề, bài học và ngày học. Hệ thống Flashcard & Quiz Spaced Repetition giúp bạn ghi nhớ sâu và lâu dài.
        </p>
      </div>

      {/* Thông báo độc lập dữ liệu & Cảnh báo sao lưu */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-0.5">
          <p className="font-semibold">
            Không gian học tập độc lập & Bảo mật trên thiết bị của bạn
          </p>
          <p className="text-blue-800 leading-relaxed">
            Dữ liệu được lưu trữ trực tiếp trên trình duyệt của riêng bạn. Khi bạn bè truy cập cùng đường link, họ sẽ có không gian học tập riêng và không bao giờ ghi đè lên dữ liệu của bạn. Hãy định kỳ vào <strong>Cài đặt → Xuất dữ liệu JSON</strong> để sao lưu an toàn!
          </p>
        </div>
      </div>

      {/* 2. Thống kê gọn: Số từ đã lưu & Số từ cần ôn hôm nay */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Card: Số từ đã lưu */}
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng số từ đã lưu
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {totalWords}
            </span>
            <span className="text-xs text-slate-500 font-medium">từ vựng</span>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Gồm {unmemorizedWords} từ đang học và {totalWords - unmemorizedWords} từ đã thuộc lòng.
          </p>
        </div>

        {/* Card: Số từ cần ôn hôm nay */}
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Từ cần ôn hôm nay
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-rose-600">
              {wordsDueToday}
            </span>
            <span className="text-xs text-slate-500 font-medium">từ đến hạn ôn</span>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Theo thuật toán ôn cách quãng (Spaced Repetition) để củng cố trí nhớ kịp thời.
          </p>
        </div>

      </div>

      {/* 3. Tiến độ ôn tập & Hoạt động gần nhất */}
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          Lịch trình ôn tập Spaced Repetition
        </span>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${wordsDueToday > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              <h3 className="text-base font-bold text-slate-900">
                {wordsDueToday > 0 
                  ? `Có ${wordsDueToday} từ vựng cần bạn ôn luyện hôm nay!` 
                  : 'Hôm nay bạn đã hoàn thành tất cả các từ đến hạn ôn!'}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {lastAttempt
                ? `Bài kiểm tra gần nhất: đạt ${lastAttempt.score_percentage}% (${lastAttempt.correct_count}/${lastAttempt.total_questions} từ).`
                : 'Bắt đầu bài kiểm tra Quiz hoặc Flashcard để kiểm tra mức độ ghi nhớ.'}
            </p>
          </div>

          <Link
            href="/practice"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm font-semibold transition-colors shrink-0 shadow-xs"
          >
            <span>{wordsDueToday > 0 ? 'Bắt đầu ôn ngay' : 'Làm Quiz mới'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4. Hai nút điều hướng chính: "Ôn từ vựng" & "Mở My Notebook" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <Link
          href="/practice"
          className="flex items-center justify-between p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/50 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold block">Ôn tập & Quiz</span>
              <span className="text-xs text-blue-100">
                Flashcard, Trắc nghiệm, Gõ từ & Nghe phát âm
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-200 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/notebook"
          className="flex items-center justify-between p-4 rounded-xl bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold block">Mở My Notebook</span>
              <span className="text-xs text-slate-500">
                Ghi chú, phát âm UK/US và phân loại từ
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

    </div>
  );
}
