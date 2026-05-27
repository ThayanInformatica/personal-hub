export type WeaponCategory = 'pistol' | 'smg' | 'rifle' | 'heavy' | 'gear' | 'nade';

export type Weapon = {
  id: string;
  label: string;
  buy: string;
  category: WeaponCategory;
  side?: 'T' | 'CT' | 'both';
  price: number;
};

export const WEAPONS: Weapon[] = [
  { id: 'glock', label: 'Glock-18', buy: 'glock', category: 'pistol', side: 'T', price: 200 },
  { id: 'usp', label: 'USP-S', buy: 'usp_silencer', category: 'pistol', side: 'CT', price: 200 },
  { id: 'hkp2000', label: 'P2000', buy: 'hkp2000', category: 'pistol', side: 'CT', price: 200 },
  { id: 'p250', label: 'P250', buy: 'p250', category: 'pistol', side: 'both', price: 300 },
  { id: 'fiveseven', label: 'Five-SeveN', buy: 'fiveseven', category: 'pistol', side: 'CT', price: 500 },
  { id: 'tec9', label: 'Tec-9', buy: 'tec9', category: 'pistol', side: 'T', price: 500 },
  { id: 'cz75a', label: 'CZ75-Auto', buy: 'cz75a', category: 'pistol', side: 'both', price: 500 },
  { id: 'deagle', label: 'Desert Eagle', buy: 'deagle', category: 'pistol', side: 'both', price: 700 },
  { id: 'r8', label: 'R8 Revolver', buy: 'revolver', category: 'pistol', side: 'both', price: 600 },

  { id: 'mac10', label: 'MAC-10', buy: 'mac10', category: 'smg', side: 'T', price: 1050 },
  { id: 'mp9', label: 'MP9', buy: 'mp9', category: 'smg', side: 'CT', price: 1250 },
  { id: 'mp7', label: 'MP7', buy: 'mp7', category: 'smg', side: 'both', price: 1500 },
  { id: 'mp5', label: 'MP5-SD', buy: 'mp5sd', category: 'smg', side: 'both', price: 1500 },
  { id: 'ump45', label: 'UMP-45', buy: 'ump45', category: 'smg', side: 'both', price: 1200 },
  { id: 'p90', label: 'P90', buy: 'p90', category: 'smg', side: 'both', price: 2350 },
  { id: 'bizon', label: 'PP-Bizon', buy: 'bizon', category: 'smg', side: 'both', price: 1400 },

  { id: 'galil', label: 'Galil AR', buy: 'galilar', category: 'rifle', side: 'T', price: 1800 },
  { id: 'famas', label: 'FAMAS', buy: 'famas', category: 'rifle', side: 'CT', price: 1950 },
  { id: 'ak47', label: 'AK-47', buy: 'ak47', category: 'rifle', side: 'T', price: 2700 },
  { id: 'm4a4', label: 'M4A4', buy: 'm4a1', category: 'rifle', side: 'CT', price: 3100 },
  { id: 'm4a1s', label: 'M4A1-S', buy: 'm4a1_silencer', category: 'rifle', side: 'CT', price: 2900 },
  { id: 'ssg08', label: 'SSG 08 (Scout)', buy: 'ssg08', category: 'rifle', side: 'both', price: 1700 },
  { id: 'aug', label: 'AUG', buy: 'aug', category: 'rifle', side: 'CT', price: 3300 },
  { id: 'sg553', label: 'SG 553', buy: 'sg556', category: 'rifle', side: 'T', price: 3000 },
  { id: 'awp', label: 'AWP', buy: 'awp', category: 'rifle', side: 'both', price: 4750 },
  { id: 'scar20', label: 'SCAR-20', buy: 'scar20', category: 'rifle', side: 'CT', price: 5000 },
  { id: 'g3sg1', label: 'G3SG1', buy: 'g3sg1', category: 'rifle', side: 'T', price: 5000 },

  { id: 'nova', label: 'Nova', buy: 'nova', category: 'heavy', side: 'both', price: 1050 },
  { id: 'xm1014', label: 'XM1014', buy: 'xm1014', category: 'heavy', side: 'both', price: 2000 },
  { id: 'mag7', label: 'MAG-7', buy: 'mag7', category: 'heavy', side: 'CT', price: 1300 },
  { id: 'sawedoff', label: 'Sawed-Off', buy: 'sawedoff', category: 'heavy', side: 'T', price: 1100 },
  { id: 'm249', label: 'M249', buy: 'm249', category: 'heavy', side: 'both', price: 5200 },
  { id: 'negev', label: 'Negev', buy: 'negev', category: 'heavy', side: 'both', price: 1700 },

  { id: 'vest', label: 'Colete', buy: 'vest', category: 'gear', side: 'both', price: 650 },
  { id: 'vesthelm', label: 'Colete + Capacete', buy: 'vesthelm', category: 'gear', side: 'both', price: 1000 },
  { id: 'defuser', label: 'Kit Defuse', buy: 'defuser', category: 'gear', side: 'CT', price: 400 },
  { id: 'taser', label: 'Zeus x27', buy: 'taser', category: 'gear', side: 'both', price: 200 },

  { id: 'he', label: 'HE Grenade', buy: 'hegrenade', category: 'nade', side: 'both', price: 300 },
  { id: 'flash', label: 'Flashbang', buy: 'flashbang', category: 'nade', side: 'both', price: 200 },
  { id: 'smoke', label: 'Smoke', buy: 'smokegrenade', category: 'nade', side: 'both', price: 300 },
  { id: 'molotov', label: 'Molotov', buy: 'molotov', category: 'nade', side: 'T', price: 400 },
  { id: 'incgrenade', label: 'Incendiary', buy: 'incgrenade', category: 'nade', side: 'CT', price: 600 },
  { id: 'decoy', label: 'Decoy', buy: 'decoy', category: 'nade', side: 'both', price: 50 }
];

