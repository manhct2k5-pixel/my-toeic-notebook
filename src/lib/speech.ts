/**
 * Advanced Audio & Speech Engine for English Learning
 * 1. Prioritizes authentic human MP3 dictionary recordings (UK & US)
 * 2. High-quality Web Speech API fallback with natural voice selection (Microsoft Natural / Google / Apple)
 * 3. Playback speed adjustment (0.75x & 1.0x)
 * 4. Immediate cancellation of previous audio to prevent overlapping voices
 * 5. Strictly rejects non-English voices (never reads English with Vietnamese voice)
 */

let activeAudio: HTMLAudioElement | null = null;
const audioCache = new Map<string, { uk?: string; us?: string }>();

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopCurrentAudio(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // Ignore abort errors
    }
    activeAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

export interface PlayAudioOptions {
  text: string;
  accent?: 'uk' | 'us';
  directAudioUrl?: string;
  rate?: number; // 0.75 | 1.0
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
}

export async function playAudioOrSpeak(
  arg1: string | PlayAudioOptions,
  arg2?: 'uk' | 'us',
  arg3?: string,
  arg4?: number
): Promise<boolean> {
  stopCurrentAudio();

  let text: string;
  let accent: 'uk' | 'us' = 'us';
  let directAudioUrl: string | undefined;
  let rate: number = 1.0;
  let onStart: (() => void) | undefined;
  let onEnd: (() => void) | undefined;
  let onError: ((err?: unknown) => void) | undefined;

  if (typeof arg1 === 'object') {
    text = arg1.text;
    accent = arg1.accent || 'us';
    directAudioUrl = arg1.directAudioUrl;
    rate = arg1.rate ?? 1.0;
    onStart = arg1.onStart;
    onEnd = arg1.onEnd;
    onError = arg1.onError;
  } else {
    text = arg1;
    accent = arg2 || 'us';
    directAudioUrl = arg3;
    rate = arg4 ?? 1.0;
  }

  const cleanText = text.trim();
  if (!cleanText) return false;

  // 1. Try direct audio URL if provided
  let urlToPlay = directAudioUrl;

  // If no direct URL and text is a single word, check audio cache
  if (!urlToPlay && !cleanText.includes(' ')) {
    const cached = audioCache.get(cleanText.toLowerCase());
    if (cached) {
      urlToPlay = accent === 'uk' ? cached.uk : cached.us;
    }
  }

  if (urlToPlay) {
    try {
      const audio = new Audio(urlToPlay);
      audio.playbackRate = rate;
      activeAudio = audio;

      const played = await new Promise<boolean>((resolve) => {
        audio.onplay = () => {
          if (onStart) onStart();
        };

        audio.onended = () => {
          activeAudio = null;
          if (onEnd) onEnd();
          resolve(true);
        };

        audio.onerror = () => {
          activeAudio = null;
          // Fall back to Web Speech API
          resolve(false);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            activeAudio = null;
            resolve(false);
          });
        }
      });

      if (played) return true;
    } catch {
      // Fall through to browser speech
    }
  }

  // 2. Fall back to high-quality browser Speech Synthesis
  return speakWithBrowser(cleanText, accent, rate, onStart, onEnd, onError);
}

/**
 * Best voice selector prioritizing natural / premium browser voices
 */
function getBestEnglishVoice(accent: 'uk' | 'us'): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetPrefix = accent === 'uk' ? 'en-gb' : 'en-us';
  const targetTag = accent === 'uk' ? 'en-GB' : 'en-US';

  // Filter only English voices
  const englishVoices = voices.filter((v) => 
    v.lang.toLowerCase().startsWith('en')
  );

  if (englishVoices.length === 0) return null;

  // Filter matching accent
  const accentVoices = englishVoices.filter((v) =>
    v.lang.toLowerCase().startsWith(targetPrefix) || v.lang === targetTag
  );

  const candidatePool = accentVoices.length > 0 ? accentVoices : englishVoices;

  // Score candidate voices (highest quality first)
  const scored = candidatePool.map((v) => {
    let score = 0;
    const name = v.name.toLowerCase();

    // Natural / Neural online voices (Edge / Chrome / Windows / macOS)
    if (name.includes('natural') || name.includes('online')) score += 50;
    if (name.includes('google')) score += 40;
    if (name.includes('samantha') || name.includes('daniel') || name.includes('oliver') || name.includes('serena') || name.includes('kate')) score += 35;
    if (name.includes('premium') || name.includes('enhanced')) score += 30;

    // Correct accent bonus
    if (v.lang.toLowerCase().startsWith(targetPrefix)) score += 20;

    // Default system voice bonus
    if (v.default) score += 5;

    return { voice: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.voice || candidatePool[0] || null;
}

function speakWithBrowser(
  text: string,
  accent: 'uk' | 'us',
  rate: number,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err?: unknown) => void
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) {
      if (onError) onError('Speech synthesis not supported');
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
      
      // Speed adjustments: slightly adjusted for clarity
      utterance.rate = rate === 0.75 ? 0.75 : 0.9;
      utterance.pitch = 1.0;

      const bestVoice = getBestEnglishVoice(accent);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        if (onEnd) onEnd();
        resolve(true);
      };

      utterance.onerror = (e) => {
        if (onError) onError(e);
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      if (onError) onError(err);
      resolve(false);
    }
  });
}

/**
 * Cache audio URL dynamically for future plays
 */
export function cacheWordAudio(word: string, audioData: { uk?: string; us?: string }): void {
  const key = word.trim().toLowerCase();
  audioCache.set(key, {
    ...audioCache.get(key),
    ...audioData,
  });
}
