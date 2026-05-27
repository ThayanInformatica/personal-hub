'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Wrench, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useVoice, speak, stopSpeaking } from '@/lib/use-voice';

type ToolCall = { name: string; input: any; result: any };
type Msg = { id?: string; role: 'user' | 'assistant'; content: string; toolCalls?: ToolCall[] };

const STORAGE_KEY = 'hub.chat.sessionId';
const TTS_KEY = 'hub.chat.tts';

export function ChatPanel({ compact = false, voiceFirst = false }: { compact?: boolean; voiceFirst?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ttsOn, setTtsOn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { listening, supported: voiceSupported, interim, start, stop } = useVoice({
    onEnd: (finalText) => {
      if (finalText.trim()) sendText(finalText.trim());
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) loadSession(saved);
    setTtsOn(localStorage.getItem(TTS_KEY) === '1');
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, interim]);

  function toggleTts() {
    const next = !ttsOn;
    setTtsOn(next);
    localStorage.setItem(TTS_KEY, next ? '1' : '0');
    if (!next) stopSpeaking();
  }

  async function loadSession(id: string) {
    const res = await fetch(`/api/chat/sessions/${id}`);
    if (!res.ok) { localStorage.removeItem(STORAGE_KEY); return; }
    const data = await res.json();
    setSessionId(id);
    setMessages(data.messages.map((m: any) => ({
      id: m.id, role: m.role, content: m.content, toolCalls: m.toolCalls ?? undefined
    })));
  }

  async function sendText(text: string) {
    if (!text || sending) return;
    setInput('');
    const userMsg: Msg = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content: text })
      });
      const data = await res.json();
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem(STORAGE_KEY, data.sessionId);
      }
      setMessages((m) => [...m, { ...data.message }]);
      if (ttsOn && data.message?.content) speak(stripEmoji(data.message.content));
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Erro: ${(e as Error).message}` }]);
    } finally {
      setSending(false);
    }
  }

  async function newSession() {
    setSessionId(null);
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    stopSpeaking();
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText(input.trim());
    }
  }

  function toggleMic() {
    if (listening) stop();
    else { stopSpeaking(); start(); }
  }

  return (
    <div className={`flex h-full flex-col ${compact ? 'rounded-xl border border-border/60 bg-card' : ''}`} data-testid="chat-panel">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Bot className="h-4 w-4" /> Assistente IA
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTts}
            className={`rounded-md border border-border/40 p-1.5 ${ttsOn ? 'bg-foreground text-background' : 'hover:bg-accent/40'}`}
            title={ttsOn ? 'Desligar voz da IA' : 'Ligar voz da IA'}
            data-testid="tts-toggle"
          >
            {ttsOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
          <button onClick={newSession} className="rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-accent/40">
            Nova
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="rounded-md border border-dashed border-border/40 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{voiceFirst ? 'Toca no microfone e fala' : 'Como posso ajudar?'}</p>
            <p className="mt-2">Exemplos:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
              <li>"Cria uma mira verde pequena com ponto"</li>
              <li>"Lembrete pra pagar Netflix todo dia 10 às 9h"</li>
              <li>"Lista minhas miras"</li>
              <li>"Salva o link https://leetify.com no cofre"</li>
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={m.id ?? i} msg={m} />
        ))}
        {listening && interim && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-lg border border-dashed border-border/40 px-3 py-2 text-sm italic text-muted-foreground">
              {interim}...
            </div>
          </div>
        )}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> pensando...
          </div>
        )}
      </div>

      <div className="border-t border-border/60 p-3">
        {voiceFirst && voiceSupported ? (
          <div className="flex flex-col items-center gap-3">
            <button
              data-testid="chat-mic-big"
              onClick={toggleMic}
              className={`flex h-20 w-20 items-center justify-center rounded-full text-background shadow-lg transition-all ${
                listening ? 'animate-pulse bg-red-500 scale-110' : 'bg-foreground hover:scale-105'
              }`}
              aria-label={listening ? 'Parar gravação' : 'Falar'}
            >
              {listening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>
            <p className="text-xs text-muted-foreground">
              {listening ? 'Falando... toque para parar' : 'Toque e fale'}
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            {voiceSupported && (
              <button
                data-testid="chat-mic"
                onClick={toggleMic}
                disabled={sending}
                className={`self-end rounded-md p-2 ${listening ? 'animate-pulse bg-red-500 text-white' : 'border border-border/60 hover:bg-accent/40'} disabled:opacity-50`}
                title={listening ? 'Parar' : 'Falar'}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <textarea
              data-testid="chat-input"
              value={listening ? interim : input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Escreva ou toque no microfone..."
              rows={2}
              className="hub-input flex-1 resize-none"
              disabled={sending || listening}
            />
            <button
              data-testid="chat-send"
              onClick={() => sendText(input.trim())}
              disabled={sending || !input.trim()}
              className="self-end rounded-md bg-foreground p-2 text-background disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function stripEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/40">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className={`max-w-[80%] space-y-2 rounded-lg px-3 py-2 text-sm ${isUser ? 'bg-foreground text-background' : 'bg-card border border-border/60'}`}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="space-y-1 border-t border-border/40 pt-2">
            {msg.toolCalls.map((tc, idx) => (
              <div key={idx} className="flex items-start gap-1 text-xs text-muted-foreground">
                <Wrench className="mt-0.5 h-3 w-3" />
                <code className="break-all">
                  {tc.name}({JSON.stringify(tc.input).slice(0, 80)}{JSON.stringify(tc.input).length > 80 ? '...' : ''})
                </code>
              </div>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/40">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
