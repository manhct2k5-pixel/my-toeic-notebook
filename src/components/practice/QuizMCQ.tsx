'use client';

import React, { useState, useMemo } from 'react';
import { Volume2, ArrowLeft, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { VocabularyItem } from '@/types';
import { playAudioOrSpeak } from '@/lib/speech';

interface QuizMCQProps {
  words: VocabularyItem[];
  allWords: VocabularyItem[];
  onFinish: (results: {
    total: number;
    correctCount: number;
    wrongWordIds: string[];
    history: { word: VocabularyItem; correct: boolean; userAnswer: string }[];
  }) => void;
  onExit: () => void;
}

export function QuizMCQ({ words, allWords, onFinish, onExit }: QuizMCQProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [wrongWordIds, setWrongWordIds] = useState<string[]>([]);
  const [history, setHistory] = useState<
    { word: VocabularyItem; correct: boolean; userAnswer: string }[]
  >([]);

  const currentWord = words[currentIndex];

  // Generate 4 options for current question
  const options = useMemo(() => {
    if (!currentWord) return [];

    const correctAnswer = currentWord.meaning_vi;
    // Pick other unique meanings as distractors
    const otherMeanings = allWords
      .filter((w) => w.id !== currentWord.id && w.meaning_vi && w.meaning_vi !== correctAnswer)
      .map((w) => w.meaning_vi);

    // Shuffle and pick 3
    const shuffledOthers = [...new Set(otherMeanings)].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // If not enough unique meanings, pad with generic fallbacks
    while (shuffledOthers.length < 3) {
      shuffledOthers.push(`Lựa chọn dự phòng ${shuffledOthers.length + 1}`);
    }

    const allOpts = [correctAnswer, ...shuffledOthers].sort(() => 0.5 - Math.random());
    return allOpts;
  }, [currentWord, allWords]);

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const isCorrect = opt === currentWord.meaning_vi;
    const newWrongIds = isCorrect ? wrongWordIds : [...wrongWordIds, currentWord.id];
    setWrongWordIds(newWrongIds);

    const newHistory = [
      ...history,
      { word: currentWord, correct: isCorrect, userAnswer: opt },
    ];
    setHistory(newHistory);
  };

  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
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

  const handleAudio = () => {
    if (!currentWord) return;
    playAudioOrSpeak(currentWord.word, 'us', currentWord.audio_us || currentWord.audio_uk);
  };

  if (!currentWord) return null;

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

      {/* Question Card */}
      <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 text-center">
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          {currentWord.pos}
        </span>

        <div className="flex items-center justify-center gap-3">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {currentWord.word}
          </h2>
          <button
            onClick={handleAudio}
            className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
            title="Nghe phát âm"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {currentWord.phonetic_us && (
          <p className="text-xs font-mono text-slate-400">{currentWord.phonetic_us}</p>
        )}

        <p className="text-xs text-slate-500 pt-2">
          Chọn nghĩa tiếng Việt chính xác nhất của từ vựng trên:
        </p>
      </div>

      {/* 4 Multiple Choice Options */}
      <div className="space-y-2.5">
        {options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx); // A, B, C, D
          const isSelected = selectedOption === opt;
          const isCorrect = opt === currentWord.meaning_vi;

          let btnStyle = 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50';
          if (isAnswered) {
            if (isCorrect) {
              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500';
            } else if (isSelected && !isCorrect) {
              btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold ring-1 ring-rose-500';
            } else {
              btnStyle = 'border-slate-200 bg-white text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelectOption(opt)}
              className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {letter}
                </span>
                <span>{opt}</span>
              </div>

              {isAnswered && (
                <div>
                  {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-600" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Explanation & Next Button */}
      {isAnswered && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
          <div className="text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block">
              {selectedOption === currentWord.meaning_vi ? '✓ Chính xác!' : '✗ Chưa chính xác!'}
            </span>
            <p>
              <strong>{currentWord.word}</strong>: {currentWord.meaning_vi}
            </p>
            {currentWord.example_en && (
              <p className="text-slate-500 italic mt-1">&quot;{currentWord.example_en}&quot;</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
            >
              <span>{currentIndex + 1 < words.length ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
