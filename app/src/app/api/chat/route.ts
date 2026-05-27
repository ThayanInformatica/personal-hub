import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAgent, type AgentMessage } from '@/lib/agent';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { sessionId, content } = await req.json();
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'content obrigatorio' }, { status: 400 });
  }

  let session = sessionId
    ? await db.chatSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: 'asc' } } } })
    : null;
  if (!session) {
    session = await db.chatSession.create({
      data: { title: content.slice(0, 40) },
      include: { messages: true }
    });
  }

  const history: AgentMessage[] = session.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content
  }));

  await db.chatMessage.create({
    data: { sessionId: session.id, role: 'user', content }
  });

  const { assistantText, toolCalls } = await runAgent(history, content);

  const assistantMsg = await db.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      content: assistantText,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    }
  });

  await db.chatSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });

  return NextResponse.json({
    sessionId: session.id,
    message: {
      id: assistantMsg.id,
      role: 'assistant',
      content: assistantText,
      toolCalls
    }
  });
}
