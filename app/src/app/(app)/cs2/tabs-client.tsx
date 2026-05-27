'use client';

import { useEffect, useState } from 'react';

type Tab = { id: string; label: string; content: React.ReactNode };

export function TabsClient({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState<string>(tabs[0]?.id ?? '');

  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    if (tabs.some((t) => t.id === h)) setActive(h);
  }, [tabs]);

  useEffect(() => {
    if (active) window.location.hash = active;
  }, [active]);

  const current = tabs.find((t) => t.id === active);

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--cs2-border))] to-transparent" />
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`cs2-tab ${active === t.id ? 'cs2-tab-active' : ''}`}
            >
              <span className="relative z-10">{t.label}</span>
              {active === t.id && (
                <span className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--cs2-amber))]/5 to-transparent" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div>{current?.content}</div>
    </div>
  );
}
