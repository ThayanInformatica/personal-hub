import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const sessions = await db.chatSession.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { messages: true } } }
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const data = await req.json().catch(() => ({}));
  const session = await db.chatSession.create({
    data: { title: data.title ?? 'Nova conversa' }
  });
  return NextResponse.json(session, { status: 201 });
}
