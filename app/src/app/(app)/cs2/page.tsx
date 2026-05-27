import { db } from '@/lib/db';
import { CrosshairsTab } from './crosshairs-tab';
import { ConfigsTab } from './configs-tab';
import { ProsTab } from './pros-tab';
import { ServersTab } from './servers-tab';
import { LaunchTab } from './launch-tab';
import { SensTab } from './sens-tab';
import { BindsTab } from './binds-tab';
import { CalloutsTab } from './callouts-tab';
import { SteamTab } from './steam-tab';
import { WatchlistTab } from './watchlist-tab';
import { MatchesTab } from './matches-tab';
import { TabsClient } from './tabs-client';

export const dynamic = 'force-dynamic';

export default async function CS2Page() {
  const [crosshairs, configs, servers] = await Promise.all([
    db.crosshair.findMany({ orderBy: [{ favorite: 'desc' }, { updatedAt: 'desc' }] }),
    db.gameConfig.findMany({ orderBy: { updatedAt: 'desc' } }),
    db.gameServer.findMany({ orderBy: [{ favorite: 'desc' }, { updatedAt: 'desc' }] })
  ]);

  return (
    <div className="cs2-scope cs2-bg -mx-4 -my-4 min-h-screen md:-mx-8 md:-my-8">
      <div className="cs2-scanlines">
        <div className="border-b border-[hsl(var(--cs2-border))] bg-gradient-to-r from-transparent via-[hsl(var(--cs2-surface))] to-transparent">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--cs2-amber))] shadow-[0_0_8px_hsl(var(--cs2-amber))]" />
                  <span className="cs2-stencil text-xs text-[hsl(var(--cs2-amber))]">COUNTER-STRIKE 2 // PERSONAL OPS</span>
                </div>
                <h1 className="cs2-title mt-1 text-4xl text-[hsl(var(--cs2-text))]">CS2 Operations Center</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Setup · Inventário · Market · Knowledge · Tracking
                </p>
              </div>
              <div className="hidden gap-3 md:flex">
                <SummaryChip label="Miras" value={String(crosshairs.length)} />
                <SummaryChip label="Configs" value={String(configs.length)} />
                <SummaryChip label="Servers" value={String(servers.length)} />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <TabsClient
            tabs={[
              { id: 'steam', label: 'Steam', content: <SteamTab /> },
              { id: 'matches', label: 'Matches', content: <MatchesTab /> },
              { id: 'watchlist', label: 'Watchlist', content: <WatchlistTab /> },
              { id: 'crosshairs', label: 'Miras', content: <CrosshairsTab items={crosshairs} /> },
              { id: 'pros', label: 'Pro Presets', content: <ProsTab /> },
              { id: 'configs', label: 'Configs', content: <ConfigsTab items={configs} /> },
              { id: 'binds', label: 'Buy Binds', content: <BindsTab /> },
              { id: 'callouts', label: 'Callouts', content: <CalloutsTab /> },
              { id: 'servers', label: 'Servers', content: <ServersTab items={servers} /> },
              { id: 'launch', label: 'Launch', content: <LaunchTab /> },
              { id: 'sens', label: 'Sens', content: <SensTab /> }
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="cs2-cut-sm border border-[hsl(var(--cs2-border))] bg-[hsl(var(--cs2-surface))] px-4 py-2 text-center">
      <p className="cs2-stat-value text-lg leading-none">{value}</p>
      <p className="cs2-stat-label mt-1">{label}</p>
    </div>
  );
}
