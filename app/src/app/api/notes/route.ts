import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await db.note.findMany({ orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }] }));
}

export async function POST(req: Request) {
  const data = await req.json();
  const item = await db.note.create({
    data: { title: data.title, body: data.body, tags: data.tags ?? [], pinned: data.pinned ?? false }
  });
  return NextResponse.json(item, { status: 201 });
}
