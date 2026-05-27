export type ProCrosshair = {
  player: string;
  team?: string;
  role?: string;
  code: string;
  tags: string[];
  notes?: string;
};

export const PRO_CROSSHAIRS: ProCrosshair[] = [
  {
    player: 'donk',
    team: 'Spirit',
    role: 'Rifler',
    code: 'CSGO-A8sFq-PiKHM-Lf3od-vKB9V-pNueE',
    tags: ['rifler', 'classic'],
    notes: 'Static classic, branca, gap baixo'
  },
  {
    player: 'ZywOo',
    team: 'Vitality',
    role: 'AWPer',
    code: 'CSGO-VR3jD-PVNDF-2hAaP-37N9w-h7v8L',
    tags: ['awp', 'classic'],
    notes: 'Static classic, ciano, fino'
  },
  {
    player: 's1mple',
    team: 'FaZe (era NaVi)',
    role: 'AWPer',
    code: 'CSGO-YHFvY-FZ9bN-OMTok-veSV6-FYjzE',
    tags: ['awp', 'classic'],
    notes: 'Static classic, ciano'
  },
  {
    player: 'm0NESY',
    team: 'G2 (era Falcons)',
    role: 'AWPer',
    code: 'CSGO-Cd9Ya-D9N8f-rPbsZ-3RkY7-PsB8M',
    tags: ['awp', 'dynamic'],
    notes: 'Dynamic style, verde'
  },
  {
    player: 'NiKo',
    team: 'FaZe',
    role: 'Rifler',
    code: 'CSGO-i6sR3-TLbns-CebUu-2pj2u-Bb8MD',
    tags: ['rifler', 'classic'],
    notes: 'Static classic, branca, espessura media'
  },
  {
    player: 'sh1ro',
    team: 'Spirit',
    role: 'AWPer',
    code: 'CSGO-G8u7n-mEYZ7-cn4Lp-MA62D-92vjJ',
    tags: ['awp', 'classic'],
    notes: 'Static, amarela, fina'
  },
  {
    player: 'b1t',
    team: 'NAVI',
    role: 'Rifler',
    code: 'CSGO-fnvAo-DXuwU-7Q8FV-EQuv2-OkBjE',
    tags: ['rifler', 'classic'],
    notes: 'Static classic, ciano'
  },
  {
    player: 'ropz',
    team: 'Vitality (era FaZe)',
    role: 'Rifler',
    code: 'CSGO-tCO75-i3HEh-mc4LH-NeqGt-3oZ8D',
    tags: ['rifler', 'classic'],
    notes: 'Static, branca, espessura baixa'
  },
  {
    player: 'broky',
    team: 'FaZe',
    role: 'AWPer',
    code: 'CSGO-Fz3RW-eDsxP-3OXm9-aSDLG-PkmAQ',
    tags: ['awp', 'classic'],
    notes: 'Static classic, branca'
  },
  {
    player: 'jL',
    team: 'NAVI',
    role: 'Rifler',
    code: 'CSGO-EamD3-A2BLe-FoMHb-zbb5p-K9wcL',
    tags: ['rifler', 'classic'],
    notes: 'Static, verde'
  }
];

export function findProByName(name: string): ProCrosshair | null {
  const lower = name.toLowerCase().trim();
  return PRO_CROSSHAIRS.find((p) => p.player.toLowerCase() === lower) ?? null;
}
