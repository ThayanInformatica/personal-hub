import { db } from '@/lib/db';
import { VaultClient } from './vault-client';

export const dynamic = 'force-dynamic';

export default async function VaultPage() {
  const [bookmarks, snippets, notes] = await Promise.all([
    db.bookmark.findMany({ orderBy: [{ favorite: 'desc' }, { createdAt: 'desc' }] }),
    db.snippet.findMany({ orderBy: { updatedAt: 'desc' } }),
    db.note.findMany({ orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }] })
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cofre</h1>
        <p className="text-sm text-muted-foreground">Links, snippets e notas</p>
      </div>
      <VaultClient bookmarks={bookmarks} snippets={snippets} notes={notes} />
    </div>
  );
}
