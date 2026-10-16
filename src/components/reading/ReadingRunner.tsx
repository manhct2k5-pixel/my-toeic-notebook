'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Sparkles, 
  BookOpen, 
  BookPlus 
} from 'lucide-react';
import { ReadingLesson, Topic, Unit, VocabularyItem } from '@/types';
import { 
  getReadingLessons, 
  getTopics, 
  getUnits, 
  saveLessonAttempt, 
  subscribeToStorage 
} from '@/lib/storage';
import { TextHighlighter } from '@/components/common/TextHighlighter';
import { SaveWordModal } from '@/components/common/SaveWordModal';

export function ReadingRunner() {
  const [lessons, setLessons] = useState<ReadingLesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter by Part: 0 (All) or 5, 6, 7
  const [selectedPart, setSelectedPart] = useState<number>(0);
  const [activeLesson, setActiveLesson] = useState<ReadingLesson | null>(null);

  // Lesson testing state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Save word modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState('');
  const [highlightedSentence, setHighlightedSentence] = useState('');
  const [saveToast, setSaveToast] = useState('');

  const loadData = async () => {
    try {
      const [l, t, u] = await Promise.all([
        getReadingLessons(),
        getTopics(),
        getUnits(),
      ]);
      setLessons(l);
      setTopics(t);
      setUnits(u);
      if (l.length > 0 && !activeLesson) {
        setActiveLesson(l[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToStorage(() => loadData());
    return () => unsubscribe();
  }, []);

  const filteredLessons = lessons.filter((l) =>
    selectedPart === 0 ? true : l.part === selectedPart
  );

  const handleSelectLesson = (lesson: ReadingLesson) => {
    setActiveLesson(lesson);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);
  };

  const handleSelectAnswer = (questionId: string, answerKey: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerKey,
    }));
  };

  const handleSubmit = async () => {
    if (!activeLesson || isSubmitted) return;

    let correctCount = 0;
    activeLesson.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_answer) {
        correctCount += 1;
      }
    });

    setScore(correctCount);
    setIsSubmitted(true);

    // Save attempt
    await saveLessonAttempt({
      lesson_id: activeLesson.id,
      lesson_type: 'reading',
      part: activeLesson.part,
      score: correctCount,
      total: activeLesson.questions.length,
      selected_answers: selectedAnswers,
    });
  };

  const handleTriggerWordSave = (word: string, sentence: string) => {
    setHighlightedWord(word);
    setHighlightedSentence(sentence);
    setSaveModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Đang tải các bài Reading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Toast notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Page Title & Part Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Luyện đọc TOEIC Reading</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Luyện Part 5, 6, 7 với giao diện đọc rõ ràng, giải thích tiếng Việt và lưu từ vựng trực tiếp vào sổ.
          </p>
        </div>

        {/* Part Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 0, label: 'Tất cả Part' },
            { id: 5, label: 'Part 5: Điền câu' },
            { id: 6, label: 'Part 6: Điền đoạn văn' },
            { id: 7, label: 'Part 7: Đọc hiểu' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedPart(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                selectedPart === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Lessons list / Right Active Reading Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Lessons list */}
        <div className="lg:col-span-1 space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Danh sách bài đọc ({filteredLessons.length})
          </h2>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredLessons.map((lesson) => {
              const isSelected = activeLesson?.id === lesson.id;
              return (
                <div
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Part {lesson.part}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {lesson.questions.length} câu hỏi
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                    {lesson.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {lesson.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Reading Lesson */}
        {activeLesson ? (
          <div className="lg:col-span-2 space-y-5">
            
            {/* Header info */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-blue-600">
                  TOEIC Reading Part {activeLesson.part}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {activeLesson.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{activeLesson.description}</p>
              </div>

              {isSubmitted && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Đúng {score} / {activeLesson.questions.length} câu
                  </span>
                </div>
              )}
            </div>

            {/* Reading Passage (For Part 6 and Part 7) with interactive text highlighter */}
            {activeLesson.passage && (
              <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Đoạn văn đọc hiểu
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-blue-600">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bôi đen bất kỳ từ nào để lưu vào Sổ</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs sm:text-sm text-slate-800 font-sans leading-relaxed">
                  <TextHighlighter
                    content={activeLesson.passage}
                    onSelectWordToSave={handleTriggerWordSave}
                  />
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {activeLesson.questions.map((q, qIdx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correct_answer;

                return (
                  <div
                    key={q.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        Câu {qIdx + 1}: {q.prompt}
                      </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const isSelected = userAns === opt.key;
                        let optStyle = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

                        if (isSubmitted) {
                          if (opt.key === q.correct_answer) {
                            optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                          } else if (isSelected && !isCorrect) {
                            optStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold ring-1 ring-rose-500';
                          } else {
                            optStyle = 'border-slate-200 bg-white text-slate-400 opacity-60';
                          }
                        } else if (isSelected) {
                          optStyle = 'border-blue-600 bg-blue-50 text-blue-900 font-semibold ring-1 ring-blue-600';
                        }

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleSelectAnswer(q.id, opt.key)}
                            className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${optStyle}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {opt.key}
                              </span>
                              <span>{opt.text}</span>
                            </div>

                            {isSubmitted && (
                              <div>
                                {opt.key === q.correct_answer && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                )}
                                {isSelected && !isCorrect && (
                                  <XCircle className="w-4 h-4 text-rose-600" />
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {isSubmitted && q.explanation_vi && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-slate-900 block">
                          Giải thích đáp án tiếng Việt:
                        </span>
                        <p className="leading-relaxed">{q.explanation_vi}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit Action */}
            {!isSubmitted ? (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={Object.keys(selectedAnswers).length === 0}
                  className="px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
                >
                  Nộp bài & Kiểm tra kết quả
                </button>
              </div>
            ) : null}

          </div>
        ) : (
          <div className="lg:col-span-2 p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
            Chọn một bài đọc từ danh sách bên trái để bắt đầu làm bài.
          </div>
        )}

      </div>

      {/* Save Word Modal */}
      <SaveWordModal
        isOpen={saveModalOpen}
        selectedText={highlightedWord}
        contextSentence={highlightedSentence}
        sourceLessonTitle={activeLesson?.title || 'TOEIC Reading'}
        sourceType="reading"
        topics={topics}
        units={units}
        onClose={() => setSaveModalOpen(false)}
        onSuccess={(saved) => {
          setSaveToast(`Đã lưu "${saved.word}" vào My Notebook!`);
          setTimeout(() => setSaveToast(''), 3000);
        }}
      />

    </div>
  );
}
