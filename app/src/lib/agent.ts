import Anthropic from '@anthropic-ai/sdk';
import { TOOLS, executeTool } from './agent-tools';

export type AgentMessage = { role: 'user' | 'assistant'; content: string; toolCalls?: any };

const SYSTEM = `Voce e o assistente pessoal do Personal Hub do usuario. Voce tem ACESSO COMPLETO ao app via ferramentas: pode criar, listar, atualizar, deletar QUALQUER coisa.

Areas que voce controla:
- CS2: miras (crosshairs), configs (autoexec/video/binds/viewmodel/launch), servidores favoritos, partidas/matches, watchlist de skins, alertas de preco, sincronizacao Steam/Leetify
- Lembretes: criar/pausar/deletar/editar, com envio automatico via WhatsApp
- Financas: assinaturas recorrentes, gastos avulsos, categorias com orcamento mensal, metas de economia, alertas de pagamento via WhatsApp
- Cofre: bookmarks (links), snippets de codigo, notas markdown
- Sistema: settings/templates, perfil Steam, status WhatsApp

Pra qualquer operacao de update/delete, use list_* primeiro pra obter o ID exato. Para relatorios gerais use global_dashboard. Para resumos financeiros use finance_summary. Para resumo de partidas use match_summary.

Quando o usuario pedir uma mira de um jogador profissional:
- Tente import_pro_crosshair({player: 'nome'}) direto primeiro. Ele busca no DB.
- Se der erro "nao encontrado no DB", chame sync_pro_crosshairs({slug: 'nome_lowercase'}) pra buscar do ProSettings via Exa, depois import_pro_crosshair de novo.
- Slug sempre lowercase sem espacos (karrigan, flamez, electronic, twistzz, blamef, hampton, etc).
- Pode fazer 2 tool calls em sequencia na mesma resposta (sync + import).

Quando o usuario descrever uma mira NOVA (ex: "verde, gap apertado, com outline"), use generate_crosshair_from_description (que tambem gera o share code Valve automaticamente). Use create_crosshair somente se o usuario fornecer um codigo CSGO-XXXXX especifico pra importar. Seja pragmatico:
- "menor"/"compacta" -> size 2 thickness 1
- "padrao"/"clean" -> size 2.5 thickness 1.0 gap -2
- "grande"/"visivel" -> size 4 thickness 1.5
- "amarela" -> 255,200,0  "verde" -> 0,255,0  "vermelha" -> 255,40,40  "ciano" -> 0,255,255  "branca" -> 255,255,255
- "donk", "static": style 4
- "T-style" ou "sem topo": tStyle true
- "com ponto" ou "dot": dot true
- "outline forte": outline 1.0
- Sempre que possivel passe os campos visuais (style, size, thickness, gap, red/green/blue, alpha 255).

Quando o usuario pedir lembrete:
- Converta linguagem natural pra ISO 8601 considerando fuso America/Sao_Paulo
- "todo dia X" -> cronExpr "0 9 X * *", recurring true
- "toda segunda" -> cronExpr "0 10 * * 1"
- "amanha as 14h" -> dueAt ISO calculado, recurring false

Pra perguntas sobre desempenho ("como ta minha HS%?", "quantos kills com AK?", "qual meu win rate?"), use steam_cs2_stats. Pra status do proprio usuario, steam_profile. Pra inventario/skins use steam_cs2_inventory. Se a Steam nao tiver conectada, oriente a ir em /cs2#steam e clicar em "Entrar com Steam".

Sempre confirme em PT-BR o que voce fez em uma ou duas frases curtas apos chamar as tools. Nao invente IDs, sempre use list_* antes de update_* ou delete_*.`;

export async function runAgent(
  history: AgentMessage[],
  userMessage: string
): Promise<{ assistantText: string; toolCalls: { name: string; input: any; result: any }[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return runStub(history, userMessage);
  }

  const client = new Anthropic({ apiKey });
  const messages: any[] = history.map((m) => ({ role: m.role, content: m.content }));
  messages.push({ role: 'user', content: userMessage });

  const collectedCalls: { name: string; input: any; result: any }[] = [];
  let finalText = '';

  for (let iter = 0; iter < 10; iter++) {
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: SYSTEM,
      tools: TOOLS as any,
      messages
    });

    messages.push({ role: 'assistant', content: resp.content });

    const toolUses = resp.content.filter((b: any) => b.type === 'tool_use') as any[];
    const texts = resp.content.filter((b: any) => b.type === 'text').map((b: any) => b.text);
    if (texts.length > 0) finalText = texts.join('\n');

    if (toolUses.length === 0 || resp.stop_reason !== 'tool_use') break;

    const toolResults: any[] = [];
    for (const t of toolUses) {
      try {
        const result = await executeTool(t.name, t.input);
        collectedCalls.push({ name: t.name, input: t.input, result });
        toolResults.push({ type: 'tool_result', tool_use_id: t.id, content: JSON.stringify(result) });
      } catch (e) {
        const err = (e as Error).message;
        collectedCalls.push({ name: t.name, input: t.input, result: { error: err } });
        toolResults.push({ type: 'tool_result', tool_use_id: t.id, content: `Erro: ${err}`, is_error: true });
      }
    }
    messages.push({ role: 'user', content: toolResults });
  }

  return { assistantText: finalText || 'Pronto.', toolCalls: collectedCalls };
}

