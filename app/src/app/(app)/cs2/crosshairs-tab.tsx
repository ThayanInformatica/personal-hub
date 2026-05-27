'use client';

import { useMemo, useState } from 'react';
import { Star, Copy, Trash2, Plus, Wand2 } from 'lucide-react';
import { CrosshairPreview } from '@/components/crosshair-preview';
import { DEFAULT_PARAMS, decodeShareCode, type CrosshairParams } from '@/lib/crosshair';

type Crosshair = {
  id: string;
  name: string;
  code: string;
  notes: string | null;
  favorite: boolean;
  tags: string[];
  style: number;
  size: number;
  thickness: number;
  gap: number;
  red: number;
  green: number;
  blue: number;
  alpha: number;
  dot: boolean;
  tStyle: boolean;
  outline: number;
};

export function CrosshairsTab({ items }: { items: Crosshair[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Crosshair | null>(null);

  async function toggleFav(id: string, favorite: boolean) {
    await fetch(`/api/crosshairs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite: !favorite })
    });
    location.reload();
  }

  async function remove(id: string) {
    if (!confirm('Remover mira?')) return;
    await fetch(`/api/crosshairs/${id}`, { method: 'DELETE' });
    location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nova mira
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma mira cadastrada</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <div key={c.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{c.name}</h3>
                <button onClick={() => toggleFav(c.id, c.favorite)} title="Favorito">
                  <Star className={`h-4 w-4 ${c.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                </button>
              </div>
              <div className="mt-3 flex justify-center" data-testid="crosshair-preview-card">
                <CrosshairPreview params={paramsFrom(c)} bg="map" size={160} />
              </div>
              <code className="mt-3 block break-all rounded bg-muted/40 p-2 text-xs">{c.code}</code>
              {c.notes && <p className="mt-2 text-xs text-muted-foreground">{c.notes}</p>}
              {c.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags.map((t) => (
                    <span key={t} className="rounded bg-accent/40 px-2 py-0.5 text-xs">{t}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(c.code)}
                  className="flex items-center gap-1 rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-accent/40"
                >
                  <Copy className="h-3 w-3" /> Copiar código
                </button>
                <button
                  onClick={() => { setEditing(c); setOpen(true); }}
                  className="rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-accent/40"
                >
                  Editar
                </button>
                <button
                  onClick={() => remove(c.id)}
                  className="flex items-center gap-1 rounded-md border border-border/40 px-2 py-1 text-xs hover:bg-red-500/20 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && <CrosshairDialog initial={editing} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

function paramsFrom(c: Crosshair): CrosshairParams {
  return {
    style: c.style, size: c.size, thickness: c.thickness, gap: c.gap,
    red: c.red, green: c.green, blue: c.blue, alpha: c.alpha,
    dot: c.dot, tStyle: c.tStyle, outline: c.outline
  };
}

function CrosshairDialog({ initial, onClose }: { initial: Crosshair | null; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [params, setParams] = useState<CrosshairParams>(initial ? paramsFrom(initial) : DEFAULT_PARAMS);
  const [decodeMsg, setDecodeMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cardColor = useMemo(() => `rgb(${params.red}, ${params.green}, ${params.blue})`, [params]);

  function tryDecode() {
    if (!code.trim()) { setDecodeMsg('Cole um código primeiro'); return; }
    const decoded = decodeShareCode(code);
    if (decoded) {
      setParams(decoded);
      setDecodeMsg('Decodificado! Ajuste os valores se necessário.');
    } else {
      setDecodeMsg('Não consegui decodificar. Ajuste manualmente abaixo.');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const body = {
      name, code, notes: notes || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      ...params
    };
    const url = initial ? `/api/crosshairs/${initial.id}` : '/api/crosshairs';
    const method = initial ? 'PATCH' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    location.reload();
  }

  function setParam<K extends keyof CrosshairParams>(key: K, value: CrosshairParams[K]) {
    setParams({ ...params, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="my-8 w-full max-w-3xl space-y-4 rounded-xl border border-border/60 bg-card p-6"
      >
        <h2 className="text-lg font-semibold">{initial ? 'Editar mira' : 'Nova mira'}</h2>

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <Field label="Nome">
              <input className="hub-input" value={name} onChange={(e) => setName(e.target.value)} required data-testid="ch-name" />
            </Field>
            <Field label="Código Valve (CSGO-XXXXX-...)">
              <div className="flex gap-2">
                <input className="hub-input" value={code} onChange={(e) => setCode(e.target.value)} required data-testid="ch-code" />
                <button
                  type="button"
                  onClick={tryDecode}
                  className="flex items-center gap-1 rounded-md border border-border/60 px-3 py-2 text-sm hover:bg-accent/40"
                  data-testid="ch-decode"
                >
                  <Wand2 className="h-3 w-3" /> Decodificar
                </button>
              </div>
              {decodeMsg && <p className="text-xs text-muted-foreground">{decodeMsg}</p>}
            </Field>
            <Field label="Notas">
              <textarea className="hub-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </Field>
            <Field label="Tags (separadas por vírgula)">
              <input className="hub-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="awp, rifle" />
            </Field>
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">Preview ao vivo</span>
            <div data-testid="ch-preview-dialog">
              <CrosshairPreview params={params} bg="map" size={180} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-md border border-border/40 bg-muted/10 p-4 md:grid-cols-3">
          <SliderField label="Style (0-5)" value={params.style} min={0} max={5} step={1} onChange={(v) => setParam('style', v)} />
          <SliderField label="Tamanho" value={params.size} min={0} max={10} step={0.1} onChange={(v) => setParam('size', v)} />
          <SliderField label="Espessura" value={params.thickness} min={0.1} max={5} step={0.1} onChange={(v) => setParam('thickness', v)} />
          <SliderField label="Gap" value={params.gap} min={-10} max={10} step={0.1} onChange={(v) => setParam('gap', v)} />
          <SliderField label="Outline" value={params.outline} min={0} max={3} step={0.1} onChange={(v) => setParam('outline', v)} />
          <SliderField label="Alpha (0-255)" value={params.alpha} min={0} max={255} step={1} onChange={(v) => setParam('alpha', v)} />
          <div className="md:col-span-3">
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              <span>Cor (R,G,B) — atual <span className="inline-block h-3 w-3 align-middle" style={{ background: cardColor }} /></span>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" min={0} max={255} className="hub-input" value={params.red} onChange={(e) => setParam('red', Number(e.target.value))} />
                <input type="number" min={0} max={255} className="hub-input" value={params.green} onChange={(e) => setParam('green', Number(e.target.value))} />
                <input type="number" min={0} max={255} className="hub-input" value={params.blue} onChange={(e) => setParam('blue', Number(e.target.value))} />
              </div>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={params.dot} onChange={(e) => setParam('dot', e.target.checked)} /> Ponto central
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={params.tStyle} onChange={(e) => setParam('tStyle', e.target.checked)} /> T-style (sem topo)
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border/60 px-3 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SliderField({
  label, value, min, max, step, onChange
}: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="flex justify-between text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{Number(value).toFixed(step < 1 ? 1 : 0)}</span>
      </span>
      <input
        type="range"
        className="w-full"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
