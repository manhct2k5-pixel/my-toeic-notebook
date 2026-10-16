'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Volume2, 
  ArrowLeft, 
  ArrowRight, 
  Lightbulb, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Headphones,
  Check
} from 'lucide-react';
import { VocabularyItem } from '@/types';
import { playAudioOrSpeak } from '@/lib/speech';

type MixedQuestionType = 'en_to_vi_mcq' | 'vn_to_en_mcq' | 'typing' | 'audio';

interface QuizMixedProps {
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

export function QuizMixed({ words, allWords, onFinish, onExit }: QuizMixedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedMCQ, setSelectedMCQ] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [accent, setAccent] = useState<'us' | 'uk'>('us');
  const [wrongWordIds, setWrongWordIds] = useState<string[]>([]);
  const [history, setHistory] = useState<
    { word: VocabularyItem; correct: boolean; userAnswer: string }[]
  >([]);

  // Assign question types deterministically or cyclically across questions
  const questionTypes = useMemo<MixedQuestionType[]>(() => {
    const types: MixedQuestionType[] = ['en_to_vi_mcq', 'vn_to_en_mcq', 'typing', 'audio'];
    return words.map((_, i) => types[i % types.length]);
  }, [words]);

  const currentWord = words[currentIndex];
  const currentType = questionTypes[currentIndex] || 'en_to_vi_mcq';

