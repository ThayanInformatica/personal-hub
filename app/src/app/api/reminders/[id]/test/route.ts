import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWhatsapp } from '@/lib/evolution';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reminder = await db.reminder.findUnique({ where: { id } });
  if (!reminder) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });

  const text = `🔔 ${reminder.title}\n\n${reminder.message}`;
  const result = await sendWhatsapp(text);

  await db.reminderLog.create({
    data: {
      reminderId: reminder.id,
      status: result.ok ? 'SUCCESS' : 'FAILED',
      error: result.error ?? null,
      payload: { test: true, text }
    }
  });

  return NextResponse.json(result);
}
