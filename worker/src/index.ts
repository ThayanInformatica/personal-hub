import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import parser from 'cron-parser';
import { sendWhatsapp } from './lib/evolution.js';
import { fetchSteamMarketPrice } from './lib/steam-market.js';
import { fetchCSFloatPrice } from './lib/csfloat.js';
import { fetchSkinportItem } from './lib/skinport-item.js';
import { getUsdToBrl } from './lib/forex.js';
import { computeNextDueAt } from './lib/finance.js';

const db = new PrismaClient();

async function reminderTick() {
  const now = new Date();
  const due = await db.reminder.findMany({
    where: { active: true, dueAt: { lte: new Date(now.getTime()) } }
  });
  if (due.length === 0) return;
  console.log(`[worker] ${due.length} lembrete(s) para enviar`);

  for (const r of due) {
    const effectiveDue = new Date(r.dueAt.getTime() - r.leadMinutes * 60_000);
    if (effectiveDue > now) continue;

    const text = `🔔 ${r.title}\n\n${r.message}`;
    const result = await sendWhatsapp(text);

    await db.reminderLog.create({
      data: {
        reminderId: r.id,
        status: result.ok ? 'SUCCESS' : 'FAILED',
        error: result.error ?? null,
        payload: { text, dueAt: r.dueAt.toISOString() }
      }
    });

    let nextDue: Date | null = null;
    let stillActive = true;
    if (r.recurring && r.cronExpr) {
      try {
        const interval = parser.parseExpression(r.cronExpr, { currentDate: now });
        nextDue = interval.next().toDate();
      } catch {
        stillActive = false;
      }
    } else {
      stillActive = false;
    }

    await db.reminder.update({
      where: { id: r.id },
      data: { lastSentAt: now, active: stillActive, dueAt: nextDue ?? r.dueAt }
    });
  }
}

async function captureWatchlistSnapshots() {
  const watch = await db.watchlist.findMany();
  if (watch.length === 0) {
    console.log('[worker] watchlist vazia, nada a capturar');
    return;
  }
  console.log(`[worker] capturando snapshot de ${watch.length} skins...`);
  const rate = await getUsdToBrl(db);
  for (const w of watch) {
    const sources: Array<{ source: string; min: number | null; median: number | null; url?: string }> = [];

    const steam = await fetchSteamMarketPrice(w.marketHashName);
    if (steam) sources.push({ source: 'steam', min: steam.min, median: steam.median });
    await new Promise((r) => setTimeout(r, 1100));

    const cf = await fetchCSFloatPrice(w.marketHashName);
    if (cf) sources.push({
      source: 'csfloat',
      min: cf.minUSD != null ? cf.minUSD * rate : null,
      median: cf.medianUSD != null ? cf.medianUSD * rate : null
    });
    await new Promise((r) => setTimeout(r, 500));

    const sp = await fetchSkinportItem(w.marketHashName);
    if (sp) sources.push({ source: 'skinport', min: sp.minBRL, median: sp.medianBRL });
    await new Promise((r) => setTimeout(r, 500));

    for (const s of sources) {
      await db.skinSnapshot.create({
        data: {
          marketHashName: w.marketHashName,
          source: s.source,
          currency: 'BRL',
          min: s.min,
          median: s.median
        }
      });
      await db.externalPrice.upsert({
        where: { marketHashName_source: { marketHashName: w.marketHashName, source: s.source } },
        create: { marketHashName: w.marketHashName, source: s.source, currency: 'BRL', min: s.min, median: s.median },
        update: { currency: 'BRL', min: s.min, median: s.median }
      });
    }
    if (steam) {
      await db.skinPrice.upsert({
        where: { marketHashName: w.marketHashName },
        create: { marketHashName: w.marketHashName, currency: 'BRL', min: steam.min, median: steam.median, quantity: steam.volume },
        update: { currency: 'BRL', min: steam.min, median: steam.median, quantity: steam.volume }
      });
    }
    console.log(`[worker] ${w.marketHashName}: ${sources.length} sources`);
  }
}

