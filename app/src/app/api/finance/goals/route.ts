import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await db.savingGoal.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] }));
}

export async function POST(req: Request) {
  const d = await req.json();
  if (!d.name || d.target == null) return NextResponse.json({ error: 'name e target obrigatorios' }, { status: 400 });
  const item = await db.savingGoal.create({
    data: {
      name: d.name,
      target: Number(d.target),
      current: Number(d.current ?? 0),
      deadline: d.deadline ? new Date(d.deadline) : null,
      notes: d.notes ?? null,
      active: d.active ?? true
    }
  });
  return NextResponse.json(item, { status: 201 });
}
