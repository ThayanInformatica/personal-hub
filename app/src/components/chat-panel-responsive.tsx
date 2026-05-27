'use client';

import { useEffect, useState } from 'react';
import { ChatPanel } from './chat-panel';

export function ChatPanelResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return <ChatPanel voiceFirst={isMobile} />;
}
