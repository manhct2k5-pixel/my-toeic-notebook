'use client';

import React, { useState } from 'react';
import { Volume2, ArrowLeft, ArrowRight, Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
import { VocabularyItem } from '@/types';
import { playAudioOrSpeak } from '@/lib/speech';

interface QuizFillProps {
  words: VocabularyItem[];
  onFinish: (results: {
    total: number;
    correctCount: number;
    wrongWordIds: string[];
    history: { word: VocabularyItem; correct: boolean; userAnswer: string }[];
  }) => void;
  onExit: () => void;
}

export function QuizFill({ words, onFinish, onExit }: QuizFillProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [wrongWordIds, setWrongWordIds] = useState<string[]>([]);
  const [history, setHistory] = useState<
    { word: VocabularyItem; correct: boolean; userAnswer: string }[]
  >([]);

  const currentWord = words[currentIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isSubmitted) return;

    setIsSubmitted(true);
    const cleanUser = inputVal.trim().toLowerCase();
    const cleanCorrect = currentWord.word.trim().toLowerCase();
    const isCorrect = cleanUser === cleanCorrect;

    const newWrongIds = isCorrect ? wrongWordIds : [...wrongWordIds, currentWord.id];
    setWrongWordIds(newWrongIds);

    setHistory([
      ...history,
      { word: currentWord, correct: isCorrect, userAnswer: inputVal.trim() },
    ]);

    // Play pronunciation
    playAudioOrSpeak(currentWord.word, 'us', currentWord.audio_us || currentWord.audio_uk);
  };

  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
      setInputVal('');
      setShowHint(false);
      setIsSubmitted(false);
    } else {
      const correctCount = history.filter((h) => h.correct).length;
      onFinish({
        total: words.length,
        correctCount,
        wrongWordIds,
        history,
      });
    }
  };

  if (!currentWord) return null;

  const cleanUser = inputVal.trim().toLowerCase();
  const cleanCorrect = currentWord.word.trim().toLowerCase();
  const isCorrect = cleanUser === cleanCorrect;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header */}
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
            Câu {currentIndex + 1} / {words.length}
          </span>
          <div className="w-24 sm:w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Prompt Card */}
      <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 text-center">
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          {currentWord.pos}
        </span>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {currentWord.meaning_vi}
        </h2>

        {/* Hint helper */}
        <div className="pt-2">
          {showHint ? (
            <div className="text-sm font-mono font-bold tracking-widest text-blue-700 bg-blue-50/70 px-4 py-2 rounded-lg inline-block border border-blue-200">
              {currentWord.word.charAt(0)}
              {currentWord.word.slice(1).replace(/[a-zA-Z]/g, ' _ ')}
              <span className="text-xs font-sans text-slate-500 ml-2">({currentWord.word.length} ký tự)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 mx-auto"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Xem gợi ý ký tự</span>
            </button>
          )}
        </div>
      </div>

      {/* Form Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Gõ từ vựng tiếng Anh:
          </label>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isSubmitted}
            placeholder="Nhập từ tiếng Anh..."
            className="w-full p-3.5 text-base sm:text-lg font-medium text-center rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            autoFocus
          />
        </div>

        {!isSubmitted ? (
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="w-full py-3 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
          >
            Kiểm tra đáp án
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5">
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm text-slate-900">
                  {isCorrect ? 'Tuyệt vời, chính xác!' : 'Chưa đúng rồi!'}
                </p>
                <p className="text-slate-700">
                  Đáp án chuẩn: <strong className="text-blue-700 text-sm font-mono">{currentWord.word}</strong>{' '}
                  <span className="font-mono text-slate-500">{currentWord.phonetic_us}</span>
                </p>
                {currentWord.example_en && (
                  <p className="text-slate-500 italic mt-1">&quot;{currentWord.example_en}&quot;</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
              >
                <span>{currentIndex + 1 < words.length ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </form>

    </div>
  );
}
