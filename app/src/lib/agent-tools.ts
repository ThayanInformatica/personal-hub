import { db } from '@/lib/db';
import { decodeShareCode, encodeShareCode, DEFAULT_PARAMS, type CrosshairParams } from '@/lib/crosshair';
import { PRO_CROSSHAIRS, findProByName } from '@/lib/pro-crosshairs';
import { WEAPONS } from '@/lib/cs2-weapons';
import { MAPS, findMap } from '@/lib/cs2-callouts';
import { getSavedSteamId, getProfile, getCS2Stats, getRecentlyPlayed, getCS2Inventory } from '@/lib/steam';

export type Tool = {
  name: string;
  description: string;
  input_schema: any;
};

export const TOOLS: Tool[] = [
  {
    name: 'list_crosshairs',
    description: 'Lista todas as miras de CS2 cadastradas',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_crosshair',
    description: 'Cria uma nova mira de CS2. Se receber um shareCode no formato CSGO-XXXXX-..., tenta decodificar para preencher campos visuais. Sempre que o usuario descrever uma mira (cor, tamanho, estilo), preencha os campos visuais explicitos.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome da mira' },
        code: { type: 'string', description: 'Codigo Valve CSGO-XXXXX-...; se nao tiver, gere um placeholder como "CUSTOM-<nome>"' },
        notes: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        favorite: { type: 'boolean' },
        style: { type: 'number', description: 'Estilo do crosshair 0-5; 4 e o classic static' },
        size: { type: 'number', description: 'Tamanho 0-10, padrao 2.5' },
        thickness: { type: 'number', description: 'Espessura 0.1-5, padrao 1.0' },
        gap: { type: 'number', description: 'Gap entre bracos -10 a 10, padrao -2' },
        red: { type: 'number', description: '0-255' },
        green: { type: 'number', description: '0-255' },
        blue: { type: 'number', description: '0-255' },
        alpha: { type: 'number', description: '0-255, padrao 255' },
        dot: { type: 'boolean', description: 'Ponto central' },
        tStyle: { type: 'boolean', description: 'Estilo T (sem braco superior)' },
        outline: { type: 'number', description: 'Espessura do outline 0-3' }
      },
      required: ['name']
    }
  },
  {
    name: 'update_crosshair',
    description: 'Atualiza uma mira existente',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        favorite: { type: 'boolean' },
        size: { type: 'number' },
        thickness: { type: 'number' },
        gap: { type: 'number' },
        red: { type: 'number' },
        green: { type: 'number' },
        blue: { type: 'number' },
        dot: { type: 'boolean' },
        tStyle: { type: 'boolean' },
        outline: { type: 'number' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_crosshair',
    description: 'Remove uma mira pelo id',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'list_reminders',
    description: 'Lista lembretes (proximos a vencer primeiro)',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_reminder',
    description: 'Cria um lembrete. Para recorrencia, use cronExpr (formato 5 campos: min hora dia mes dia-semana). Ex: "0 9 5 * *" = todo dia 5 as 9h. dueAt deve ser ISO 8601.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
        dueAt: { type: 'string', description: 'ISO 8601 datetime' },
        cronExpr: { type: 'string', description: 'Opcional. Cron 5 campos.' },
        recurring: { type: 'boolean' },
        leadMinutes: { type: 'number' }
      },
      required: ['title', 'message', 'dueAt']
    }
  },
  {
    name: 'update_reminder',
    description: 'Atualiza ou pausa lembrete',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        active: { type: 'boolean' },
        title: { type: 'string' },
        message: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_reminder',
    description: 'Remove lembrete',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'list_bookmarks',
    description: 'Lista bookmarks',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_bookmark',
    description: 'Salva um link',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        url: { type: 'string' },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['title', 'url']
    }
  },
  {
    name: 'create_snippet',
    description: 'Cria um snippet de codigo/comando',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        language: { type: 'string', description: 'sh, sql, ts, etc' },
        body: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['title', 'language', 'body']
    }
  },
  {
    name: 'create_note',
    description: 'Cria uma nota markdown',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        pinned: { type: 'boolean' }
      },
      required: ['title', 'body']
    }
  },
  {
    name: 'list_configs_cs2',
    description: 'Lista configs CS2 salvas (autoexec, video, etc)',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'get_whatsapp_status',
    description: 'Verifica se o WhatsApp esta conectado e mostra a configuracao',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'list_pro_crosshairs',
    description: 'Lista as miras de jogadores profissionais disponiveis pra importar (donk, ZywOo, s1mple, m0NESY, NiKo, sh1ro, b1t, ropz, broky, jL)',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'import_pro_crosshair',
    description: 'Importa a mira de um jogador profissional para a colecao do usuario. Use o nome do player (ex: donk, ZywOo).',
    input_schema: {
      type: 'object',
      properties: { player: { type: 'string', description: 'Nome do jogador' } },
      required: ['player']
    }
  },
  {
    name: 'generate_crosshair_from_description',
    description: 'Gera uma mira CS2 nova baseada em descricao do usuario. Define os params visuais (color RGB, size, thickness, gap, style, etc) e gera o share code Valve automaticamente. Salva no banco.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        style: { type: 'number', description: '0-5, default 2 (Classic)' },
        size: { type: 'number', description: '0.5-10, default 2.5' },
        thickness: { type: 'number', description: '0.5-5, default 1.0' },
        gap: { type: 'number', description: '-10 a 10, default -2' },
        red: { type: 'number', description: '0-255' },
        green: { type: 'number', description: '0-255' },
        blue: { type: 'number', description: '0-255' },
        alpha: { type: 'number', description: '0-255, default 255' },
        dot: { type: 'boolean' },
        tStyle: { type: 'boolean' },
        outline: { type: 'number', description: '0-3, default 0' },
        notes: { type: 'string' }
      },
      required: ['name']
    }
  },
  {
    name: 'list_game_servers',
    description: 'Lista servidores de CS2 salvos (DM, retake, surf, KZ, community)',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'generate_buy_binds',
    description: 'Gera um cfg de buy binds com as armas atribuidas a cada tecla. Use ids de armas validos (ak47, m4a4, awp, deagle, vesthelm, smoke, flash, molotov, incgrenade, he, p250, etc). Salva em Configs como kind BINDS.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome do bind set' },
        binds: {
          type: 'object',
          description: 'Mapa de tecla -> lista de ids de arma. Ex: { "kp_9": ["ak47", "m4a4"], "kp_1": ["smoke"] }',
          additionalProperties: { type: 'array', items: { type: 'string' } }
        }
      },
      required: ['binds']
    }
  },
  {
    name: 'steam_profile',
    description: 'Pega o perfil Steam do usuario (nome, avatar, status online, jogo atual). Requer Steam conectada via /cs2#steam.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'steam_cs2_stats',
    description: 'Pega stats vitalicios do CS2 do usuario (K/D, HS%, win rate, accuracy, kills por arma, stats por mapa). Use isso pra responder perguntas sobre desempenho.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'steam_cs2_inventory',
    description: 'Pega o inventario CS2 do usuario (skins, knives, gloves, stickers) JUNTO com precos atuais do Skinport em BRL e valor total. Use isso pra "qual valor do meu inventario?", "qual minha skin mais cara?", "vale a pena vender?"',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'refresh_skin_prices',
    description: 'Forca atualizacao dos precos Steam Market agora pro inventario inteiro. Use quando o usuario quer dados frescos do mercado.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'add_to_watchlist',
    description: 'Adiciona uma skin a watchlist do usuario pra monitorar preco. Use o market_hash_name em ingles (ex: "AK-47 | Redline (Field-Tested)").',
    input_schema: {
      type: 'object',
      properties: {
        marketHashName: { type: 'string' },
        displayName: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['marketHashName']
    }
  },
  {
    name: 'list_watchlist',
    description: 'Lista skins na watchlist com preco atual e alertas configurados',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'remove_from_watchlist',
    description: 'Remove uma skin da watchlist pelo market_hash_name',
    input_schema: {
      type: 'object',
      properties: { marketHashName: { type: 'string' } },
      required: ['marketHashName']
    }
  },
  {
    name: 'create_price_alert',
    description: 'Cria alerta de preco que dispara WhatsApp quando atingir. Kinds: "below" (caiu para <= X reais), "above" (subiu para >= X), "drop_pct" (caiu X% em N dias), "rise_pct" (subiu X% em N dias).',
    input_schema: {
      type: 'object',
      properties: {
        marketHashName: { type: 'string' },
        kind: { type: 'string', enum: ['below', 'above', 'drop_pct', 'rise_pct'] },
        threshold: { type: 'number' },
        windowDays: { type: 'number', description: 'Pra drop_pct/rise_pct, padrao 7' }
      },
      required: ['marketHashName', 'kind', 'threshold']
    }
  },
  {
    name: 'list_price_alerts',
    description: 'Lista alertas de preco ativos',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'compare_skin_prices',
    description: 'Compara preco de uma skin em Steam Market, CSFloat e Skinport (em BRL). Forca atualizacao se dados estiverem velhos.',
    input_schema: {
      type: 'object',
      properties: { marketHashName: { type: 'string' } },
      required: ['marketHashName']
    }
  },
  {
    name: 'get_skin_price_history',
    description: 'Retorna historico de preco de uma skin (snapshots dos ultimos N dias)',
    input_schema: {
      type: 'object',
      properties: {
        marketHashName: { type: 'string' },
        days: { type: 'number', description: 'Padrao 90' }
      },
      required: ['marketHashName']
    }
  },
  {
    name: 'steam_recent_games',
    description: 'Lista jogos jogados pelo usuario nas ultimas 2 semanas com playtime',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_subscription',
    description: 'Cadastra assinatura/conta recorrente (Netflix, luz, internet, cartao). Default billingCycle: monthly, alertEnabled: true, alertDaysBefore: 3.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: { type: 'string', description: 'Moradia, Utilidades, Streaming, Alimentacao, Transporte, Saude, Entretenimento, Educacao, Financeiro, Compras, Trabalho, Pets, Familia, Presentes, Viagem, Outros' },
        amount: { type: 'number' },
        billingCycle: { type: 'string', enum: ['monthly', 'yearly', 'weekly', 'quarterly', 'biannual'] },
        dueDay: { type: 'number' },
        paymentMethod: { type: 'string' },
        alertEnabled: { type: 'boolean' },
        alertDaysBefore: { type: 'number' },
        reminderText: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['name', 'amount']
    }
  },
  {
    name: 'list_subscriptions',
    description: 'Lista assinaturas',
    input_schema: { type: 'object', properties: { activeOnly: { type: 'boolean' } } }
  },
  {
    name: 'update_subscription',
    description: 'Pausar/ativar/editar assinatura',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        active: { type: 'boolean' },
        alertEnabled: { type: 'boolean' },
        amount: { type: 'number' },
        alertDaysBefore: { type: 'number' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_subscription',
    description: 'Remove assinatura',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'create_expense',
    description: 'Registra gasto avulso (mercado, gasolina, etc)',
    input_schema: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        category: { type: 'string' },
        amount: { type: 'number' },
        paidAt: { type: 'string' },
        paymentMethod: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['description', 'amount']
    }
  },
  {
    name: 'finance_summary',
    description: 'Resumo financeiro do mes: total, recorrentes, top, por categoria, vencimentos proximos, metas',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_saving_goal',
    description: 'Cria meta de economia',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        target: { type: 'number' },
        current: { type: 'number' },
        deadline: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['name', 'target']
    }
  },
  {
    name: 'add_to_saving_goal',
    description: 'Adiciona valor a meta (depositou X)',
    input_schema: {
      type: 'object',
      properties: { goalId: { type: 'string' }, amount: { type: 'number' } },
      required: ['goalId', 'amount']
    }
  },
  {
    name: 'list_saving_goals',
    description: 'Lista metas com progresso',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_match',
    description: 'Registra uma partida CS2 jogada pelo usuario. Quando ele descrever em PT-BR (ex: "perdi 13x16 mirage AWP 22-18-4 MVP 3"), extraia os campos. result: win/loss/tie. side: CT/T/both. Default mode: premier. playedAt em ISO 8601, se omitido use agora.',
    input_schema: {
      type: 'object',
      properties: {
        map: { type: 'string', description: 'mirage, inferno, dust2, nuke, anubis, ancient, train, overpass, vertigo' },
        mode: { type: 'string' },
        side: { type: 'string', enum: ['CT', 'T', 'both'] },
        scoreYou: { type: 'number' },
        scoreEnemy: { type: 'number' },
        kills: { type: 'number' },
        deaths: { type: 'number' },
        assists: { type: 'number' },
        mvps: { type: 'number' },
        adr: { type: 'number' },
        hsPercent: { type: 'number' },
        rankBefore: { type: 'number' },
        rankAfter: { type: 'number' },
        playedAt: { type: 'string', description: 'ISO 8601, padrao agora' },
        notes: { type: 'string' }
      },
      required: ['map']
    }
  },
  {
    name: 'list_matches',
    description: 'Lista partidas registradas. Opcionalmente filtra por mapa.',
    input_schema: {
      type: 'object',
      properties: {
        map: { type: 'string' },
        limit: { type: 'number', description: 'padrao 20' }
      }
    }
  },
  {
    name: 'match_summary',
    description: 'Retorna resumo estatistico das partidas: winrate geral, por mapa, K/D mensal, streak, comparacao CT vs T, evolucao rank',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'sync_leetify_matches',
    description: 'Sincroniza partidas da conta Leetify do usuario (usa o steamId conectado). Use quando ele falar "sincroniza partidas" ou "pega do leetify".',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'list_callouts',
    description: 'Lista callouts de um mapa CS2 em PT-BR. Mapas disponiveis: mirage, inferno, dust2, nuke, anubis, ancient, train, overpass.',
    input_schema: {
      type: 'object',
      properties: {
        map: { type: 'string', description: 'id do mapa' }
      },
      required: ['map']
    }
  },
  {
    name: 'create_game_server',
    description: 'Salva um servidor de CS2 favorito',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: { type: 'string', description: 'IP:porta' },
        kind: { type: 'string', description: 'dm, retake, wingman, community, surf, kz, aim, practice' },
        password: { type: 'string' },
        notes: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['name', 'address']
    }
  },
  {
    name: 'update_game_server',
    description: 'Atualiza servidor (favoritar, mudar endereco, etc)',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        address: { type: 'string' },
        favorite: { type: 'boolean' },
        notes: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_game_server',
    description: 'Remove servidor pelo id',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'create_cs2_config',
    description: 'Cria config CS2 (autoexec, video, viewmodel, launch, binds). kind: AUTOEXEC | VIDEO | VIEWMODEL | LAUNCH | BINDS.',
    input_schema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['AUTOEXEC', 'VIDEO', 'VIEWMODEL', 'LAUNCH', 'BINDS'] },
        name: { type: 'string' },
        body: { type: 'string' },
        active: { type: 'boolean' }
      },
      required: ['kind', 'name', 'body']
    }
  },
  {
    name: 'update_cs2_config',
    description: 'Atualiza config CS2 (renomear, marcar ativa, mudar body)',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        body: { type: 'string' },
        active: { type: 'boolean' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_cs2_config',
    description: 'Remove config CS2',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'update_match',
    description: 'Atualiza partida CS2 registrada (corrigir KDA, adicionar notas)',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        scoreYou: { type: 'number' },
        scoreEnemy: { type: 'number' },
        kills: { type: 'number' },
        deaths: { type: 'number' },
        assists: { type: 'number' },
        notes: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_match',
    description: 'Remove partida registrada',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'update_price_alert',
    description: 'Atualiza alerta de preco (ativar/desativar, mudar threshold)',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        active: { type: 'boolean' },
        threshold: { type: 'number' },
        windowDays: { type: 'number' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_price_alert',
    description: 'Remove alerta de preco',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'list_expenses',
    description: 'Lista gastos avulsos. Filtros opcionais: month (YYYY-MM), category.',
    input_schema: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'YYYY-MM' },
        category: { type: 'string' },
        limit: { type: 'number' }
      }
    }
  },
  {
    name: 'update_expense',
    description: 'Atualiza gasto',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        amount: { type: 'number' },
        paymentMethod: { type: 'string' },
        notes: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_expense',
    description: 'Remove gasto',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'update_saving_goal',
    description: 'Atualiza meta (mudar target/atual/prazo/desativar)',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        target: { type: 'number' },
        current: { type: 'number' },
        deadline: { type: 'string' },
        active: { type: 'boolean' },
        notes: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_saving_goal',
    description: 'Remove meta de economia',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'list_finance_categories',
    description: 'Lista categorias de financas com orcamento mensal',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_finance_category',
    description: 'Cria categoria custom de financas',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        monthlyBudget: { type: 'number' },
        color: { type: 'string' },
        icon: { type: 'string' }
      },
      required: ['name']
    }
  },
  {
    name: 'set_category_budget',
    description: 'Define orcamento mensal para uma categoria',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome exato da categoria' },
        monthlyBudget: { type: 'number', description: 'Use 0 ou null pra remover' }
      },
      required: ['name']
    }
  },
  {
    name: 'list_bookmarks_full',
    description: 'Lista bookmarks/links do cofre',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'update_bookmark',
    description: 'Atualiza bookmark (favoritar, mudar url, tags)',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        url: { type: 'string' },
        description: { type: 'string' },
        favorite: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_bookmark',
    description: 'Remove bookmark',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'list_snippets',
    description: 'Lista snippets de codigo do cofre',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'update_snippet',
    description: 'Atualiza snippet',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        language: { type: 'string' },
        body: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_snippet',
    description: 'Remove snippet',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'list_notes',
    description: 'Lista notas do cofre',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'update_note',
    description: 'Atualiza nota (fixar, editar body, tags)',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string' },
        pinned: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_note',
    description: 'Remove nota',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'get_setting',
    description: 'Le um valor de configuracao do sistema (chave/valor)',
    input_schema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] }
  },
  {
    name: 'set_setting',
    description: 'Salva uma configuracao (ex: template de lembrete, preferencias)',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        value: { description: 'JSON com a config' }
      },
      required: ['key', 'value']
    }
  },
  {
    name: 'sync_pro_crosshairs',
    description: 'Sincroniza miras dos jogadores profissionais com o ProSettings.net. Sem argumentos atualiza todos; com slug atualiza so um. Demora ~15s pra todos.',
    input_schema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'slug do player ex donk, zywoo, s1mple' } }
    }
  },
  {
    name: 'list_pro_players',
    description: 'Lista jogadores profissionais cadastrados com seus dados de mira (do ProSettings)',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'global_dashboard',
    description: 'Resumo geral de TUDO no app: lembretes ativos, gastos do mes, partidas recentes, watchlist, miras favoritas, snippets, etc. Use pra "como ta tudo?" / "me da um overview"',
    input_schema: { type: 'object', properties: {} }
  }
];

