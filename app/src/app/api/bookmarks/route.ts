import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await db.bookmark.findMany({ orderBy: [{ favorite: 'desc' }, { createdAt: 'desc' }] }));
}

export async function POST(req: Request) {
  const data = await req.json();
  const item = await db.bookmark.create({
    data: {
      title: data.title,
      url: data.url,
      description: data.description ?? null,
      tags: data.tags ?? [],
      favorite: data.favorite ?? false
    }
  });
  return NextResponse.json(item, { status: 201 });
}
