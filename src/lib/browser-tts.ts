'use client';

/**
 * Browser-native SpeechSynthesis TTS fallback.
 * Used when ElevenLabs is unavailable.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakWithBrowserTTS(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    // Try to pick a nice voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith('en') && v.name.includes('Google')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };
    utterance.onerror = (e) => {
      currentUtterance = null;
      // 'interrupted' and 'canceled' are not real errors
      if (e.error === 'interrupted' || e.error === 'canceled') {
        resolve();
      } else {
        reject(e);
      }
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function stopBrowserTTS(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function isBrowserTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
