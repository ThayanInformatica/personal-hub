import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const items = await db.gameConfig.findMany({ orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const data = await req.json();
  const item = await db.gameConfig.create({
    data: { kind: data.kind, name: data.name, body: data.body, active: data.active ?? false }
  });
  return NextResponse.json(item, { status: 201 });
}
