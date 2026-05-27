import Link from 'next/link';
import { db } from '@/lib/db';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Crosshair, Vault, Pin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [reminders, favoriteCrosshair, pinnedNotes] = await Promise.all([
    db.reminder.findMany({
      where: { active: true },
      orderBy: { dueAt: 'asc' },
      take: 5
    }),
    db.crosshair.findFirst({ where: { favorite: true }, orderBy: { updatedAt: 'desc' } }),
    db.note.findMany({ where: { pinned: true }, orderBy: { updatedAt: 'desc' }, take: 4 })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumo do seu hub</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Proximos lembretes" icon={<Bell className="h-4 w-4" />} href="/reminders">
          {reminders.length === 0 ? (
            <Empty>Nenhum lembrete ativo</Empty>
          ) : (
            <ul className="space-y-2">
              {reminders.map((r) => (
                <li key={r.id} className="flex justify-between text-sm">
                  <span className="truncate">{r.title}</span>
                  <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                    {format(r.dueAt, "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Crosshair em uso" icon={<Crosshair className="h-4 w-4" />} href="/cs2">
          {favoriteCrosshair ? (
            <div>
              <p className="text-sm font-medium">{favoriteCrosshair.name}</p>
              <code className="mt-2 block break-all rounded bg-muted/40 p-2 text-xs">{favoriteCrosshair.code}</code>
            </div>
          ) : (
            <Empty>Nenhum favorito definido</Empty>
          )}
        </Card>

        <Card title="Atalhos" icon={<Vault className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-2">
            <Shortcut href="/cs2">CS2</Shortcut>
            <Shortcut href="/reminders">Lembretes</Shortcut>
            <Shortcut href="/vault">Cofre</Shortcut>
            <Shortcut href="/vault?tab=snippets">Snippets</Shortcut>
          </div>
        </Card>

        <Card title="Notas fixadas" icon={<Pin className="h-4 w-4" />} href="/vault?tab=notes" className="md:col-span-2">
          {pinnedNotes.length === 0 ? (
            <Empty>Nenhuma nota fixada</Empty>
          ) : (
            <ul className="space-y-2">
              {pinnedNotes.map((n) => (
                <li key={n.id} className="rounded-md border border-border/40 p-3">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  href,
  className,
  children
}: {
  title: string;
  icon?: React.ReactNode;
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const inner = (
    <div className={`rounded-xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-border ${className ?? ''}`}>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Shortcut({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md border border-border/40 px-3 py-2 text-center text-xs hover:bg-accent/40">
      {children}
    </Link>
  );
}
