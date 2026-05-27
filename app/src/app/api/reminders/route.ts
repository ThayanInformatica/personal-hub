import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const items = await db.reminder.findMany({ orderBy: [{ active: 'desc' }, { dueAt: 'asc' }] });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const data = await req.json();
  const item = await db.reminder.create({
    data: {
      title: data.title,
      message: data.message,
      dueAt: new Date(data.dueAt),
      cronExpr: data.cronExpr ?? null,
      leadMinutes: data.leadMinutes ?? 0,
      recurring: data.recurring ?? false,
      active: data.active ?? true
    }
  });
  return NextResponse.json(item, { status: 201 });
}
