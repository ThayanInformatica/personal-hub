'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';
import { ChatPanel } from './chat-panel';

export function ChatFab() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/chat') return null;

  return (
    <>
      <button
        data-testid="chat-fab"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:scale-105 transition-transform"
        aria-label="Abrir assistente"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 p-4 md:p-6" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-7 top-7 rounded-md p-1 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <ChatPanel compact />
          </div>
        </div>
      )}
    </>
  );
}
