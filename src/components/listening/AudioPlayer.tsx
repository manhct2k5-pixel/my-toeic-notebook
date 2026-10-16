'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Gauge 
} from 'lucide-react';
import { isSpeechSupported } from '@/lib/speech';

interface AudioPlayerProps {
  audioUrl?: string;
  transcriptText: string;
  onTimeUpdate?: (time: number) => void;
}

export function AudioPlayer({ audioUrl, transcriptText }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [useSpeechFallback, setUseSpeechFallback] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if valid mp3 URL provided
    if (!audioUrl || !audioUrl.startsWith('http')) {
      setUseSpeechFallback(true);
      // Estimate duration based on word count (~150 words per minute)
      const words = transcriptText.split(/\s+/).length;
      const estimatedSeconds = Math.max(10, Math.round((words / 140) * 60));
      setDuration(estimatedSeconds);
    } else {
      setUseSpeechFallback(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    };
  }, [audioUrl, transcriptText]);

  // Audio element events
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (useSpeechFallback) {
      handleSpeechToggle();
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // Fall back to speech synthesis if audio failed to load
          setUseSpeechFallback(true);
          handleSpeechToggle();
        });
      }
    }
  };

  const handleSpeechToggle = () => {
    if (!isSpeechSupported()) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(transcriptText);
      utterance.lang = 'en-US';
      utterance.rate = playbackRate * 0.9;

      const voices = window.speechSynthesis.getVoices();
      const usVoice = voices.find((v) => v.lang === 'en-US' || v.lang.startsWith('en'));
      if (usVoice) utterance.voice = usVoice;

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);

      // Track time progress
      const startTime = Date.now() - (currentTime * 1000);
      speechIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= duration) {
          setCurrentTime(duration);
        } else {
          setCurrentTime(elapsed);
        }
      }, 500);
    }
  };

  const seekRelative = (seconds: number) => {
    if (!useSpeechFallback && audioRef.current) {
      const nextTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    } else {
      // In speech fallback, stop & seek
      const nextTime = Math.min(Math.max(0, currentTime + seconds), duration);
      setCurrentTime(nextTime);
    }
  };

  const changeSpeed = () => {
    const speeds = [0.75, 1.0, 1.25];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);

    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
    if (useSpeechFallback && isPlaying) {
      // Re-trigger speech with new speed
      handleSpeechToggle();
      setTimeout(handleSpeechToggle, 50);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
      {/* Real Audio Element if provided */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
          onError={() => setUseSpeechFallback(true)}
        />
      )}

      {/* Progress timeline */}
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => seekRelative(-5)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Tua lùi 5 giây"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
            title={isPlaying ? 'Tạm dừng' : 'Phát bài nghe'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => seekRelative(5)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Tua tới 5 giây"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed toggle & indicator */}
        <div className="flex items-center gap-2">
          {useSpeechFallback && (
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              Giọng đọc chuẩn
            </span>
          )}

          <button
            onClick={changeSpeed}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Tốc độ phát"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{playbackRate}x</span>
          </button>
        </div>
      </div>
    </div>
  );
}