export const KEY_GROUPS: { id: string; label: string; keys: { key: string; label: string }[] }[] = [
  {
    id: 'numpad',
    label: 'Numpad',
    keys: [
      { key: 'kp_7', label: 'NP 7' }, { key: 'kp_8', label: 'NP 8' }, { key: 'kp_9', label: 'NP 9' },
      { key: 'kp_4', label: 'NP 4' }, { key: 'kp_5', label: 'NP 5' }, { key: 'kp_6', label: 'NP 6' },
      { key: 'kp_1', label: 'NP 1' }, { key: 'kp_2', label: 'NP 2' }, { key: 'kp_3', label: 'NP 3' },
      { key: 'kp_0', label: 'NP 0' }, { key: 'kp_enter', label: 'NP Enter' }, { key: 'kp_plus', label: 'NP +' }
    ]
  },
  {
    id: 'fkeys',
    label: 'F1-F12',
    keys: [
      { key: 'f1', label: 'F1' }, { key: 'f2', label: 'F2' }, { key: 'f3', label: 'F3' }, { key: 'f4', label: 'F4' },
      { key: 'f5', label: 'F5' }, { key: 'f6', label: 'F6' }, { key: 'f7', label: 'F7' }, { key: 'f8', label: 'F8' }
    ]
  },
  {
    id: 'mouse',
    label: 'Mouse extras',
    keys: [
      { key: 'mouse4', label: 'Mouse 4' }, { key: 'mouse5', label: 'Mouse 5' }
    ]
  }
];

export const DEFAULT_BINDS: Record<string, string[]> = {
  kp_7: ['vesthelm', 'defuser'],
  kp_9: ['ak47', 'm4a4'],
  kp_8: ['awp'],
  kp_4: ['p250'],
  kp_5: ['deagle'],
  kp_6: ['vesthelm'],
  kp_1: ['smoke'],
  kp_2: ['flash'],
  kp_3: ['molotov', 'incgrenade'],
  kp_0: ['he'],
  kp_enter: ['flash']
};
