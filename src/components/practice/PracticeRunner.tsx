'use client';

import React, { useState, useEffect } from 'react';
import { 
  getVocabulary, 
  getTopics, 
  getUnits, 
  saveQuizAttempt, 
  subscribeToStorage 
} from '@/lib/storage';
import { VocabularyItem, Topic, Unit, QuizMode, QuizScope } from '@/types';
import { PracticeSetup } from './PracticeSetup';
import { FlashcardRunner } from './FlashcardRunner';
import { QuizMCQ } from './QuizMCQ';
import { QuizFill } from './QuizFill';
import { QuizListening } from './QuizListening';
import { QuizResult } from './QuizResult';

type PracticeStage = 'setup' | 'running' | 'result';

export function PracticeRunner() {
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [stage, setStage] = useState<PracticeStage>('setup');
  const [activeMode, setActiveMode] = useState<QuizMode>('flashcard');
  const [activeScope, setActiveScope] = useState<QuizScope>('all');
  const [activeScopeId, setActiveScopeId] = useState<string | undefined>();
  const [quizWords, setQuizWords] = useState<VocabularyItem[]>([]);

  // Results state
  const [quizResults, setQuizResults] = useState<{
    total: number;
    correctCount: number;
    wrongWordIds: string[];
    history: { word: VocabularyItem; correct: boolean; userAnswer?: string }[];
  } | null>(null);

  const loadData = async () => {
    try {
      const [v, t, u] = await Promise.all([getVocabulary(), getTopics(), getUnits()]);
      setWords(v);
      setTopics(t);
      setUnits(u);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToStorage(() => loadData());
    return () => unsubscribe();
  }, []);

  const handleStartPractice = (config: {
    mode: QuizMode;
    scope: QuizScope;
    scopeId?: string;
    questionCount: number;
    filteredWords: VocabularyItem[];
  }) => {
    setActiveMode(config.mode);
    setActiveScope(config.scope);
    setActiveScopeId(config.scopeId);
    setQuizWords(config.filteredWords);
    setStage('running');
  };

  const handleFinishPractice = async (results: {
    total: number;
    correctCount: number;
    wrongWordIds: string[];
    history: { word: VocabularyItem; correct: boolean; userAnswer?: string }[];
  }) => {
    setQuizResults(results);
    setStage('result');

    // Save attempt to database / local storage
    const scorePct = results.total > 0 ? (results.correctCount / results.total) * 100 : 0;
    await saveQuizAttempt({
      mode: activeMode,
      scope_type: activeScope,
      scope_id: activeScopeId,
      total_questions: results.total,
      correct_count: results.correctCount,
      score_percentage: Number(scorePct.toFixed(1)),
      wrong_word_ids: results.wrongWordIds,
    });
  };

  const handleRetryWrongOnly = () => {
    if (!quizResults || quizResults.wrongWordIds.length === 0) return;
    const wrongWordsList = words.filter((w) => quizResults.wrongWordIds.includes(w.id));
    if (wrongWordsList.length === 0) return;

    setQuizWords(wrongWordsList);
    setStage('running');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Đang chuẩn bị bài luyện tập...</span>
        </div>
      </div>
    );
  }

  if (stage === 'setup') {
    return (
      <PracticeSetup
        words={words}
        topics={topics}
        units={units}
        onStart={handleStartPractice}
      />
    );
  }

  if (stage === 'result' && quizResults) {
    return (
      <QuizResult
        total={quizResults.total}
        correctCount={quizResults.correctCount}
        wrongWordIds={quizResults.wrongWordIds}
        history={quizResults.history}
        onRetryWrongOnly={handleRetryWrongOnly}
        onNewQuiz={() => setStage('setup')}
      />
    );
  }

  // Running Stage
  if (activeMode === 'flashcard') {
    return (
      <FlashcardRunner
        words={quizWords}
        onFinish={handleFinishPractice}
        onExit={() => setStage('setup')}
      />
    );
  }

  if (activeMode === 'multiple_choice') {
    return (
      <QuizMCQ
        words={quizWords}
        allWords={words}
        onFinish={handleFinishPractice}
        onExit={() => setStage('setup')}
      />
    );
  }

  if (activeMode === 'fill_in') {
    return (
      <QuizFill
        words={quizWords}
        onFinish={handleFinishPractice}
        onExit={() => setStage('setup')}
      />
    );
  }

  if (activeMode === 'listening') {
    return (
      <QuizListening
        words={quizWords}
        onFinish={handleFinishPractice}
        onExit={() => setStage('setup')}
      />
    );
  }

  // Mixed mode: can use MCQ or Fill-in depending on question index
  return (
    <QuizMCQ
      words={quizWords}
      allWords={words}
      onFinish={handleFinishPractice}
      onExit={() => setStage('setup')}
    />
  );
}
