export function rarityClass(rarity?: string | null): string {
  if (!rarity) return 'rarity-default';
  const r = rarity.toLowerCase();
  if (r.includes('consumer') || r.includes('comum')) return 'rarity-consumer';
  if (r.includes('industrial')) return 'rarity-industrial';
  if (r.includes('mil-spec') || r.includes('milspec') || r.includes('militar')) return 'rarity-milspec';
  if (r.includes('restricted') || r.includes('restrita')) return 'rarity-restricted';
  if (r.includes('classified') || r.includes('classificada')) return 'rarity-classified';
  if (r.includes('covert') || r.includes('secreta')) return 'rarity-covert';
  if (r.includes('contraband') || r.includes('extraordinary') || r.includes('rare special') || r.includes('extraordinária')) return 'rarity-rare';
  return 'rarity-default';
}

export function rarityLabel(rarity?: string | null): string {
  if (!rarity) return 'Comum';
  return rarity;
}
