import { ChatPanelResponsive } from '@/components/chat-panel-responsive';

export const dynamic = 'force-dynamic';

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-3 md:h-[calc(100vh-3rem)]">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold">Assistente IA</h1>
        <p className="text-sm text-muted-foreground">Converse ou fale — peça pra criar miras, lembretes, links, snippets...</p>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl border border-border/60 bg-card/40">
        <ChatPanelResponsive />
      </div>
    </div>
  );
}
