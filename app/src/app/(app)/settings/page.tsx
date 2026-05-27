import { db } from '@/lib/db';
import { SettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const tpl = await db.setting.findUnique({ where: { key: 'reminderTemplate' } });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Conexão WhatsApp, presets de cron, templates</p>
      </div>
      <SettingsClient
        initialTemplate={(tpl?.value as { prefix?: string; signature?: string } | undefined) ?? null}
      />
    </div>
  );
}
