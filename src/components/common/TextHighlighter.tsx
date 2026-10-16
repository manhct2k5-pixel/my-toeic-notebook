'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BookPlus, Sparkles } from 'lucide-react';

interface TextHighlighterProps {
  content: string;
  className?: string;
  onSelectWordToSave: (word: string, contextSentence: string) => void;
}

export function TextHighlighter({
  content,
  className = '',
  onSelectWordToSave,
}: TextHighlighterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedWord, setSelectedWord] = useState('');
  const [selectedSentence, setSelectedSentence] = useState('');

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current) {
        setTooltipPos(null);
        return;
      }

      const text = selection.toString().trim();
      if (!text || text.length > 50) {
        setTooltipPos(null);
        return;
      }

      // Check if selection is inside this container
      if (!containerRef.current.contains(selection.anchorNode)) {
        setTooltipPos(null);
        return;
      }

      // Calculate context sentence
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // Find full sentence around selection
      const fullText = containerRef.current.innerText || content;
      const wordIndex = fullText.indexOf(text);
      let contextSentence = text;

      if (wordIndex >= 0) {
        const sentenceStart = Math.max(0, fullText.lastIndexOf('.', wordIndex) + 1);
        let sentenceEnd = fullText.indexOf('.', wordIndex + text.length);
        if (sentenceEnd === -1) sentenceEnd = fullText.length;
        contextSentence = fullText.substring(sentenceStart, sentenceEnd + 1).trim();
      }

      setSelectedWord(text);
      setSelectedSentence(contextSentence);

      // Position tooltip relative to container
      setTooltipPos({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 38,
      });
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [content]);

  const handleTriggerSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedWord) {
      onSelectWordToSave(selectedWord, selectedSentence);
      setTooltipPos(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  return (
    <div ref={containerRef} className={`relative select-text ${className}`}>
      {/* Floating Save Word Tooltip */}
      {tooltipPos && (
        <div
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          className="absolute -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            onClick={handleTriggerSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-blue-600 rounded-lg text-xs font-semibold shadow-xl border border-slate-700 whitespace-nowrap transition-colors"
          >
            <BookPlus className="w-3.5 h-3.5 text-blue-400" />
            <span>Lưu &quot;{selectedWord}&quot; vào Sổ</span>
          </button>
        </div>
      )}

      {/* Actual rendered text */}
      <div className="whitespace-pre-line leading-relaxed">{content}</div>
    </div>
  );
}
