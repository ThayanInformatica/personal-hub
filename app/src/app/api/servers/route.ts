import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await db.gameServer.findMany({ orderBy: [{ favorite: 'desc' }, { updatedAt: 'desc' }] }));
}

export async function POST(req: Request) {
  const data = await req.json();
  const item = await db.gameServer.create({
    data: {
      name: data.name,
      address: data.address,
      kind: data.kind ?? 'community',
      password: data.password ?? null,
      notes: data.notes ?? null,
      tags: data.tags ?? [],
      favorite: data.favorite ?? false
    }
  });
  return NextResponse.json(item, { status: 201 });
}
