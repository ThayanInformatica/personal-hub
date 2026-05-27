'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionLike = any;

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export type UseVoiceOpts = {
  lang?: string;
  continuous?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onEnd?: (finalTranscript: string) => void;
};

export function useVoice({ lang = 'pt-BR', continuous = false, onResult, onEnd }: UseVoiceOpts = {}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [interim, setInterim] = useState('');
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!Ctor);
  }, []);

  const start = useCallback(() => {
    if (typeof window === 'undefined') return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec: SpeechRecognitionLike = new Ctor();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = true;
    finalRef.current = '';

    rec.onresult = (ev: any) => {
      let interimText = '';
      let finalText = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const transcript = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText) {
        finalRef.current += finalText;
        onResult?.(finalText, true);
      }
      if (interimText) {
        setInterim(interimText);
        onResult?.(interimText, false);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      setInterim('');
      onEnd?.(finalRef.current.trim());
    };
    rec.onstart = () => setListening(true);

    try {
      rec.start();
      recRef.current = rec;
    } catch {
      setListening(false);
    }
  }, [lang, continuous, onResult, onEnd]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  return { listening, supported, interim, start, stop };
}

export function speak(text: string, lang = 'pt-BR') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 1.05;
  utter.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find((v) => v.lang.startsWith('pt')) ?? voices.find((v) => v.default);
  if (ptVoice) utter.voice = ptVoice;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
