'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, ArrowLeft, ArrowRight, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { VocabularyItem } from '@/types';
import { playAudioOrSpeak } from '@/lib/speech';

interface QuizListeningProps {
  words: VocabularyItem[];
  onFinish: (results: {
    total: number;
    correctCount: number;
    wrongWordIds: string[];
    history: { word: VocabularyItem; correct: boolean; userAnswer: string }[];
  }) => void;
  onExit: () => void;
}

export function QuizListening({ words, onFinish, onExit }: QuizListeningProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [accent, setAccent] = useState<'us' | 'uk'>('us');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [wrongWordIds, setWrongWordIds] = useState<string[]>([]);
  const [history, setHistory] = useState<
    { word: VocabularyItem; correct: boolean; userAnswer: string }[]
  >([]);

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (currentWord) {
      // Auto play audio once on word change
      const timer = setTimeout(() => {
        playAudio(accent);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentWord]);

  const playAudio = (acc: 'us' | 'uk') => {
    if (!currentWord) return;
    const url = acc === 'uk' ? currentWord.audio_uk : currentWord.audio_us;
    playAudioOrSpeak(currentWord.word, acc, url);
  };

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
  };

  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
      setInputVal('');
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

      {/* Listening Prompt Card */}
      <div className="p-8 sm:p-10 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5 text-center">
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          Loại từ: {currentWord.pos}
        </span>

        {/* Big Audio Play Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => playAudio(accent)}
            className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 shadow-md hover:scale-105 active:scale-95 transition-all"
            title="Nhấn để nghe lại phát âm"
          >
            <Volume2 className="w-8 h-8" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              setAccent('us');
              playAudio('us');
            }}
            className={`px-3 py-1 rounded-md border font-medium transition-colors ${
              accent === 'us'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Giọng Mỹ (US)
          </button>
          <button
            type="button"
            onClick={() => {
              setAccent('uk');
              playAudio('uk');
            }}
            className={`px-3 py-1 rounded-md border font-medium transition-colors ${
              accent === 'uk'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Giọng Anh (UK)
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Hãy lắng nghe kỹ và gõ chính xác từ vựng bạn nghe được vào ô bên dưới:
        </p>
      </div>

      {/* Typing Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isSubmitted}
          placeholder="Gõ từ bạn nghe được..."
          className="w-full p-3.5 text-base sm:text-lg font-medium text-center rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          autoFocus
        />

        {!isSubmitted ? (
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="w-full py-3 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
          >
            Xác nhận câu trả lời
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
                  {isCorrect ? 'Chính xác! Bạn nghe rất tốt.' : 'Chưa chính xác!'}
                </p>
                <p className="text-slate-700">
                  Từ cần nghe: <strong className="text-blue-700 text-sm font-mono">{currentWord.word}</strong>{' '}
                  <span className="font-mono text-slate-500">({currentWord.meaning_vi})</span>
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