  // For audio question, auto-play sound on load
  useEffect(() => {
    if (currentType === 'audio' && currentWord && !isAnswered) {
      const timer = setTimeout(() => {
        handlePlayAudio(accent);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentType]);

  // Distractors for MCQ
  const mcqOptions = useMemo(() => {
    if (!currentWord) return [];

    if (currentType === 'en_to_vi_mcq') {
      const correctAnswer = currentWord.meaning_vi;
      const otherMeanings = allWords
        .filter((w) => w.id !== currentWord.id && w.meaning_vi && w.meaning_vi !== correctAnswer)
        .map((w) => w.meaning_vi);
      const shuffledOthers = [...new Set(otherMeanings)].sort(() => 0.5 - Math.random()).slice(0, 3);
      while (shuffledOthers.length < 3) shuffledOthers.push(`Lựa chọn ${shuffledOthers.length + 1}`);
      return [correctAnswer, ...shuffledOthers].sort(() => 0.5 - Math.random());
    } else if (currentType === 'vn_to_en_mcq') {
      const correctAnswer = currentWord.word;
      const otherWords = allWords
        .filter((w) => w.id !== currentWord.id && w.word && w.word !== correctAnswer)
        .map((w) => w.word);
      const shuffledOthers = [...new Set(otherWords)].sort(() => 0.5 - Math.random()).slice(0, 3);
      while (shuffledOthers.length < 3) shuffledOthers.push(`word_${shuffledOthers.length + 1}`);
      return [correctAnswer, ...shuffledOthers].sort(() => 0.5 - Math.random());
    }

    return [];
  }, [currentWord, allWords, currentType]);

  const handlePlayAudio = (acc: 'us' | 'uk' = 'us') => {
    if (!currentWord) return;
    const url = acc === 'uk' ? currentWord.audio_uk : currentWord.audio_us;
    playAudioOrSpeak({
      text: currentWord.word,
      accent: acc,
      directAudioUrl: url,
      rate: audioSpeed,
    });
  };

  // Handle MCQ selection
  const handleSelectMCQ = (option: string) => {
    if (isAnswered) return;
    setSelectedMCQ(option);
    setIsAnswered(true);

    const isCorrect = currentType === 'en_to_vi_mcq'
      ? option === currentWord.meaning_vi
      : option.trim().toLowerCase() === currentWord.word.trim().toLowerCase();

    handleRecordAnswer(isCorrect, option);
  };

  // Handle Typed submission (for typing and audio types)
  const handleSubmitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim() || isAnswered) return;

    setIsAnswered(true);
    const cleanUser = typedInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();
    const isCorrect = cleanUser === cleanTarget;

    handleRecordAnswer(isCorrect, typedInput.trim());
  };

  const handleRecordAnswer = (isCorrect: boolean, userAnswer: string) => {
    const newWrongIds = isCorrect ? wrongWordIds : [...wrongWordIds, currentWord.id];
    setWrongWordIds(newWrongIds);

    setHistory([
      ...history,
      { word: currentWord, correct: isCorrect, userAnswer },
    ]);

    // Always play correct audio on answer
    handlePlayAudio('us');
  };

  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsAnswered(false);
      setSelectedMCQ(null);
      setTypedInput('');
      setShowHint(false);
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

  const typeLabels: Record<MixedQuestionType, { title: string; badge: string; color: string }> = {
    en_to_vi_mcq: { title: 'Trắc nghiệm: Anh → Việt', badge: 'Dạng 1', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    vn_to_en_mcq: { title: 'Trắc nghiệm: Việt → Anh', badge: 'Dạng 2', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    typing: { title: 'Gõ từ tiếng Anh', badge: 'Dạng 3', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    audio: { title: 'Nghe phát âm & Gõ từ', badge: 'Dạng 4', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  const currentMeta = typeLabels[currentType];
  const lastHistoryItem = history[history.length - 1];
  const isCorrect = lastHistoryItem?.correct ?? false;

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

      {/* Question Type Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${currentMeta.color}`}>
            {currentMeta.badge}
          </span>
          <span className="text-xs font-semibold text-slate-700">{currentMeta.title}</span>
        </div>

        {/* Speed toggle */}
        <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200 text-[10px]">
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

      {/* 1. Dạng 1: MCQ English -> Vietnamese */}
      {currentType === 'en_to_vi_mcq' && (
        <div className="space-y-4">
          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {currentWord.pos}
            </span>
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {currentWord.word}
              </h2>
              <button
                type="button"
                onClick={() => handlePlayAudio('us')}
                className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            {currentWord.phonetic_us && (
              <p className="text-xs font-mono text-slate-400">{currentWord.phonetic_us}</p>
            )}
            <p className="text-xs text-slate-500">Chọn nghĩa tiếng Việt chính xác:</p>
          </div>

          <div className="space-y-2.5">
            {mcqOptions.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedMCQ === opt;
              const isOptCorrect = opt === currentWord.meaning_vi;

              let style = 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50';
              if (isAnswered) {
                if (isOptCorrect) style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                else if (isSelected && !isOptCorrect) style = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold ring-1 ring-rose-500';
                else style = 'border-slate-200 bg-white text-slate-400 opacity-60';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectMCQ(opt)}
                  className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {letter}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isAnswered && (
                    <div>
                      {isOptCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {isSelected && !isOptCorrect && <XCircle className="w-5 h-5 text-rose-600" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Dạng 2: MCQ Vietnamese -> English */}
      {currentType === 'vn_to_en_mcq' && (
        <div className="space-y-4">
          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {currentWord.pos}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {currentWord.meaning_vi}
            </h2>
            <p className="text-xs text-slate-500">Chọn từ vựng tiếng Anh tương ứng với nghĩa trên:</p>
          </div>

          <div className="space-y-2.5">
            {mcqOptions.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedMCQ === opt;
              const isOptCorrect = opt.trim().toLowerCase() === currentWord.word.trim().toLowerCase();

              let style = 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50';
              if (isAnswered) {
                if (isOptCorrect) style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                else if (isSelected && !isOptCorrect) style = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold ring-1 ring-rose-500';
                else style = 'border-slate-200 bg-white text-slate-400 opacity-60';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectMCQ(opt)}
                  className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {letter}
                    </span>
                    <span className="font-semibold tracking-wide">{opt}</span>
                  </div>
                  {isAnswered && (
                    <div>
                      {isOptCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {isSelected && !isOptCorrect && <XCircle className="w-5 h-5 text-rose-600" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Dạng 3: Typing English from Vietnamese */}
      {currentType === 'typing' && (
        <div className="space-y-4">
          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {currentWord.pos}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {currentWord.meaning_vi}
            </h2>

            {/* Hint helper */}
            <div className="pt-1">
              {showHint ? (
                <div className="text-xs font-mono font-bold tracking-widest text-blue-700 bg-blue-50/70 px-3 py-1.5 rounded-lg inline-block border border-blue-200">
                  {currentWord.word.charAt(0)}
                  {currentWord.word.slice(1).replace(/[a-zA-Z]/g, ' _ ')}
                  <span className="text-[10px] font-sans text-slate-500 ml-2">({currentWord.word.length} ký tự)</span>
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

          <form onSubmit={handleSubmitTyped} className="space-y-3">
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              disabled={isAnswered}
              placeholder="Gõ từ vựng tiếng Anh..."
              className="w-full p-3.5 text-base sm:text-lg font-medium text-center rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              autoFocus
            />
            {!isAnswered && (
              <button
                type="submit"
                disabled={!typedInput.trim()}
                className="w-full py-3 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
              >
                Kiểm tra câu trả lời
              </button>
            )}
          </form>
        </div>
      )}

      {/* 4. Dạng 4: Audio Quiz (Listen & Type) */}
      {currentType === 'audio' && (
        <div className="space-y-4">
          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Loại từ: {currentWord.pos}
            </span>

            {/* Big Audio Play Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => handlePlayAudio(accent)}
                className="w-18 h-18 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 shadow-md hover:scale-105 active:scale-95 transition-all"
                title="Nhấn để nghe lại phát âm"
              >
                <Volume2 className="w-8 h-8" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAccent('us');
                  handlePlayAudio('us');
                }}
                className={`px-2.5 py-1 rounded-md border font-medium ${
                  accent === 'us' ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Giọng US
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccent('uk');
                  handlePlayAudio('uk');
                }}
                className={`px-2.5 py-1 rounded-md border font-medium ${
                  accent === 'uk' ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Giọng UK
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Nghe phát âm và gõ chính xác từ vựng vào ô bên dưới:
            </p>
          </div>

          <form onSubmit={handleSubmitTyped} className="space-y-3">
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              disabled={isAnswered}
              placeholder="Gõ từ bạn nghe được..."
              className="w-full p-3.5 text-base sm:text-lg font-medium text-center rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              autoFocus
            />
            {!isAnswered && (
              <button
                type="submit"
                disabled={!typedInput.trim()}
                className="w-full py-3 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
              >
                Xác nhận câu trả lời
              </button>
            )}
          </form>
        </div>
      )}

      {/* Answer Explanation & Next Button (Common for all 4 types) */}
      {isAnswered && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-bold text-sm text-slate-900">
                {isCorrect ? 'Chính xác!' : 'Chưa chính xác!'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePlayAudio('us')}
                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" />
                <span>US</span>
              </button>
              <button
                type="button"
                onClick={() => handlePlayAudio('uk')}
                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" />
                <span>UK</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-700 space-y-1">
            <p>
              Từ vựng: <strong className="text-blue-900 text-sm font-mono">{currentWord.word}</strong>{' '}
              <span className="font-mono text-slate-500">({currentWord.pos}) {currentWord.phonetic_us}</span>
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
