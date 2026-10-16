'use client';

import React, { useState, useMemo } from 'react';
import { Volume2, ArrowLeft, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { VocabularyItem } from '@/types';
import { playAudioOrSpeak } from '@/lib/speech';

interface QuizMCQProps {
  words: VocabularyItem[];
  allWords: VocabularyItem[];
  mode?: 'multiple_choice' | 'vn_to_en';
  onFinish: (results: {
    total: number;
    correctCount: number;
    wrongWordIds: string[];
    history: { word: VocabularyItem; correct: boolean; userAnswer: string }[];
  }) => void;
  onExit: () => void;
}

export function QuizMCQ({ words, allWords, mode = 'multiple_choice', onFinish, onExit }: QuizMCQProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [wrongWordIds, setWrongWordIds] = useState<string[]>([]);
  const [history, setHistory] = useState<
    { word: VocabularyItem; correct: boolean; userAnswer: string }[]
  >([]);

  const currentWord = words[currentIndex];
  const isVnToEn = mode === 'vn_to_en';

  // Generate 4 options for current question
  const options = useMemo(() => {
    if (!currentWord) return [];

    if (isVnToEn) {
      // Prompt is Vietnamese -> Options are English words
      const correctAnswer = currentWord.word;
      const otherWords = allWords
        .filter((w) => w.id !== currentWord.id && w.word && w.word !== correctAnswer)
        .map((w) => w.word);

      const shuffledOthers = [...new Set(otherWords)].sort(() => 0.5 - Math.random()).slice(0, 3);
      while (shuffledOthers.length < 3) {
        shuffledOthers.push(`distractor_${shuffledOthers.length + 1}`);
      }
      return [correctAnswer, ...shuffledOthers].sort(() => 0.5 - Math.random());
    } else {
      // Prompt is English -> Options are Vietnamese meanings
      const correctAnswer = currentWord.meaning_vi;
      const otherMeanings = allWords
        .filter((w) => w.id !== currentWord.id && w.meaning_vi && w.meaning_vi !== correctAnswer)
        .map((w) => w.meaning_vi);

      const shuffledOthers = [...new Set(otherMeanings)].sort(() => 0.5 - Math.random()).slice(0, 3);
      while (shuffledOthers.length < 3) {
        shuffledOthers.push(`Lựa chọn dự phòng ${shuffledOthers.length + 1}`);
      }
      return [correctAnswer, ...shuffledOthers].sort(() => 0.5 - Math.random());
    }
  }, [currentWord, allWords, isVnToEn]);

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const isCorrect = isVnToEn
      ? opt.trim().toLowerCase() === currentWord.word.trim().toLowerCase()
      : opt === currentWord.meaning_vi;

    const newWrongIds = isCorrect ? wrongWordIds : [...wrongWordIds, currentWord.id];
    setWrongWordIds(newWrongIds);

    const newHistory = [
      ...history,
      { word: currentWord, correct: isCorrect, userAnswer: opt },
    ];
    setHistory(newHistory);

    // Play pronunciation of the word
    playAudioOrSpeak({
      text: currentWord.word,
      accent: 'us',
      directAudioUrl: currentWord.audio_us || currentWord.audio_uk,
      rate: audioSpeed,
    });
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

  const handleAudio = (accent: 'us' | 'uk' = 'us') => {
    if (!currentWord) return;
    const url = accent === 'uk' ? currentWord.audio_uk : currentWord.audio_us;
    playAudioOrSpeak({
      text: currentWord.word,
      accent,
      directAudioUrl: url,
      rate: audioSpeed,
    });
  };

  if (!currentWord) return null;

  const correctAnswer = isVnToEn ? currentWord.word : currentWord.meaning_vi;

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
        <div className="flex items-center justify-center gap-2">
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            {currentWord.pos}
          </span>
          <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 text-slate-600">
            {isVnToEn ? 'Việt → Anh' : 'Anh → Việt'}
          </span>
        </div>

        {isVnToEn ? (
          /* Vietnamese Prompt -> Find English word */
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {currentWord.meaning_vi}
            </h2>
            <p className="text-xs text-slate-500">
              Chọn từ vựng tiếng Anh tương ứng với nghĩa trên:
            </p>
          </div>
        ) : (
          /* English Prompt -> Find Vietnamese meaning */
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {currentWord.word}
              </h2>
              <button
                onClick={() => handleAudio('us')}
                className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                title="Nghe phát âm (US)"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2">
              {currentWord.phonetic_us && (
                <span className="text-xs font-mono text-slate-500">
                  {currentWord.phonetic_us}
                </span>
              )}
              <div className="flex items-center bg-slate-100 rounded p-0.5 text-[10px]">
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
            </div>

            <p className="text-xs text-slate-500 pt-1">
              Chọn nghĩa tiếng Việt chính xác nhất của từ vựng trên:
            </p>
          </div>
        )}
      </div>

      {/* 4 Multiple Choice Options */}
      <div className="space-y-2.5">
        {options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx); // A, B, C, D
          const isSelected = selectedOption === opt;
          const isOptionCorrect = isVnToEn
            ? opt.trim().toLowerCase() === currentWord.word.trim().toLowerCase()
            : opt === currentWord.meaning_vi;

          let btnStyle = 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50';
          if (isAnswered) {
            if (isOptionCorrect) {
              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500';
            } else if (isSelected && !isOptionCorrect) {
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
                <span className={isVnToEn ? 'font-semibold tracking-wide' : ''}>{opt}</span>
              </div>

              {isAnswered && (
                <div>
                  {isOptionCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {isSelected && !isOptionCorrect && <XCircle className="w-5 h-5 text-rose-600" />}
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
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 block">
                {selectedOption === correctAnswer ? '✓ Chính xác!' : '✗ Chưa chính xác!'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAudio('us')}
                  className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 font-medium"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Nghe US</span>
                </button>
                <button
                  onClick={() => handleAudio('uk')}
                  className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 font-medium"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Nghe UK</span>
                </button>
              </div>
            </div>

            <p className="pt-1">
              <strong className="text-blue-900 text-sm">{currentWord.word}</strong>{' '}
              <span className="text-slate-500 font-mono">({currentWord.pos}) {currentWord.phonetic_us}</span>
              {' : '}{currentWord.meaning_vi}
            </p>
            {currentWord.example_en && (
              <p className="text-slate-500 italic mt-1">&quot;{currentWord.example_en}&quot;</p>
            )}
          </div>

          <div className="flex justify-end pt-1">
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
