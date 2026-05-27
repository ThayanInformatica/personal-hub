import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PRESET_CATEGORIES } from '@/lib/finance';

export async function GET() {
  let cats = await db.financeCategory.findMany({ orderBy: { name: 'asc' } });
  if (cats.length === 0) {
    await db.$transaction(
      PRESET_CATEGORIES.map((c) =>
        db.financeCategory.create({
          data: { name: c.name, icon: c.icon, color: c.color, builtin: true }
        })
      )
    );
    cats = await db.financeCategory.findMany({ orderBy: { name: 'asc' } });
  }
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  const d = await req.json();
  if (!d.name) return NextResponse.json({ error: 'name obrigatorio' }, { status: 400 });
  try {
    const item = await db.financeCategory.create({
      data: {
        name: d.name,
        icon: d.icon ?? null,
        color: d.color ?? null,
        monthlyBudget: d.monthlyBudget != null ? Number(d.monthlyBudget) : null,
        builtin: false
      }
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'categoria ja existe' }, { status: 409 });
  }
}
