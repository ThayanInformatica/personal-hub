'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Crosshair, Bell, Vault, LogOut, Settings, Sparkles, Menu, X, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Assistente IA', icon: Sparkles },
  { href: '/financas', label: 'Finanças', icon: Wallet },
  { href: '/cs2', label: 'CS2', icon: Crosshair },
  { href: '/reminders', label: 'Lembretes', icon: Bell },
  { href: '/vault', label: 'Cofre', icon: Vault },
  { href: '/settings', label: 'Configurações', icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const nav = (
    <>
      <div className="mb-6 flex items-center justify-between px-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Personal Hub</h1>
          <p className="text-xs text-muted-foreground">Tudo num lugar só</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent/40 md:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={logout}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-card md:hidden"
        aria-label="Abrir menu"
        data-testid="menu-open"
      >
        <Menu className="h-4 w-4" />
      </button>

      <aside className="hidden w-60 shrink-0 flex-col border-r border-border/60 bg-card/40 p-4 md:flex">
        {nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden" onClick={() => setOpen(false)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-64 flex-col border-r border-border/60 bg-card p-4"
          >
            {nav}
          </aside>
          <div className="flex-1" />
        </div>
      )}
    </>
  );
}
