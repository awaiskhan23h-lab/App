import { useCallback, useEffect, useRef, useState } from 'react';

// Minimal typings for the Web Speech API, which TypeScript's DOM lib doesn't include.
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type RecognitionCtor = new () => Recognition;

const Ctor: RecognitionCtor | undefined =
  typeof window === 'undefined'
    ? undefined
    : ((window as unknown as Record<string, RecognitionCtor | undefined>).SpeechRecognition ??
      (window as unknown as Record<string, RecognitionCtor | undefined>).webkitSpeechRecognition);

export const canListen = Boolean(Ctor);
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Push-to-talk speech recognition. `start()` listens until `stop()` is called;
 * the final transcript is passed to `onDone`.
 */
export function useListener(onDone: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const rec = useRef<Recognition | null>(null);
  const finalText = useRef('');
  const done = useRef(onDone);
  done.current = onDone;

  const start = useCallback(() => {
    if (!Ctor) return;
    stopSpeaking();
    const r = new Ctor();
    r.lang = navigator.language || 'en-US';
    r.interimResults = true;
    r.continuous = true;
    finalText.current = '';
    r.onresult = (e) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText.current += res[0].transcript + ' ';
        else interimText += res[0].transcript;
      }
      setInterim((finalText.current + interimText).trim());
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed')
        setError('Microphone access was blocked. Allow it in your browser settings, or type instead.');
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setError('Couldn’t hear that. Try again or type instead.');
    };
    r.onend = () => {
      setListening(false);
      setInterim('');
      const text = finalText.current.trim();
      if (text) done.current(text);
    };
    rec.current = r;
    setError('');
    setListening(true);
    r.start();
  }, []);

  const stop = useCallback(() => rec.current?.stop(), []);

  useEffect(() => () => rec.current?.abort(), []);

  return { listening, interim, error, start, stop };
}

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function voice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined && cachedVoice !== null) return cachedVoice;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const lang = navigator.language || 'en-US';
  cachedVoice =
    voices.find((v) => v.lang === lang && /natural|premium|enhanced|google/i.test(v.name)) ??
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null;
  return cachedVoice;
}

export function speak(text: string, onEnd?: () => void) {
  if (!canSpeak) return onEnd?.();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = voice();
  if (v) u.voice = v;
  u.rate = 1.02;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel();
}