const VISUAL_KEYS = ['style','size','thickness','gap','red','green','blue','alpha','dot','tStyle','outline'] as const;

export async function executeTool(name: string, input: any): Promise<any> {
  switch (name) {
    case 'list_crosshairs': {
      const items = await db.crosshair.findMany({ orderBy: [{ favorite: 'desc' }, { updatedAt: 'desc' }] });
      return items.map(({ id, name, code, favorite, style, size, thickness, gap, red, green, blue, dot, tStyle }) => ({
        id, name, code, favorite, style, size, thickness, gap, red, green, blue, dot, tStyle
      }));
    }
    case 'create_crosshair': {
      let visual: Record<string, any> = { ...DEFAULT_PARAMS };
      if (input.code && /^CSGO-/i.test(input.code)) {
        const dec = decodeShareCode(input.code);
        if (dec) visual = { ...visual, ...dec };
      }
      for (const k of VISUAL_KEYS) if (input[k] !== undefined) visual[k] = input[k];
      const item = await db.crosshair.create({
        data: {
          name: input.name,
          code: input.code ?? `CUSTOM-${input.name.replace(/\s+/g, '-').toUpperCase()}`,
          notes: input.notes ?? null,
          tags: input.tags ?? [],
          favorite: input.favorite ?? false,
          ...visual
        }
      });
      return { id: item.id, name: item.name, message: 'Mira criada' };
    }
    case 'update_crosshair': {
      const { id, ...rest } = input;
      const item = await db.crosshair.update({ where: { id }, data: rest });
      return { id: item.id, message: 'Mira atualizada' };
    }
    case 'delete_crosshair': {
      await db.crosshair.delete({ where: { id: input.id } });
      return { message: 'Removida' };
    }
    case 'list_reminders': {
      const items = await db.reminder.findMany({ orderBy: [{ active: 'desc' }, { dueAt: 'asc' }] });
      return items.map(({ id, title, message, dueAt, cronExpr, recurring, active }) => ({
        id, title, message, dueAt: dueAt.toISOString(), cronExpr, recurring, active
      }));
    }
    case 'create_reminder': {
      const item = await db.reminder.create({
        data: {
          title: input.title,
          message: input.message,
          dueAt: new Date(input.dueAt),
          cronExpr: input.cronExpr ?? null,
          recurring: input.recurring ?? !!input.cronExpr,
          leadMinutes: input.leadMinutes ?? 0,
          active: true
        }
      });
      return { id: item.id, message: 'Lembrete criado' };
    }
    case 'update_reminder': {
      const { id, ...rest } = input;
      await db.reminder.update({ where: { id }, data: rest });
      return { message: 'Atualizado' };
    }
    case 'delete_reminder': {
      await db.reminder.delete({ where: { id: input.id } });
      return { message: 'Removido' };
    }
    case 'list_bookmarks': {
      return await db.bookmark.findMany({ orderBy: [{ favorite: 'desc' }, { createdAt: 'desc' }] });
    }
    case 'create_bookmark': {
      const item = await db.bookmark.create({
        data: {
          title: input.title,
          url: input.url,
          description: input.description ?? null,
          tags: input.tags ?? []
        }
      });
      return { id: item.id, message: 'Link salvo' };
    }
    case 'create_snippet': {
      const item = await db.snippet.create({
        data: { title: input.title, language: input.language, body: input.body, tags: input.tags ?? [] }
      });
      return { id: item.id, message: 'Snippet criado' };
    }
    case 'create_note': {
      const item = await db.note.create({
        data: { title: input.title, body: input.body, tags: input.tags ?? [], pinned: input.pinned ?? false }
      });
      return { id: item.id, message: 'Nota criada' };
    }
    case 'list_configs_cs2': {
      return await db.gameConfig.findMany({ orderBy: { updatedAt: 'desc' } });
    }
    case 'get_whatsapp_status': {
      return {
        instance: process.env.EVOLUTION_INSTANCE,
        targetNumber: process.env.WHATSAPP_TO,
        evolutionUrl: process.env.EVOLUTION_BASE_URL
      };
    }
    case 'list_pro_crosshairs': {
      return PRO_CROSSHAIRS.map(({ player, team, role, tags, notes }) => ({ player, team, role, tags, notes }));
    }
    case 'import_pro_crosshair': {
      const lookup = String(input.player).toLowerCase().trim();
      const fromDb = await db.proPlayer.findFirst({
        where: {
          OR: [
            { slug: lookup },
            { name: { equals: input.player, mode: 'insensitive' } }
          ]
        }
      });
      if (fromDb) {
        const item = await db.crosshair.create({
          data: {
            name: `${fromDb.name}${fromDb.team ? ` (${fromDb.team})` : ''}`,
            code: fromDb.code ?? `PRO-${fromDb.slug.toUpperCase()}`,
            notes: fromDb.styleLabel,
            tags: ['pro', fromDb.role?.toLowerCase() ?? 'rifler'],
            style: fromDb.style,
            size: fromDb.size,
            thickness: fromDb.thickness,
            gap: fromDb.gap,
            red: fromDb.red,
            green: fromDb.green,
            blue: fromDb.blue,
            alpha: fromDb.alpha,
            dot: fromDb.dot,
            tStyle: fromDb.tStyle,
            outline: fromDb.outline
          }
        });
        return { id: item.id, name: item.name, message: `Mira do ${fromDb.name} importada` };
      }
      const pro = findProByName(input.player);
      if (!pro) return { error: `Pro '${input.player}' nao encontrado no DB. Use sync_pro_crosshairs({slug: '${lookup}'}) primeiro pra buscar no ProSettings.` };
      const decoded = decodeShareCode(pro.code) ?? DEFAULT_PARAMS;
      const item = await db.crosshair.create({
        data: {
          name: `${pro.player}${pro.team ? ` (${pro.team})` : ''}`,
          code: pro.code,
          notes: pro.notes ?? null,
          tags: ['pro', ...pro.tags],
          ...decoded
        }
      });
      return { id: item.id, name: item.name, message: `Mira do ${pro.player} importada` };
    }
    case 'generate_crosshair_from_description': {
      const params: CrosshairParams = {
        style: input.style ?? 2,
        size: input.size ?? 2.5,
        thickness: input.thickness ?? 1.0,
        gap: input.gap ?? -2,
        red: input.red ?? 0,
        green: input.green ?? 255,
        blue: input.blue ?? 0,
        alpha: input.alpha ?? 255,
        dot: input.dot ?? false,
        tStyle: input.tStyle ?? false,
        outline: input.outline ?? 0
      };
      let code: string;
      try {
        code = encodeShareCode(params);
      } catch (e) {
        code = `CUSTOM-${input.name.replace(/\s+/g, '-').toUpperCase()}`;
      }
      const item = await db.crosshair.create({
        data: {
          name: input.name,
          code,
          notes: input.notes ?? 'Gerada via IA',
          tags: ['ia-gen'],
          ...params
        }
      });
      return { id: item.id, name: item.name, code, message: 'Mira gerada e salva' };
    }
    case 'list_game_servers': {
      return await db.gameServer.findMany({ orderBy: [{ favorite: 'desc' }, { updatedAt: 'desc' }] });
    }
    case 'generate_buy_binds': {
      const lines: string[] = ['// Buy binds gerados pela IA', ''];
      for (const [key, weaponIds] of Object.entries(input.binds as Record<string, string[]>)) {
        if (!Array.isArray(weaponIds) || weaponIds.length === 0) continue;
        const cmds = weaponIds
          .map((id) => {
            const w = WEAPONS.find((x) => x.id === id);
            return w ? `buy ${w.buy}` : '';
          })
          .filter(Boolean)
          .join('; ');
        lines.push(`bind "${key}" "${cmds}"`);
      }
      const body = lines.join('\n');
      const item = await db.gameConfig.create({
        data: {
          kind: 'BINDS',
          name: input.name ?? `Buy binds IA ${new Date().toLocaleDateString('pt-BR')}`,
          body,
          active: false
        }
      });
      return { id: item.id, name: item.name, body, message: 'Buy binds salvos em Configs' };
    }
    case 'steam_profile': {
      const id = await getSavedSteamId();
      if (!id) return { error: 'Steam nao conectada. Pede pro usuario conectar em /cs2#steam' };
      const p = await getProfile(id);
      return p ?? { error: 'Falha ao buscar perfil (verifica STEAM_API_KEY)' };
    }
    case 'steam_cs2_stats': {
      const id = await getSavedSteamId();
      if (!id) return { error: 'Steam nao conectada. Pede pro usuario conectar em /cs2#steam' };
      const s = await getCS2Stats(id);
      if (!s) return { error: 'Sem stats (perfil privado ou nunca jogou CS2 com a conta atual)' };
      return s;
    }
    case 'steam_cs2_inventory': {
      const id = await getSavedSteamId();
      if (!id) return { error: 'Steam nao conectada' };
      const items = await getCS2Inventory(id);
      const names = items.map((i) => i.marketName).filter(Boolean);
      const prices = names.length > 0
        ? await db.skinPrice.findMany({ where: { marketHashName: { in: names } } })
        : [];
      const priceMap = new Map(prices.map((p) => [p.marketHashName, p]));
      const enriched = items.map((i) => {
        const p = priceMap.get(i.marketName);
        return {
          name: i.name,
          rarity: i.rarity,
          price: p ? { median: p.median, min: p.min, max: p.max, currency: p.currency } : null
        };
      });
      const total = enriched.reduce((s, it) => s + (it.price?.median ?? it.price?.min ?? 0), 0);
      const lastUpdate = prices.length > 0
        ? prices.reduce((max, p) => p.updatedAt > max ? p.updatedAt : max, prices[0].updatedAt)
        : null;
      return {
        count: items.length,
        priced: enriched.filter((i) => i.price).length,
        totalBRL: total,
        lastPriceUpdate: lastUpdate,
        topItems: enriched
          .slice()
          .sort((a, b) => (b.price?.median ?? b.price?.min ?? 0) - (a.price?.median ?? a.price?.min ?? 0))
          .slice(0, 20)
      };
    }
    case 'add_to_watchlist': {
      try {
        const w = await db.watchlist.create({
          data: {
            marketHashName: input.marketHashName,
            displayName: input.displayName ?? null,
            notes: input.notes ?? null
          }
        });
        return { id: w.id, message: `${input.marketHashName} adicionada a watchlist` };
      } catch {
        return { error: 'Skin ja esta na watchlist' };
      }
    }
    case 'list_watchlist': {
      const items = await db.watchlist.findMany({ orderBy: { createdAt: 'desc' } });
      const names = items.map((w) => w.marketHashName);
      const prices = await db.skinPrice.findMany({ where: { marketHashName: { in: names } } });
      const priceMap = new Map(prices.map((p) => [p.marketHashName, p]));
      return items.map((w) => ({
        marketHashName: w.marketHashName,
        displayName: w.displayName,
        currentMin: priceMap.get(w.marketHashName)?.min,
        currentMedian: priceMap.get(w.marketHashName)?.median
      }));
    }
    case 'remove_from_watchlist': {
      const found = await db.watchlist.findUnique({ where: { marketHashName: input.marketHashName } });
      if (!found) return { error: 'Nao esta na watchlist' };
      await db.watchlist.delete({ where: { id: found.id } });
      return { message: 'Removida' };
    }
    case 'create_price_alert': {
      const a = await db.priceAlert.create({
        data: {
          marketHashName: input.marketHashName,
          kind: input.kind,
          threshold: Number(input.threshold),
          windowDays: input.windowDays ?? null,
          active: true
        }
      });
      return { id: a.id, message: 'Alerta criado, vai disparar WhatsApp quando bater' };
    }
    case 'list_price_alerts': {
      return await db.priceAlert.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } });
    }
    case 'compare_skin_prices': {
      const { captureAndStoreSnapshot } = await import('@/lib/price-sources');
      const sources = await captureAndStoreSnapshot(input.marketHashName);
      return {
        marketHashName: input.marketHashName,
        sources: sources.map((s) => ({ source: s.source, min: s.min, median: s.median, currency: s.currency }))
      };
    }
    case 'get_skin_price_history': {
      const days = input.days ?? 90;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const snapshots = await db.skinSnapshot.findMany({
        where: { marketHashName: input.marketHashName, capturedAt: { gte: since } },
        orderBy: { capturedAt: 'asc' }
      });
      const bySource: Record<string, any[]> = {};
      for (const s of snapshots) {
        if (!bySource[s.source]) bySource[s.source] = [];
        bySource[s.source].push({ date: s.capturedAt.toISOString(), min: s.min, median: s.median });
      }
      return { marketHashName: input.marketHashName, days, bySource, count: snapshots.length };
    }
    case 'refresh_skin_prices': {
      try {
        const { fetchSkinportItems } = await import('@/lib/skinport');
        const items = await fetchSkinportItems('BRL', false);
        let saved = 0;
        for (let i = 0; i < items.length; i += 500) {
          const chunk = items.slice(i, i + 500);
          await db.$transaction(
            chunk.map((it) =>
              db.skinPrice.upsert({
                where: { marketHashName: it.market_hash_name },
                create: {
                  marketHashName: it.market_hash_name,
                  currency: it.currency,
                  suggested: it.suggested_price ?? null,
                  min: it.min_price ?? null,
                  median: it.median_price ?? null,
                  mean: it.mean_price ?? null,
                  max: it.max_price ?? null,
                  quantity: it.quantity ?? 0,
                  itemPageUrl: it.item_page,
                  marketPageUrl: it.market_page
                },
                update: {
                  suggested: it.suggested_price ?? null,
                  min: it.min_price ?? null,
                  median: it.median_price ?? null,
                  mean: it.mean_price ?? null,
                  max: it.max_price ?? null,
                  quantity: it.quantity ?? 0
                }
              })
            )
          );
          saved += chunk.length;
        }
        return { ok: true, updated: saved };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    }
    case 'steam_recent_games': {
      const id = await getSavedSteamId();
      if (!id) return { error: 'Steam nao conectada' };
      return await getRecentlyPlayed(id);
    }
    case 'create_subscription': {
      const { nextDueFromDay } = await import('@/lib/finance');
      const dueDay = input.dueDay != null ? Number(input.dueDay) : null;
      const nextDueAt = dueDay && (input.billingCycle ?? 'monthly') !== 'yearly' ? nextDueFromDay(dueDay) : null;
      const item = await db.subscription.create({
        data: {
          name: input.name,
          category: input.category ?? 'Outros',
          amount: Number(input.amount),
          billingCycle: input.billingCycle ?? 'monthly',
          dueDay,
          nextDueAt,
          paymentMethod: input.paymentMethod ?? null,
          alertEnabled: input.alertEnabled ?? true,
          alertDaysBefore: Number(input.alertDaysBefore ?? 3),
          reminderText: input.reminderText ?? null,
          notes: input.notes ?? null
        }
      });
      return { id: item.id, message: `Assinatura "${item.name}" cadastrada: R$ ${item.amount.toFixed(2)} ${item.billingCycle}` };
    }
    case 'list_subscriptions': {
      const where = input.activeOnly ? { active: true } : {};
      return await db.subscription.findMany({ where, orderBy: [{ active: 'desc' }, { nextDueAt: 'asc' }] });
    }
    case 'update_subscription': {
      const { id, ...rest } = input;
      await db.subscription.update({ where: { id }, data: rest });
      return { message: 'Atualizado' };
    }
    case 'delete_subscription': {
      await db.subscription.delete({ where: { id: input.id } });
      return { message: 'Removida' };
    }
    case 'create_expense': {
      const item = await db.expense.create({
        data: {
          description: input.description,
          category: input.category ?? 'Outros',
          amount: Number(input.amount),
          paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
          paymentMethod: input.paymentMethod ?? null,
          notes: input.notes ?? null
        }
      });
      return { id: item.id, message: `Gasto registrado: R$ ${item.amount.toFixed(2)} em ${item.description}` };
    }
    case 'finance_summary': {
      const { monthlyEquivalent } = await import('@/lib/finance');
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const [subs, expensesMonth, goals, dueSoon] = await Promise.all([
        db.subscription.findMany({ where: { active: true } }),
        db.expense.findMany({ where: { paidAt: { gte: startMonth, lt: startNextMonth } } }),
        db.savingGoal.findMany({ where: { active: true } }),
        db.subscription.findMany({ where: { active: true, alertEnabled: true, nextDueAt: { gte: now, lte: in7Days } }, orderBy: { nextDueAt: 'asc' } })
      ]);
      const monthlyRecurring = subs.reduce((s, sub) => s + monthlyEquivalent(sub.amount, sub.billingCycle), 0);
      const monthExpenseTotal = expensesMonth.reduce((s, e) => s + e.amount, 0);
      const byCategory: Record<string, number> = {};
      for (const sub of subs) byCategory[sub.category] = (byCategory[sub.category] ?? 0) + monthlyEquivalent(sub.amount, sub.billingCycle);
      for (const e of expensesMonth) byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
      const totalSaved = goals.reduce((s, g) => s + g.current, 0);
      const totalGoalTarget = goals.reduce((s, g) => s + g.target, 0);
      const topSubs = [...subs].map((s) => ({ name: s.name, amount: s.amount, monthly: monthlyEquivalent(s.amount, s.billingCycle), cycle: s.billingCycle })).sort((a, b) => b.monthly - a.monthly).slice(0, 5);
      return {
        monthlyRecurring,
        monthExpenseTotal,
        totalThisMonth: monthlyRecurring + monthExpenseTotal,
        activeSubscriptions: subs.length,
        byCategory,
        topSubs,
        dueSoon: dueSoon.map((s) => ({ name: s.name, amount: s.amount, nextDueAt: s.nextDueAt?.toISOString(), category: s.category })),
        savings: { saved: totalSaved, target: totalGoalTarget, goals: goals.length }
      };
    }
    case 'create_saving_goal': {
      const item = await db.savingGoal.create({
        data: {
          name: input.name,
          target: Number(input.target),
          current: Number(input.current ?? 0),
          deadline: input.deadline ? new Date(input.deadline) : null,
          notes: input.notes ?? null
        }
      });
      return { id: item.id, message: `Meta "${item.name}" criada: R$ ${item.target.toFixed(2)}` };
    }
    case 'add_to_saving_goal': {
      const goal = await db.savingGoal.findUnique({ where: { id: input.goalId } });
      if (!goal) return { error: 'meta nao encontrada' };
      const newCurrent = goal.current + Number(input.amount);
      await db.savingGoal.update({ where: { id: input.goalId }, data: { current: newCurrent } });
      const pct = (newCurrent / goal.target) * 100;
      return { current: newCurrent, target: goal.target, pct, message: `R$ ${input.amount} adicionados em "${goal.name}". Total: R$ ${newCurrent.toFixed(2)} (${pct.toFixed(0)}%)` };
    }
    case 'list_saving_goals': {
      const goals = await db.savingGoal.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] });
      return goals.map((g) => ({
        id: g.id,
        name: g.name,
        target: g.target,
        current: g.current,
        pct: g.target > 0 ? (g.current / g.target) * 100 : 0,
        deadline: g.deadline?.toISOString() ?? null
      }));
    }
    case 'create_match': {
      const scoreYou = Number(input.scoreYou ?? 0);
      const scoreEnemy = Number(input.scoreEnemy ?? 0);
      const result = scoreYou > scoreEnemy ? 'win' : scoreYou < scoreEnemy ? 'loss' : 'tie';
      const item = await db.match.create({
        data: {
          source: 'manual',
          playedAt: input.playedAt ? new Date(input.playedAt) : new Date(),
          map: String(input.map).toLowerCase().replace(/^de_/, ''),
          mode: input.mode ?? 'premier',
          side: input.side ?? null,
          scoreYou,
          scoreEnemy,
          result,
          rankBefore: input.rankBefore ?? null,
          rankAfter: input.rankAfter ?? null,
          rankDelta: input.rankBefore != null && input.rankAfter != null ? input.rankAfter - input.rankBefore : null,
          kills: Number(input.kills ?? 0),
          deaths: Number(input.deaths ?? 0),
          assists: Number(input.assists ?? 0),
          adr: input.adr != null ? Number(input.adr) : null,
          hsPercent: input.hsPercent != null ? Number(input.hsPercent) : null,
          mvps: Number(input.mvps ?? 0),
          notes: input.notes ?? null
        }
      });
      return { id: item.id, message: `Partida registrada: ${result} ${scoreYou}x${scoreEnemy} em ${item.map}` };
    }
    case 'list_matches': {
      const where: any = {};
      if (input.map) where.map = input.map.toLowerCase().replace(/^de_/, '');
      return await db.match.findMany({
        where,
        orderBy: { playedAt: 'desc' },
        take: Number(input.limit ?? 20)
      });
    }
    case 'match_summary': {
      const all = await db.match.findMany({ orderBy: { playedAt: 'asc' } });
      if (all.length === 0) return { total: 0, message: 'Sem partidas registradas ainda' };
      const wins = all.filter((m) => m.result === 'win').length;
      const losses = all.filter((m) => m.result === 'loss').length;
      const totalKills = all.reduce((s, m) => s + m.kills, 0);
      const totalDeaths = all.reduce((s, m) => s + m.deaths, 0);
      const byMap: Record<string, { matches: number; wins: number }> = {};
      for (const m of all) {
        if (!byMap[m.map]) byMap[m.map] = { matches: 0, wins: 0 };
        byMap[m.map].matches++;
        if (m.result === 'win') byMap[m.map].wins++;
      }
      return {
        total: all.length,
        wins,
        losses,
        winRate: (wins / all.length) * 100,
        avgKD: totalDeaths > 0 ? totalKills / totalDeaths : totalKills,
        byMap: Object.entries(byMap).map(([map, v]) => ({
          map,
          matches: v.matches,
          wins: v.wins,
          winRate: (v.wins / v.matches) * 100
        }))
      };
    }
    case 'sync_leetify_matches': {
      const { getSavedSteamId } = await import('@/lib/steam');
      const { fetchLeetifyProfile } = await import('@/lib/leetify');
      const id = await getSavedSteamId();
      if (!id) return { error: 'Steam nao conectada' };
      const profile = await fetchLeetifyProfile(id);
      if (!profile) return { error: 'Leetify nao retornou dados. Voce ja jogou ao menos 1 partida com a conta Leetify ativa?' };

      let created = 0, updated = 0;
      for (const m of profile.recentMatches) {
        const existing = await db.match.findUnique({ where: { externalId: m.id } });
        const data = {
          source: 'leetify',
          externalId: m.id,
          playedAt: new Date(m.playedAt),
          map: m.map,
          mode: m.mode,
          side: m.side,
          scoreYou: m.scoreYou,
          scoreEnemy: m.scoreEnemy,
          result: m.result,
          rankBefore: m.rankBefore,
          rankAfter: m.rankAfter,
          rankDelta: m.rankBefore != null && m.rankAfter != null ? m.rankAfter - m.rankBefore : null,
          kills: m.kills,
          deaths: m.deaths,
          assists: m.assists,
          adr: m.adr,
          hsPercent: m.hsPercent,
          kast: m.kast,
          rating: m.rating,
          mvps: m.mvps
        };
        if (existing) {
          await db.match.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await db.match.create({ data });
          created++;
        }
      }
      return { ok: true, created, updated, total: profile.recentMatches.length, profileName: profile.name };
    }
    case 'list_callouts': {
      const map = findMap(input.map);
      if (!map) return { error: `Mapa '${input.map}' nao encontrado. Use: ${MAPS.map((m) => m.id).join(', ')}` };
      return {
        name: map.name,
        description: map.description,
        areas: Object.fromEntries(
          Object.entries(map.areas).map(([area, callouts]) => [
            area,
            callouts.map((c) => ({ name: c.name, alias: c.alias, notes: c.notes }))
          ])
        )
      };
    }
    case 'create_game_server': {
      const item = await db.gameServer.create({
        data: {
          name: input.name,
          address: input.address,
          kind: input.kind ?? 'community',
          password: input.password ?? null,
          notes: input.notes ?? null,
          tags: input.tags ?? []
        }
      });
      return { id: item.id, message: 'Servidor salvo' };
    }
    case 'update_game_server': {
      const { id, ...rest } = input;
      await db.gameServer.update({ where: { id }, data: rest });
      return { message: 'Atualizado' };
    }
    case 'delete_game_server': {
      await db.gameServer.delete({ where: { id: input.id } });
      return { message: 'Removido' };
    }
    case 'create_cs2_config': {
      const item = await db.gameConfig.create({
        data: { kind: input.kind, name: input.name, body: input.body, active: input.active ?? false }
      });
      return { id: item.id, message: `Config ${input.kind} "${input.name}" criada` };
    }
    case 'update_cs2_config': {
      const { id, ...rest } = input;
      await db.gameConfig.update({ where: { id }, data: rest });
      return { message: 'Atualizada' };
    }
    case 'delete_cs2_config': {
      await db.gameConfig.delete({ where: { id: input.id } });
      return { message: 'Removida' };
    }
    case 'update_match': {
      const { id, ...rest } = input;
      if (rest.scoreYou != null && rest.scoreEnemy != null) {
        rest.result = rest.scoreYou > rest.scoreEnemy ? 'win' : rest.scoreYou < rest.scoreEnemy ? 'loss' : 'tie';
      }
      await db.match.update({ where: { id }, data: rest });
      return { message: 'Partida atualizada' };
    }
    case 'delete_match': {
      await db.match.delete({ where: { id: input.id } });
      return { message: 'Partida removida' };
    }
    case 'update_price_alert': {
      const { id, ...rest } = input;
      await db.priceAlert.update({ where: { id }, data: rest });
      return { message: 'Alerta atualizado' };
    }
    case 'delete_price_alert': {
      await db.priceAlert.delete({ where: { id: input.id } });
      return { message: 'Alerta removido' };
    }
    case 'list_expenses': {
      const where: any = {};
      if (input.category) where.category = input.category;
      if (input.month) {
        const start = new Date(input.month + '-01T00:00:00');
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        where.paidAt = { gte: start, lt: end };
      }
      return await db.expense.findMany({ where, orderBy: { paidAt: 'desc' }, take: Number(input.limit ?? 100) });
    }
    case 'update_expense': {
      const { id, ...rest } = input;
      await db.expense.update({ where: { id }, data: rest });
      return { message: 'Gasto atualizado' };
    }
    case 'delete_expense': {
      await db.expense.delete({ where: { id: input.id } });
      return { message: 'Gasto removido' };
    }
    case 'update_saving_goal': {
      const { id, ...rest } = input;
      if (rest.deadline) rest.deadline = new Date(rest.deadline);
      await db.savingGoal.update({ where: { id }, data: rest });
      return { message: 'Meta atualizada' };
    }
    case 'delete_saving_goal': {
      await db.savingGoal.delete({ where: { id: input.id } });
      return { message: 'Meta removida' };
    }
    case 'list_finance_categories': {
      return await db.financeCategory.findMany({ orderBy: { name: 'asc' } });
    }
    case 'create_finance_category': {
      try {
        const item = await db.financeCategory.create({
          data: {
            name: input.name,
            monthlyBudget: input.monthlyBudget ?? null,
            color: input.color ?? null,
            icon: input.icon ?? null,
            builtin: false
          }
        });
        return { id: item.id, message: `Categoria "${item.name}" criada` };
      } catch {
        return { error: 'categoria ja existe' };
      }
    }
    case 'set_category_budget': {
      const cat = await db.financeCategory.findUnique({ where: { name: input.name } });
      if (!cat) return { error: `Categoria '${input.name}' nao encontrada. Use list_finance_categories.` };
      const monthlyBudget = input.monthlyBudget && input.monthlyBudget > 0 ? Number(input.monthlyBudget) : null;
      await db.financeCategory.update({ where: { id: cat.id }, data: { monthlyBudget } });
      return { message: monthlyBudget ? `Orcamento de ${cat.name} setado em R$ ${monthlyBudget.toFixed(2)}` : `Orcamento de ${cat.name} removido` };
    }
    case 'list_bookmarks_full': {
      return await db.bookmark.findMany({ orderBy: [{ favorite: 'desc' }, { createdAt: 'desc' }] });
    }
    case 'update_bookmark': {
      const { id, ...rest } = input;
      await db.bookmark.update({ where: { id }, data: rest });
      return { message: 'Atualizado' };
    }
    case 'delete_bookmark': {
      await db.bookmark.delete({ where: { id: input.id } });
      return { message: 'Removido' };
    }
    case 'list_snippets': {
      return await db.snippet.findMany({ orderBy: { updatedAt: 'desc' } });
    }
    case 'update_snippet': {
      const { id, ...rest } = input;
      await db.snippet.update({ where: { id }, data: rest });
      return { message: 'Atualizado' };
    }
    case 'delete_snippet': {
      await db.snippet.delete({ where: { id: input.id } });
      return { message: 'Removido' };
    }
    case 'list_notes': {
      return await db.note.findMany({ orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }] });
    }
    case 'update_note': {
      const { id, ...rest } = input;
      await db.note.update({ where: { id }, data: rest });
      return { message: 'Atualizada' };
    }
    case 'delete_note': {
      await db.note.delete({ where: { id: input.id } });
      return { message: 'Removida' };
    }
    case 'get_setting': {
      const s = await db.setting.findUnique({ where: { key: input.key } });
      return s?.value ?? null;
    }
    case 'set_setting': {
      const s = await db.setting.upsert({
        where: { key: input.key },
        create: { key: input.key, value: input.value },
        update: { value: input.value }
      });
      return { key: s.key, message: 'Salvo' };
    }
    case 'sync_pro_crosshairs': {
      const { fetchProSettings, paramsToShareCode, KNOWN_PROS } = await import('@/lib/prosettings');
      const targets = input.slug
        ? [{ slug: input.slug, team: null, role: null }]
        : KNOWN_PROS;
      let ok = 0, fail = 0;
      for (const t of targets) {
        const data = await fetchProSettings(t.slug);
        if (!data) {
          await db.proPlayer.upsert({
            where: { slug: t.slug },
            create: { slug: t.slug, name: t.slug, fetchError: 'fetch failed', lastFetchedAt: new Date() },
            update: { fetchError: 'fetch failed', lastFetchedAt: new Date() }
          });
          fail++;
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        const code = paramsToShareCode(data);
        const upsertData: any = {
          name: data.name,
          team: data.team ?? t.team ?? null,
          role: data.role ?? t.role ?? null,
          country: data.country,
          code,
          styleLabel: data.styleLabel,
          style: data.style,
          size: data.size,
          thickness: data.thickness,
          gap: data.gap,
          red: data.red,
          green: data.green,
          blue: data.blue,
          alpha: data.alpha,
          dot: data.dot,
          tStyle: data.tStyle,
          outline: data.outline,
          splitDistance: data.splitDistance,
          fixedGap: data.fixedGap,
          innerSplitAlpha: data.innerSplitAlpha,
          outerSplitAlpha: data.outerSplitAlpha,
          followRecoil: data.followRecoil,
          lastFetchedAt: new Date(),
          fetchError: null
        };
        await db.proPlayer.upsert({
          where: { slug: t.slug },
          create: { slug: t.slug, ...upsertData },
          update: upsertData
        });
        ok++;
        await new Promise((r) => setTimeout(r, 800));
      }
      return { ok, fail, total: targets.length, message: `Sincronizados ${ok}/${targets.length} pros do ProSettings` };
    }
    case 'list_pro_players': {
      return await db.proPlayer.findMany({ orderBy: { name: 'asc' } });
    }
    case 'global_dashboard': {
      const { monthlyEquivalent } = await import('@/lib/finance');
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const [
        activeReminders,
        subs,
        expensesMonth,
        recentMatches,
        watchlist,
        crosshairs,
        upcomingPayments,
        pinnedNotes
      ] = await Promise.all([
        db.reminder.count({ where: { active: true } }),
        db.subscription.findMany({ where: { active: true } }),
        db.expense.findMany({ where: { paidAt: { gte: startMonth } } }),
        db.match.findMany({ orderBy: { playedAt: 'desc' }, take: 5 }),
        db.watchlist.count(),
        db.crosshair.count({ where: { favorite: true } }),
        db.subscription.findMany({ where: { active: true, alertEnabled: true, nextDueAt: { gte: now, lte: in7Days } }, orderBy: { nextDueAt: 'asc' } }),
        db.note.findMany({ where: { pinned: true }, take: 3 })
      ]);
      const monthlyRecurring = subs.reduce((s, sub) => s + monthlyEquivalent(sub.amount, sub.billingCycle), 0);
      const monthExpenses = expensesMonth.reduce((s, e) => s + e.amount, 0);
      const winRate = recentMatches.length > 0
        ? (recentMatches.filter((m) => m.result === 'win').length / recentMatches.length) * 100
        : null;
      return {
        reminders: activeReminders,
        finance: {
          subscriptions: subs.length,
          monthlyRecurring,
          monthExpenses,
          monthTotal: monthlyRecurring + monthExpenses,
          upcomingPayments: upcomingPayments.slice(0, 5).map((s) => ({ name: s.name, amount: s.amount, when: s.nextDueAt?.toISOString() }))
        },
        cs2: {
          favoriteCrosshairs: crosshairs,
          recentMatches: recentMatches.length,
          recentWinRate: winRate,
          watchlistSkins: watchlist
        },
        notes: pinnedNotes.map((n) => ({ title: n.title, body: n.body.slice(0, 100) }))
      };
    }
    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
}
