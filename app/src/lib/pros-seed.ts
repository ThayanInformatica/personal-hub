import type { ProScrapedData } from './prosettings';

export type ProSeed = ProScrapedData & {
  slug: string;
  team: string;
  role: string;
};

export const PROS_SEED: ProSeed[] = [
  {
    slug: 'donk', name: 'donk', team: 'Team Spirit', role: 'Rifler', country: 'Russia',
    styleLabel: 'Classic Static', style: 4,
    size: 1, thickness: 1, gap: -4.5,
    red: 0, green: 255, blue: 0, alpha: 200,
    dot: false, tStyle: false, outline: 0,
    splitDistance: 3, fixedGap: 3, innerSplitAlpha: 0.1, outerSplitAlpha: 1, followRecoil: false
  },
  {
    slug: 'zywoo', name: 'ZywOo', team: 'Team Vitality', role: 'AWPer', country: 'France',
    styleLabel: 'Classic Static', style: 4,
    size: 1.5, thickness: 0, gap: -3,
    red: 255, green: 255, blue: 255, alpha: 255,
    dot: false, tStyle: false, outline: 0.5,
    splitDistance: 3, fixedGap: 3, innerSplitAlpha: 0, outerSplitAlpha: 1, followRecoil: false
  },
  {
    slug: 's1mple', name: 's1mple', team: 'BC.Game', role: 'AWPer', country: 'Ukraine',
    styleLabel: 'Classic Static', style: 4,
    size: 1, thickness: 1, gap: -4.5,
    red: 0, green: 255, blue: 0, alpha: 200,
    dot: false, tStyle: false, outline: 0,
    splitDistance: 3, fixedGap: 3, innerSplitAlpha: 0.1, outerSplitAlpha: 1, followRecoil: false
  },
  {
    slug: 'm0nesy', name: 'm0NESY', team: 'Falcons Esports', role: 'AWPer', country: 'Russia',
    styleLabel: 'Classic Static', style: 4,
    size: 1, thickness: 1, gap: -4,
    red: 255, green: 255, blue: 255, alpha: 255,
    dot: false, tStyle: false, outline: 0,
    splitDistance: 3, fixedGap: 3, innerSplitAlpha: 0, outerSplitAlpha: 1, followRecoil: false
  },
  {
    slug: 'niko', name: 'NiKo', team: 'Falcons Esports', role: 'Rifler', country: 'Bosnia & Herzegovina',
    styleLabel: 'Classic Static', style: 4,
    size: 1.5, thickness: 0, gap: -4,
    red: 0, green: 255, blue: 145, alpha: 255,
    dot: false, tStyle: false, outline: 0,
    splitDistance: 3, fixedGap: 0, innerSplitAlpha: 0, outerSplitAlpha: 1, followRecoil: false
  },
  {
    slug: 'sh1ro', name: 'sh1ro', team: 'Team Spirit', role: 'AWPer', country: 'Russia',
    styleLabel: 'Classic Static', style: 4,
    size: 1.5, thickness: 0.6, gap: -3,
    red: 0, green: 255, blue: 0, alpha: 200,
    dot: false, tStyle: false, outline: 0,
    splitDistance: 3, fixedGap: 3, innerSplitAlpha: 0, outerSplitAlpha: 1, followRecoil: false
  },
  {
    slug: 'b1t', name: 'b1t', team: 'Natus Vincere', role: 'Rifler', country: 'Ukraine',
    styleLabel: 'Classic Static', style: 4,
    size: 1, thickness: 1, gap: -4,
    red: 0, green: 255, blue: 145, alpha: 255,
    dot: false, tStyle: false, outline: 0,
    splitDistance: 3, fixedGap: 3, innerSplitAlpha: 0, outerSplitAlpha: 1, followRecoil: false
  },
  {
    slug: 'ropz', name: 'ropz', team: 'Team Vitality', role: 'Rifler', country: 'Estonia',
    styleLabel: 'Classic Static', style: 4,
    size: 2, thickness: 0.5, gap: -3,
    red: 0, green: 255, blue: 145, alpha: 255,
    dot: false, tStyle: false, outline: 0,
    splitDistance: 3, fixedGap: -2, innerSplitAlpha: 0, outerSplitAlpha: 1, followRecoil: false
  },
  {
    slug: 'broky', name: 'broky', team: 'FaZe Clan', role: 'AWPer', country: 'Latvia',
    styleLabel: 'Classic Static', style: 4,
    size: 3, thickness: 1, gap: -1,
    red: 0, green: 255, blue: 168, alpha: 200,
    dot: false, tStyle: false, outline: 1,
    splitDistance: 3, fixedGap: 3, innerSplitAlpha: 0, outerSplitAlpha: 1, followRecoil: false
  },
  {
    slug: 'jl', name: 'jL', team: 'MOUZ', role: 'Rifler', country: 'Lithuania',
    styleLabel: 'Classic Static', style: 4,
    size: 1.5, thickness: 0.6, gap: -2.3,
    red: 0, green: 255, blue: 168, alpha: 255,
    dot: false, tStyle: false, outline: 0,
    splitDistance: 7, fixedGap: -9, innerSplitAlpha: 1, outerSplitAlpha: 0.5, followRecoil: false
  }
];
