import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await db.snippet.findMany({ orderBy: { updatedAt: 'desc' } }));
}

export async function POST(req: Request) {
  const data = await req.json();
  const item = await db.snippet.create({
    data: { title: data.title, language: data.language, body: data.body, tags: data.tags ?? [] }
  });
  return NextResponse.json(item, { status: 201 });
}
