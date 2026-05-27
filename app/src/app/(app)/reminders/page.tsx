import { db } from '@/lib/db';
import { RemindersClient } from './reminders-client';

export const dynamic = 'force-dynamic';

export default async function RemindersPage() {
  const reminders = await db.reminder.findMany({
    orderBy: [{ active: 'desc' }, { dueAt: 'asc' }],
    include: { logs: { orderBy: { sentAt: 'desc' }, take: 1 } }
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lembretes</h1>
        <p className="text-sm text-muted-foreground">Avisos via WhatsApp</p>
      </div>
      <RemindersClient
        items={reminders.map((r) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          dueAt: r.dueAt.toISOString(),
          cronExpr: r.cronExpr,
          leadMinutes: r.leadMinutes,
          recurring: r.recurring,
          active: r.active,
          lastSentAt: r.lastSentAt ? r.lastSentAt.toISOString() : null,
          lastLog: r.logs[0]
            ? { status: r.logs[0].status, error: r.logs[0].error, sentAt: r.logs[0].sentAt.toISOString() }
            : null
        }))}
      />
    </div>
  );
}
