import { NextResponse } from 'next/server';
import { getInstanceState, fetchInstances, getConfig } from '@/lib/evolution-admin';

export async function GET() {
  const cfg = getConfig();
  const state = await getInstanceState();
  const list = await fetchInstances();
  const exists = Array.isArray(list.data) && list.data.some((i: any) => {
    const name = i?.name ?? i?.instance?.instanceName ?? i?.instanceName;
    return name === cfg.instance;
  });
  return NextResponse.json({
    config: cfg,
    exists,
    state: state.data?.instance?.state ?? state.data?.state ?? null,
    raw: { state: state.data, list: list.data }
  });
}
