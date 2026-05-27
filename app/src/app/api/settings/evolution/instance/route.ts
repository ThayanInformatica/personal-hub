import { NextResponse } from 'next/server';
import { createInstance, deleteInstance } from '@/lib/evolution-admin';

export async function POST() {
  const r = await createInstance();
  return NextResponse.json(r.data, { status: r.ok ? 200 : r.status || 500 });
}

export async function DELETE() {
  const r = await deleteInstance();
  return NextResponse.json(r.data, { status: r.ok ? 200 : r.status || 500 });
}
