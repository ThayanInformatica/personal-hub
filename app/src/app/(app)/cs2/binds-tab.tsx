'use client';

import { useMemo, useState } from 'react';
import { Copy, Save, Trash2, Check, Plus } from 'lucide-react';
import { WEAPONS, KEY_GROUPS, DEFAULT_BINDS, type Weapon, type WeaponCategory } from '@/lib/cs2-weapons';

const CAT_LABEL: Record<WeaponCategory, string> = {
  pistol: 'Pistolas',
  smg: 'SMGs',
  rifle: 'Rifles',
  heavy: 'Heavy',
  gear: 'Equipamentos',
  nade: 'Granadas'
};

const CATS: WeaponCategory[] = ['pistol', 'smg', 'rifle', 'heavy', 'gear', 'nade'];

export function BindsTab() {
  const [binds, setBinds] = useState<Record<string, string[]>>(DEFAULT_BINDS);
  const [editing, setEditing] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleWeapon(key: string, weaponId: string) {
    setBinds((b) => {
      const current = b[key] ?? [];
      const next = current.includes(weaponId)
        ? current.filter((w) => w !== weaponId)
        : [...current, weaponId];
      return { ...b, [key]: next };
    });
  }

  function clearKey(key: string) {
    setBinds((b) => {
      const next = { ...b };
      delete next[key];
      return next;
    });
  }

  const cfgOutput = useMemo(() => {
    const lines: string[] = ['// Buy binds gerados pelo Personal Hub', ''];
    for (const [key, weaponIds] of Object.entries(binds)) {
      if (weaponIds.length === 0) continue;
      const cmd = weaponIds
        .map((id) => {
          const w = WEAPONS.find((x) => x.id === id);
          return w ? `buy ${w.buy}` : '';
        })
        .filter(Boolean)
        .join('; ');
      lines.push(`bind "${key}" "${cmd}"`);
    }
    return lines.join('\n');
  }, [binds]);

  async function copy() {
    await navigator.clipboard.writeText(cfgOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function saveAsConfig() {
    setSaved(false);
    const res = await fetch('/api/configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'BINDS',
        name: `Buy binds ${new Date().toLocaleDateString('pt-BR')}`,
        body: cfgOutput,
        active: false
      })
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  function nameOf(id: string) {
    return WEAPONS.find((w) => w.id === id)?.label ?? id;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Clique numa tecla, escolha as armas que ela vai comprar (várias = compra sequencial). Exporta como cfg ou salva direto em Configs.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {KEY_GROUPS.map((group) => (
            <div key={group.id}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</h3>
              <div className={`grid gap-2 ${group.id === 'numpad' ? 'grid-cols-3 max-w-xs' : group.id === 'fkeys' ? 'grid-cols-4 max-w-md' : 'grid-cols-2 max-w-xs'}`}>
                {group.keys.map((k) => {
                  const items = binds[k.key] ?? [];
                  const active = editing === k.key;
                  return (
                    <button
                      key={k.key}
                      onClick={() => setEditing(active ? null : k.key)}
                      className={`relative flex h-16 flex-col items-center justify-center rounded-md border p-1 text-xs transition-colors ${
                        active
                          ? 'border-foreground bg-accent'
                          : items.length > 0
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-border/40 hover:border-border/80'
                      }`}
                    >
                      <span className="font-medium">{k.label}</span>
                      {items.length > 0 && (
                        <span className="mt-0.5 line-clamp-1 text-[9px] text-muted-foreground">
                          {items.map(nameOf).join(' · ')}
                        </span>
                      )}
                      {items.length > 0 && (
                        <span
                          onClick={(e) => { e.stopPropagation(); clearKey(k.key); }}
                          className="absolute right-1 top-1 text-muted-foreground hover:text-red-400"
                          role="button"
                          aria-label="Limpar"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {editing && (
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold">Atribuir armas a <code className="rounded bg-muted/40 px-1.5 py-0.5 text-xs">{editing}</code></h4>
                <button onClick={() => setEditing(null)} className="text-xs text-muted-foreground hover:text-foreground">Fechar</button>
              </div>
              <div className="space-y-3">
                {CATS.map((cat) => (
                  <div key={cat}>
                    <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">{CAT_LABEL[cat]}</p>
                    <div className="flex flex-wrap gap-1">
                      {WEAPONS.filter((w) => w.category === cat).map((w) => {
                        const isOn = (binds[editing] ?? []).includes(w.id);
                        return (
                          <button
                            key={w.id}
                            onClick={() => toggleWeapon(editing, w.id)}
                            title={`${w.label} - $${w.price}${w.side && w.side !== 'both' ? ` (${w.side})` : ''}`}
                            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                              isOn
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border/40 hover:bg-accent/40'
                            }`}
                          >
                            {isOn ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                            {w.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Output cfg</span>
              <div className="flex gap-1">
                <button onClick={copy} className="flex items-center gap-1 rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-accent/40">
                  {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  Copiar
                </button>
                <button onClick={saveAsConfig} className="flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-xs text-background hover:opacity-90">
                  {saved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
                  {saved ? 'Salvo!' : 'Salvar em Configs'}
                </button>
              </div>
            </div>
            <pre className="max-h-96 overflow-auto rounded bg-muted/40 p-3 text-[10px] leading-relaxed">{cfgOutput}</pre>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Cola no <code className="rounded bg-muted/40 px-1">autoexec.cfg</code> ou executa via <code className="rounded bg-muted/40 px-1">exec buybinds</code> no console.
          </p>
        </div>
      </div>
    </div>
  );
}
