'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, ExternalLink, Copy, Pin, Star } from 'lucide-react';

type Bookmark = { id: string; title: string; url: string; description: string | null; tags: string[]; favorite: boolean };
type Snippet = { id: string; title: string; language: string; body: string; tags: string[] };
type Note = { id: string; title: string; body: string; tags: string[]; pinned: boolean };

type Tab = 'bookmarks' | 'snippets' | 'notes';

export function VaultClient({
  bookmarks,
  snippets,
  notes
}: {
  bookmarks: Bookmark[];
  snippets: Snippet[];
  notes: Note[];
}) {
  const [tab, setTab] = useState<Tab>('bookmarks');
  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    if (h === 'bookmarks' || h === 'snippets' || h === 'notes') setTab(h);
  }, []);
  useEffect(() => {
    window.location.hash = tab;
  }, [tab]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border/60">
        {(['bookmarks', 'snippets', 'notes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'bookmarks' ? 'Links' : t === 'snippets' ? 'Snippets' : 'Notas'}
          </button>
        ))}
      </div>
      {tab === 'bookmarks' && <BookmarksTab items={bookmarks} />}
      {tab === 'snippets' && <SnippetsTab items={snippets} />}
      {tab === 'notes' && <NotesTab items={notes} />}
    </div>
  );
}

function BookmarksTab({ items }: { items: Bookmark[] }) {
  const [open, setOpen] = useState(false);
  async function remove(id: string) {
    if (!confirm('Remover?')) return;
    await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
    location.reload();
  }
  async function toggleFav(id: string, favorite: boolean) {
    await fetch(`/api/bookmarks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite: !favorite })
    });
    location.reload();
  }
  return (
    <div className="space-y-3">
      <NewButton onClick={() => setOpen(true)} label="Novo link" />
      {items.length === 0 ? (
        <Empty>Nenhum link salvo</Empty>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {items.map((b) => (
            <div key={b.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-medium hover:underline">
                    {b.title}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="truncate text-xs text-muted-foreground">{b.url}</p>
                  {b.description && <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>}
                  {b.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {b.tags.map((t) => (
                        <span key={t} className="rounded bg-accent/40 px-2 py-0.5 text-xs">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => toggleFav(b.id, b.favorite)}>
                    <Star className={`h-4 w-4 ${b.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                  <button onClick={() => remove(b.id)} className="text-muted-foreground hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <SimpleForm
          title="Novo link"
          onClose={() => setOpen(false)}
          fields={[
            { name: 'title', label: 'Titulo', required: true },
            { name: 'url', label: 'URL', required: true },
            { name: 'description', label: 'Descricao' },
            { name: 'tags', label: 'Tags (virgula)' }
          ]}
          onSubmit={async (data) => {
            await fetch('/api/bookmarks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: data.title,
                url: data.url,
                description: data.description || null,
                tags: (data.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
              })
            });
            location.reload();
          }}
        />
      )}
    </div>
  );
}

function SnippetsTab({ items }: { items: Snippet[] }) {
  const [open, setOpen] = useState(false);
  async function remove(id: string) {
    if (!confirm('Remover?')) return;
    await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
    location.reload();
  }
  return (
    <div className="space-y-3">
      <NewButton onClick={() => setOpen(true)} label="Novo snippet" />
      {items.length === 0 ? (
        <Empty>Nenhum snippet</Empty>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <span className="rounded bg-accent/40 px-2 py-0.5 text-xs">{s.language}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(s.body)} className="rounded-md border border-border/40 p-1 hover:bg-accent/40">
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={() => remove(s.id)} className="rounded-md border border-border/40 p-1 hover:bg-red-500/20 hover:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted/40 p-3 text-xs">{s.body}</pre>
            </div>
          ))}
        </div>
      )}
      {open && (
        <SimpleForm
          title="Novo snippet"
          onClose={() => setOpen(false)}
          fields={[
            { name: 'title', label: 'Titulo', required: true },
            { name: 'language', label: 'Linguagem', required: true, placeholder: 'sh, sql, ts...' },
            { name: 'body', label: 'Conteudo', type: 'textarea', required: true },
            { name: 'tags', label: 'Tags (virgula)' }
          ]}
          onSubmit={async (data) => {
            await fetch('/api/snippets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: data.title,
                language: data.language,
                body: data.body,
                tags: (data.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
              })
            });
            location.reload();
          }}
        />
      )}
    </div>
  );
}

function NotesTab({ items }: { items: Note[] }) {
  const [open, setOpen] = useState(false);
  async function remove(id: string) {
    if (!confirm('Remover?')) return;
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    location.reload();
  }
  async function togglePin(id: string, pinned: boolean) {
    await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !pinned })
    });
    location.reload();
  }
  return (
    <div className="space-y-3">
      <NewButton onClick={() => setOpen(true)} label="Nova nota" />
      {items.length === 0 ? (
        <Empty>Nenhuma nota</Empty>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {items.map((n) => (
            <div key={n.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{n.title}</h3>
                <div className="flex gap-1">
                  <button onClick={() => togglePin(n.id, n.pinned)}>
                    <Pin className={`h-4 w-4 ${n.pinned ? 'fill-foreground text-foreground' : 'text-muted-foreground'}`} />
                  </button>
                  <button onClick={() => remove(n.id)} className="text-muted-foreground hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
            </div>
          ))}
        </div>
      )}
      {open && (
        <SimpleForm
          title="Nova nota"
          onClose={() => setOpen(false)}
          fields={[
            { name: 'title', label: 'Titulo', required: true },
            { name: 'body', label: 'Conteudo', type: 'textarea', required: true },
            { name: 'tags', label: 'Tags (virgula)' }
          ]}
          onSubmit={async (data) => {
            await fetch('/api/notes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: data.title,
                body: data.body,
                tags: (data.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
              })
            });
            location.reload();
          }}
        />
      )}
    </div>
  );
}

function NewButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        className="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> {label}
      </button>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

type FieldDef = { name: string; label: string; required?: boolean; type?: 'text' | 'textarea'; placeholder?: string };

function SimpleForm({
  title,
  fields,
  onClose,
  onSubmit
}: {
  title: string;
  fields: FieldDef[];
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => Promise<void>;
}) {
  const [data, setData] = useState<Record<string, string>>({});
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          await onSubmit(data);
        }}
        className="w-full max-w-md space-y-3 rounded-xl border border-border/60 bg-card p-6"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {fields.map((f) => (
          <label key={f.name} className="block space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
            {f.type === 'textarea' ? (
              <textarea
                className="hub-input"
                rows={5}
                required={f.required}
                placeholder={f.placeholder}
                value={data[f.name] ?? ''}
                onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
              />
            ) : (
              <input
                className="hub-input"
                required={f.required}
                placeholder={f.placeholder}
                value={data[f.name] ?? ''}
                onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
              />
            )}
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border/60 px-3 py-2 text-sm">
            Cancelar
          </button>
          <button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
