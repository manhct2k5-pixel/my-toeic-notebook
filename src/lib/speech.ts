/**
 * Speech synthesis helper supporting UK ('en-GB') and US ('en-US') pronunciation.
 * Gracefully handles browsers without speech synthesis or missing voices.
 */

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function playAudioOrSpeak(
  text: string,
  accent: 'uk' | 'us' = 'us',
  directAudioUrl?: string
): Promise<boolean> {
  return new Promise((resolve) => {
    // 1. Try direct audio URL if provided
    if (directAudioUrl) {
      try {
        const audio = new Audio(directAudioUrl);
        audio.onended = () => resolve(true);
        audio.onerror = () => {
          // Fall back to Web Speech Synthesis
          speakWithBrowser(text, accent).then(resolve);
        };
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            speakWithBrowser(text, accent).then(resolve);
          });
        }
        return;
      } catch {
        // Fall back to browser speech
      }
    }

    // 2. Speak with browser
    speakWithBrowser(text, accent).then(resolve);
  });
}

function speakWithBrowser(text: string, accent: 'uk' | 'us'): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) {
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterance

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
      utterance.rate = 0.9; // Slightly slower for clear English learning
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const targetLang = accent === 'uk' ? 'en-GB' : 'en-US';
        const matchedVoice = voices.find((v) => v.lang === targetLang || v.lang.startsWith(accent === 'uk' ? 'en-GB' : 'en-US'));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve(false);
    }
  });
}