async function runStub(
  _history: AgentMessage[],
  userMessage: string
): Promise<{ assistantText: string; toolCalls: { name: string; input: any; result: any }[] }> {
  const calls: { name: string; input: any; result: any }[] = [];
  const lower = userMessage.toLowerCase();

  if (/(cria|gera|faz).*mira/.test(lower)) {
    const params: any = { name: extractName(userMessage) || 'Mira IA', style: 4, size: 2.5, thickness: 1.0, gap: -2, alpha: 255, outline: 0.5 };
    if (/verde/.test(lower)) Object.assign(params, { red: 0, green: 255, blue: 0 });
    else if (/vermelh/.test(lower)) Object.assign(params, { red: 255, green: 40, blue: 40 });
    else if (/amarel/.test(lower)) Object.assign(params, { red: 255, green: 200, blue: 0 });
    else if (/ciano/.test(lower)) Object.assign(params, { red: 0, green: 255, blue: 255 });
    else if (/branc/.test(lower)) Object.assign(params, { red: 255, green: 255, blue: 255 });
    else Object.assign(params, { red: 0, green: 255, blue: 0 });
    if (/pequen|compact|menor/.test(lower)) { params.size = 2; params.thickness = 0.8; }
    if (/grande|maior/.test(lower)) { params.size = 4; params.thickness = 1.5; }
    if (/(t.?style|sem topo)/.test(lower)) params.tStyle = true;
    if (/(ponto|dot)/.test(lower)) params.dot = true;
    if (/outline forte|outline grosso/.test(lower)) params.outline = 1.2;
    const result = await executeTool('create_crosshair', params);
    calls.push({ name: 'create_crosshair', input: params, result });
    return { assistantText: `(modo stub) Criei a mira "${params.name}" com os params inferidos. Configure ANTHROPIC_API_KEY no .env pra usar o agente real.`, toolCalls: calls };
  }

  if (/(lembr|lembrete)/.test(lower) && /(cria|cadastra|adiciona)/.test(lower)) {
    const due = new Date(Date.now() + 60 * 60 * 1000);
    const params = {
      title: extractName(userMessage) || 'Lembrete IA',
      message: userMessage,
      dueAt: due.toISOString(),
      recurring: false
    };
    const result = await executeTool('create_reminder', params);
    calls.push({ name: 'create_reminder', input: params, result });
    return { assistantText: `(modo stub) Criei um lembrete para daqui 1 hora. Configure ANTHROPIC_API_KEY pra o agente real entender data/hora.`, toolCalls: calls };
  }

  if (/list.*mira|quais mira|minhas mira/.test(lower)) {
    const result = await executeTool('list_crosshairs', {});
    calls.push({ name: 'list_crosshairs', input: {}, result });
    const list = (result as any[]).map((c) => `- ${c.name}`).join('\n') || '(nenhuma)';
    return { assistantText: `(modo stub) Suas miras:\n${list}`, toolCalls: calls };
  }

  if (/list.*lembr|meus lembr/.test(lower)) {
    const result = await executeTool('list_reminders', {});
    calls.push({ name: 'list_reminders', input: {}, result });
    const list = (result as any[]).map((r) => `- ${r.title}`).join('\n') || '(nenhum)';
    return { assistantText: `(modo stub) Lembretes:\n${list}`, toolCalls: calls };
  }

  return {
    assistantText:
      '(modo stub) Sem ANTHROPIC_API_KEY no .env, eu so reconheco alguns comandos basicos:\n' +
      '- "cria uma mira verde pequena com ponto"\n' +
      '- "cria lembrete para pagar X"\n' +
      '- "lista minhas miras"\n' +
      '- "lista meus lembretes"\n\n' +
      'Configure a env var e me reinicie pra ter o agente Claude completo.',
    toolCalls: calls
  };
}

function extractName(text: string): string | null {
  const m = text.match(/["']([^"']+)["']/);
  if (m) return m[1];
  const m2 = text.match(/chamad[ao]\s+(.+?)(?:\s+(?:com|de|para)|$)/i);
  if (m2) return m2[1].trim();
  return null;
}
