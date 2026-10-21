'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  getVocabulary, 
  getTopics, 
  getUnits, 
  deleteWord, 
  deleteTopic, 
  deleteUnit, 
  subscribeToStorage 
} from '@/lib/storage';
import { VocabularyItem, Topic, Unit } from '@/types';
import { NotebookSidebar, NotebookViewType } from './NotebookSidebar';
import { WordList } from './WordList';
import { WordDetail } from './WordDetail';
import { WordModal } from './WordModal';
import { TopicModal } from './TopicModal';
import { UnitModal } from './UnitModal';
import { ImportModal } from './import/ImportModal';
import { ArrowLeft, BookOpen, Layers, Tag, Menu, Upload } from 'lucide-react';
import { useNotebook } from '@/lib/notebook-context';

export function NotebookView() {
  const { activeProfile } = useNotebook();
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view state
  const [viewType, setViewType] = useState<NotebookViewType>('all');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

  // Mobile navigation screen: 'categories' | 'list' | 'detail'
  const [mobileScreen, setMobileScreen] = useState<'categories' | 'list' | 'detail'>('list');

  // Modals state
  const [wordModalOpen, setWordModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyItem | null>(null);

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);

  // Load data function
  const loadData = async () => {
    try {
      const [v, t, u] = await Promise.all([getVocabulary(activeProfile), getTopics(), getUnits()]);
      setWords(v);
      setTopics(t);
      setUnits(u);

      // Check URL params for deep linked word
      let initialWordId = selectedWordId;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const paramWordId = urlParams.get('wordId');
        if (paramWordId && v.some((w) => w.id === paramWordId)) {
          initialWordId = paramWordId;
          setMobileScreen('detail');
        }
      }

      // Default select first word if none selected and on desktop
      if (!initialWordId && v.length > 0) {
        initialWordId = v[0].id;
      }
      setSelectedWordId(initialWordId);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToStorage(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [activeProfile]);

  // Filter words according to current active viewType
  const displayedWords = useMemo(() => {
    if (viewType === 'all') return words;
    if (viewType === 'unmemorized') return words.filter((w) => !w.is_memorized);
    if (viewType === 'needs_review') return words.filter((w) => w.needs_review);
    if (viewType === 'topic' && selectedCategoryKey) {
      return words.filter((w) => w.topic_ids.includes(selectedCategoryKey));
    }
    if (viewType === 'unit' && selectedCategoryKey) {
      return words.filter((w) => w.unit_ids.includes(selectedCategoryKey));
    }
    if (viewType === 'date' && selectedCategoryKey) {
      return words.filter((w) => w.study_date === selectedCategoryKey);
    }
    return words;
  }, [words, viewType, selectedCategoryKey]);

  // Selected word
  const activeWord = useMemo(() => {
    if (!selectedWordId) return displayedWords[0] || null;
    return words.find((w) => w.id === selectedWordId) || displayedWords[0] || null;
  }, [words, selectedWordId, displayedWords]);

  // View title
  const viewTitle = useMemo(() => {
    if (viewType === 'all') return 'Tất cả từ vựng';
    if (viewType === 'unmemorized') return 'Từ chưa nhớ';
    if (viewType === 'needs_review') return 'Từ cần ôn tập';
    if (viewType === 'topic') {
      const t = topics.find((item) => item.id === selectedCategoryKey);
      return t ? `Chủ đề: ${t.name}` : 'Chủ đề';
    }
    if (viewType === 'unit') {
      const u = units.find((item) => item.id === selectedCategoryKey);
      return u ? `Unit: ${u.title}` : 'Unit / Lesson';
    }
    if (viewType === 'date') {
      return `Ngày học: ${selectedCategoryKey}`;
    }
    return 'Sổ từ vựng';
  }, [viewType, selectedCategoryKey, topics, units]);

  // Handle switching view category
  const handleSelectView = (type: NotebookViewType, id?: string) => {
    setViewType(type);
    setSelectedCategoryKey(id || null);
    setMobileScreen('list');

    // Auto-select first word in this new view
    setTimeout(() => {
      const match = words.find((w) => {
        if (type === 'all') return true;
        if (type === 'unmemorized') return !w.is_memorized;
        if (type === 'needs_review') return w.needs_review;
        if (type === 'topic' && id) return w.topic_ids.includes(id);
        if (type === 'unit' && id) return w.unit_ids.includes(id);
        if (type === 'date' && id) return w.study_date === id;
        return true;
      });
      if (match) setSelectedWordId(match.id);
    }, 50);
  };

  // Handlers for word actions
  const handleSelectWord = (word: VocabularyItem) => {
    setSelectedWordId(word.id);
    setMobileScreen('detail');
  };

  const handleOpenAddWord = () => {
    setEditingWord(null);
    setWordModalOpen(true);
  };

  const handleEditWord = (word: VocabularyItem) => {
    setEditingWord(word);
    setWordModalOpen(true);
  };

  const handleDeleteWord = async (wordId: string) => {
    await deleteWord(wordId);
    if (selectedWordId === wordId) {
      setSelectedWordId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Đang tải Sổ tay từ vựng...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-61px)] overflow-hidden">
      
      {/* Mobile Top Navigation Breadcrumbs */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs">
        {mobileScreen === 'categories' && (
          <div className="flex items-center justify-between w-full">
            <span className="font-semibold text-slate-800">Danh mục Sổ từ vựng</span>
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Nhập file</span>
            </button>
          </div>
        )}

        {mobileScreen === 'list' && (
          <div className="flex items-center gap-2 w-full justify-between">
            <button
              onClick={() => setMobileScreen('categories')}
              className="flex items-center gap-1 text-blue-600 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Danh mục</span>
            </button>
            <span className="font-semibold text-slate-800 truncate max-w-[180px]">{viewTitle}</span>
          </div>
        )}

        {mobileScreen === 'detail' && (
          <div className="flex items-center gap-2 w-full justify-between">
            <button
              onClick={() => setMobileScreen('list')}
              className="flex items-center gap-1 text-blue-600 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Danh sách từ</span>
            </button>
            <span className="font-semibold text-slate-800 truncate max-w-[180px]">
              {activeWord?.word || 'Chi tiết'}
            </span>
          </div>
        )}
      </div>

      {/* 3-Column Layout on Desktop / Screen Switching on Mobile */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        
        {/* Column 1: Left Sidebar (Desktop: always visible / Mobile: visible when mobileScreen === 'categories') */}
        <div
          className={`w-full md:w-64 lg:w-72 shrink-0 h-full ${
            mobileScreen === 'categories' ? 'block' : 'hidden md:block'
          }`}
        >
          <NotebookSidebar
            currentViewType={viewType}
            selectedId={selectedCategoryKey}
            onSelectView={handleSelectView}
            topics={topics}
            units={units}
            words={words}
            onOpenNewTopic={() => {
              setEditingTopic(null);
              setTopicModalOpen(true);
            }}
            onEditTopic={(t) => {
              setEditingTopic(t);
              setTopicModalOpen(true);
            }}
            onDeleteTopic={deleteTopic}
            onOpenNewUnit={() => {
              setEditingUnit(null);
              setUnitModalOpen(true);
            }}
            onEditUnit={(u) => {
              setEditingUnit(u);
              setUnitModalOpen(true);
            }}
            onDeleteUnit={deleteUnit}
            onOpenImport={() => setImportModalOpen(true)}
          />
        </div>

        {/* Column 2: Middle Word List (Desktop: always visible / Mobile: visible when mobileScreen === 'list') */}
        <div
          className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${
            mobileScreen === 'list' ? 'block' : 'hidden md:block'
          }`}
        >
          <WordList
            words={displayedWords}
            topics={topics}
            units={units}
            selectedWordId={selectedWordId}
            onSelectWord={handleSelectWord}
            onOpenAddModal={handleOpenAddWord}
            onOpenImportModal={() => setImportModalOpen(true)}
            viewTitle={viewTitle}
          />
        </div>

        {/* Column 3: Right Word Detail (Desktop: always visible / Mobile: visible when mobileScreen === 'detail') */}
        <div
          className={`w-full flex-1 h-full ${
            mobileScreen === 'detail' ? 'block' : 'hidden md:block'
          }`}
        >
          <WordDetail
            word={activeWord}
            topics={topics}
            units={units}
            onEditFull={handleEditWord}
            onDelete={handleDeleteWord}
            onFilterByTopic={(tid) => handleSelectView('topic', tid)}
            onFilterByUnit={(uid) => handleSelectView('unit', uid)}
          />
        </div>

      </div>

      {/* Word Add / Edit Modal */}
      <WordModal
        isOpen={wordModalOpen}
        word={editingWord}
        topics={topics}
        units={units}
        initialTopicId={viewType === 'topic' && selectedCategoryKey ? selectedCategoryKey : undefined}
        initialUnitId={viewType === 'unit' && selectedCategoryKey ? selectedCategoryKey : undefined}
        initialDate={viewType === 'date' && selectedCategoryKey ? selectedCategoryKey : undefined}
        onClose={() => setWordModalOpen(false)}
        onSaved={(savedWord) => {
          setSelectedWordId(savedWord.id);
        }}
        onSelectExistingWord={(existing) => {
          setEditingWord(existing);
          setWordModalOpen(true);
        }}
      />

      {/* Topic Add / Edit Modal */}
      <TopicModal
        isOpen={topicModalOpen}
        topic={editingTopic}
        onClose={() => setTopicModalOpen(false)}
        onSaved={(savedTopic) => {
          handleSelectView('topic', savedTopic.id);
        }}
      />

      {/* Unit Add / Edit Modal */}
      <UnitModal
        isOpen={unitModalOpen}
        unit={editingUnit}
        onClose={() => setUnitModalOpen(false)}
        onSaved={(savedUnit) => {
          handleSelectView('unit', savedUnit.id);
        }}
      />

      {/* Vocabulary Import From File Modal */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        existingTopics={topics}
        existingUnits={units}
        existingVocabulary={words}
        onImportSuccess={() => {
          loadData();
        }}
      />

    </div>
  );
}