async function evaluateAlerts() {
  const alerts = await db.priceAlert.findMany({ where: { active: true } });
  if (alerts.length === 0) return;
  console.log(`[worker] avaliando ${alerts.length} alertas...`);

  for (const a of alerts) {
    const current = await db.skinPrice.findUnique({ where: { marketHashName: a.marketHashName } });
    const price = current?.median ?? current?.min ?? null;
    if (price == null) continue;

    let trigger = false;
    let reason = '';

    if (a.kind === 'below' && price <= a.threshold) {
      trigger = true;
      reason = `caiu para R$ ${price.toFixed(2)} (limite R$ ${a.threshold.toFixed(2)})`;
    } else if (a.kind === 'above' && price >= a.threshold) {
      trigger = true;
      reason = `subiu para R$ ${price.toFixed(2)} (limite R$ ${a.threshold.toFixed(2)})`;
    } else if (a.kind === 'drop_pct' || a.kind === 'rise_pct') {
      const days = a.windowDays ?? 7;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const oldest = await db.skinSnapshot.findFirst({
        where: { marketHashName: a.marketHashName, source: 'steam', capturedAt: { gte: since } },
        orderBy: { capturedAt: 'asc' }
      });
      if (oldest) {
        const oldPrice = oldest.median ?? oldest.min ?? null;
        if (oldPrice && oldPrice > 0) {
          const pct = ((price - oldPrice) / oldPrice) * 100;
          if (a.kind === 'drop_pct' && pct <= -a.threshold) {
            trigger = true;
            reason = `caiu ${Math.abs(pct).toFixed(1)}% em ${days}d (de R$ ${oldPrice.toFixed(2)} para R$ ${price.toFixed(2)})`;
          }
          if (a.kind === 'rise_pct' && pct >= a.threshold) {
            trigger = true;
            reason = `subiu ${pct.toFixed(1)}% em ${days}d (de R$ ${oldPrice.toFixed(2)} para R$ ${price.toFixed(2)})`;
          }
        }
      }
    }

    if (trigger) {
      const cooldownMs = 12 * 60 * 60 * 1000;
      if (a.lastTriggeredAt && Date.now() - a.lastTriggeredAt.getTime() < cooldownMs) continue;

      const text = `📈 Alerta de skin:\n\n${a.marketHashName}\n${reason}${a.notes ? `\n\n${a.notes}` : ''}`;
      await sendWhatsapp(text);
      await db.priceAlert.update({
        where: { id: a.id },
        data: { lastTriggeredAt: new Date(), lastValueAtTrigger: price }
      });
      console.log(`[worker] alerta disparado: ${a.marketHashName} ${reason}`);
    }
  }
}

async function processSubscriptionAlerts() {
  const now = new Date();
  const subs = await db.subscription.findMany({
    where: { active: true, alertEnabled: true, nextDueAt: { not: null } }
  });
  if (subs.length === 0) return;

  for (const s of subs) {
    if (!s.nextDueAt) continue;
    const due = new Date(s.nextDueAt);
    const diffDays = Math.floor((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    const isDueSoon = diffDays >= 0 && diffDays <= s.alertDaysBefore;
    const isOverdue = diffDays < 0 && diffDays >= -1;

    if (!isDueSoon && !isOverdue) continue;

    const cooldownMs = 22 * 60 * 60 * 1000;
    if (s.lastNotifiedAt && now.getTime() - s.lastNotifiedAt.getTime() < cooldownMs) continue;

    const valueStr = `R$ ${s.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const dayWord = diffDays === 0 ? 'HOJE' : diffDays === 1 ? 'amanhã' : isOverdue ? 'vencido ontem' : `em ${diffDays} dias`;
    const text = `💰 Pagamento ${dayWord}\n\n${s.name} — ${valueStr}\n${s.paymentMethod ?? ''}${s.reminderText ? `\n\n${s.reminderText}` : ''}`;

    const result = await sendWhatsapp(text);
    if (result.ok) {
      console.log(`[worker] alert sub: ${s.name} (${dayWord})`);
      await db.subscription.update({ where: { id: s.id }, data: { lastNotifiedAt: now } });
    }

    if (diffDays < 0) {
      const next = computeNextDueAt(due, s.billingCycle, s.dueDay);
      await db.subscription.update({ where: { id: s.id }, data: { nextDueAt: next } });
      console.log(`[worker] sub ${s.name}: novo vencimento ${next.toISOString()}`);
    }
  }
}

console.log('[worker] iniciado');
cron.schedule('* * * * *', () => {
  reminderTick().catch((e) => console.error('[worker] reminder tick erro:', e));
});
cron.schedule('15 5 * * *', () => {
  captureWatchlistSnapshots().catch((e) => console.error('[worker] snapshot erro:', e));
});
cron.schedule('0 9 * * *', () => {
  processSubscriptionAlerts().catch((e) => console.error('[worker] subscription alerts erro:', e));
});
cron.schedule('30 * * * *', () => {
  evaluateAlerts().catch((e) => console.error('[worker] alerts erro:', e));
});

reminderTick().catch((e) => console.error('[worker] reminder inicial:', e));
