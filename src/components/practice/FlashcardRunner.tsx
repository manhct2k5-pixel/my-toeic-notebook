'use client';

import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  X, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { VocabularyItem } from '@/types';
import { playAudioOrSpeak } from '@/lib/speech';
import { calculateNextReview, ReviewGrade } from '@/lib/srs';
import { saveWord } from '@/lib/storage';

interface FlashcardRunnerProps {
  words: VocabularyItem[];
  onFinish: (results: {
    total: number;
    correctCount: number;
    wrongWordIds: string[];
    history: { word: VocabularyItem; correct: boolean }[];
  }) => void;
  onExit: () => void;
}

export function FlashcardRunner({ words, onFinish, onExit }: FlashcardRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [wrongWordIds, setWrongWordIds] = useState<string[]>([]);
  const [history, setHistory] = useState<{ word: VocabularyItem; correct: boolean }[]>([]);

  const currentWord = words[currentIndex];

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleAudio = (accent: 'uk' | 'us') => {
    if (!currentWord) return;
    const url = accent === 'uk' ? currentWord.audio_uk : currentWord.audio_us;
    playAudioOrSpeak({
      text: currentWord.word,
      accent,
      directAudioUrl: url,
      rate: audioSpeed,
    });
  };

  const handleGrade = async (grade: 'again' | 'hard' | 'good') => {
    if (!currentWord) return;

    // 'again' = Chưa nhớ, 'hard' = Khó nhớ, 'good' = Đã nhớ
    const isCorrect = grade !== 'again';
    const nextSRS = calculateNextReview(currentWord, grade as ReviewGrade);

    // Save updated SRS stats
    await saveWord({
      ...currentWord,
      review_interval_days: nextSRS.intervalDays,
      ease_factor: nextSRS.easeFactor,
      repetitions: nextSRS.repetitions,
      next_review_date: nextSRS.nextReviewDate,
      is_memorized: grade === 'good' ? true : false,
      needs_review: grade !== 'good',
      correct_count: isCorrect ? (currentWord.correct_count || 0) + 1 : currentWord.correct_count,
      incorrect_count: !isCorrect ? (currentWord.incorrect_count || 0) + 1 : currentWord.incorrect_count,
      last_reviewed_at: new Date().toISOString(),
    });

    const newHistory = [...history, { word: currentWord, correct: isCorrect }];
    setHistory(newHistory);

    const newWrongIds = isCorrect ? wrongWordIds : [...wrongWordIds, currentWord.id];
    setWrongWordIds(newWrongIds);

    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const correctCount = newHistory.filter((h) => h.correct).length;
      onFinish({
        total: words.length,
        correctCount,
        wrongWordIds: newWrongIds,
        history: newHistory,
      });
    }
  };

  if (!currentWord) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">
            {currentIndex + 1} / {words.length}
          </span>
          <div className="w-24 sm:w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[350px] sm:min-h-[390px] bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 flex flex-col justify-between cursor-pointer shadow-sm hover:border-blue-400 transition-all select-none relative"
      >
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Speed selector */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200 text-[10px]"
          >
            <button
              type="button"
              onClick={() => setAudioSpeed(0.75)}
              className={`px-1.5 py-0.5 rounded font-medium ${
                audioSpeed === 0.75 ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-500'
              }`}
            >
              0.75x
            </button>
            <button
              type="button"
              onClick={() => setAudioSpeed(1.0)}
              className={`px-1.5 py-0.5 rounded font-medium ${
                audioSpeed === 1.0 ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-500'
              }`}
            >
              1.0x
            </button>
          </div>

          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <RotateCw className="w-3.5 h-3.5" />
            Nhấn để lật
          </span>
        </div>

        {!isFlipped ? (
          /* FRONT SIDE */
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {currentWord.pos}
            </span>

            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {currentWord.word}
            </h2>

            {/* Pronunciation UK / US buttons */}
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleAudio('us')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-medium transition-colors"
                title="Nghe giọng US"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span>US {currentWord.phonetic_us || ''}</span>
              </button>

              <button
                onClick={() => handleAudio('uk')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-medium transition-colors"
                title="Nghe giọng UK"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span>UK {currentWord.phonetic_uk || ''}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 pt-4">
              Nhấn vào thẻ để kiểm tra nghĩa và ví dụ
            </p>
          </div>
        ) : (
          /* BACK SIDE */
          <div className="flex-1 flex flex-col justify-between space-y-4 text-left">
            <div>
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-900">{currentWord.word}</span>
                  <span className="text-xs font-medium text-slate-500 font-mono">{currentWord.phonetic_us}</span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleAudio('us')}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Meaning */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 mb-3">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Nghĩa tiếng Việt ({currentWord.pos})</span>
                <p className="text-base font-semibold text-slate-900">{currentWord.meaning_vi}</p>
              </div>

              {/* Example */}
              {(currentWord.example_en || currentWord.example_vi) && (
                <div className="text-xs space-y-1 mb-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Ví dụ</span>
                  {currentWord.example_en && <p className="text-slate-800 italic">&quot;{currentWord.example_en}&quot;</p>}
                  {currentWord.example_vi && <p className="text-slate-500">→ {currentWord.example_vi}</p>}
                </div>
              )}

              {/* Notebook Notes */}
              {currentWord.notes && (
                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs text-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Ghi chú trong My Notebook</span>
                  <div className="whitespace-pre-line text-[11px] leading-relaxed text-slate-800">
                    {currentWord.notes}
                  </div>
                </div>
              )}
            </div>

            <span className="text-[11px] text-center text-slate-400 block pt-1">
              Đánh giá mức độ ghi nhớ của bạn đối với từ này:
            </span>
          </div>
        )}
      </div>

      {/* 3 Action Buttons for Grading: "Chưa nhớ", "Khó nhớ", "Đã nhớ" */}
      {isFlipped ? (
        <div className="grid grid-cols-3 gap-3 animate-in fade-in duration-200">
          <button
            onClick={() => handleGrade('again')}
            className="flex flex-col items-center p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-medium transition-colors"
          >
            <span className="text-xs font-bold">Chưa nhớ</span>
            <span className="text-[10px] text-rose-500 mt-0.5">Ôn lại ngay</span>
          </button>

          <button
            onClick={() => handleGrade('hard')}
            className="flex flex-col items-center p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-medium transition-colors"
          >
            <span className="text-xs font-bold">Khó nhớ</span>
            <span className="text-[10px] text-amber-600 mt-0.5">Ôn sau 1-2 ngày</span>
          </button>

          <button
            onClick={() => handleGrade('good')}
            className="flex flex-col items-center p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-medium transition-colors"
          >
            <span className="text-xs font-bold">Đã nhớ</span>
            <span className="text-[10px] text-emerald-600 mt-0.5">Ôn sau 4+ ngày</span>
          </button>
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            onClick={() => setIsFlipped(true)}
            className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
          >
            Lật xem đáp án
          </button>
        </div>
      )}

    </div>
  );
}
