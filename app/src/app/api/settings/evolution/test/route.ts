import { NextResponse } from 'next/server';
import { sendWhatsapp } from '@/lib/evolution';

export async function POST() {
  const result = await sendWhatsapp('🧪 Teste do Personal Hub funcionando!');
  return NextResponse.json(result);
}
