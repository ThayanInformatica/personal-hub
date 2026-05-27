export type CalloutArea = 'A' | 'B' | 'Mid' | 'T Spawn' | 'CT Spawn' | 'Conector';

export type Callout = {
  name: string;
  alias?: string[];
  notes?: string;
};

export type CS2Map = {
  id: string;
  name: string;
  pool: 'active' | 'reserve';
  description: string;
  areas: Record<CalloutArea, Callout[]>;
};

export const MAPS: CS2Map[] = [
  {
    id: 'mirage',
    name: 'Mirage',
    pool: 'active',
    description: 'Mapa clássico do Oriente Médio, 3 corredores classicos (A short, mid, B apps).',
    areas: {
      'A': [
        { name: 'A Site', alias: ['site A'] },
        { name: 'Ramp', notes: 'rampa que sobe pra A' },
        { name: 'Palace', alias: ['palácio', 'pal'] },
        { name: 'CT', notes: 'spawn CT lookout' },
        { name: 'Default plant', notes: 'centro do site' },
        { name: 'Triple box', notes: '3 caixas perto de ramp' },
        { name: 'Stairs', alias: ['escada'] },
        { name: 'Firebox', notes: 'box perto de palace' },
        { name: 'Ticket', notes: 'cabine vendedora de ingressos perto de A short' }
      ],
      'B': [
        { name: 'B Site', alias: ['site B', 'apps'] },
        { name: 'Apartments', alias: ['apps', 'apartamentos'] },
        { name: 'Bench', notes: 'banco no site' },
        { name: 'Market', alias: ['mercado'] },
        { name: 'Van', notes: 'caminhonete azul no site' },
        { name: 'Kitchen', alias: ['cozinha'] },
        { name: 'Tetris', notes: 'janelinhas tipo tetris vindo de apps' }
      ],
      'Mid': [
        { name: 'Mid', notes: 'corredor central' },
        { name: 'Top mid', notes: 'janela do CT em mid' },
        { name: 'Boxes', alias: ['caixas mid'] },
        { name: 'Window', alias: ['janela'] },
        { name: 'Catwalk', alias: ['cat'], notes: 'passarela do mid pra A short' },
        { name: 'Underpass', notes: 'embaixo do mid' }
      ],
      'T Spawn': [
        { name: 'T Spawn' },
        { name: 'A Ramp entry', notes: 'entrada de ramp vindo do T' },
        { name: 'B Apps entry', notes: 'entrada de apps' }
      ],
      'CT Spawn': [
        { name: 'CT Spawn' },
        { name: 'Jungle', alias: ['mato'] }
      ],
      'Conector': [
        { name: 'Connector', alias: ['conector'], notes: 'liga mid com A' },
        { name: 'A short', notes: 'corredor entre cat e A' }
      ]
    }
  },
  {
    id: 'inferno',
    name: 'Inferno',
    pool: 'active',
    description: 'Mapa de vilas italianas. Banana é o caminho rápido pra B, mid é apertado.',
    areas: {
      'A': [
        { name: 'A Site', alias: ['site A'] },
        { name: 'Pit', notes: 'buraco no site' },
        { name: 'Library', alias: ['biblio'] },
        { name: 'Graveyard', alias: ['cemitério'] },
        { name: 'Balcony', alias: ['varanda'] },
        { name: 'Triple', notes: '3 caixas no site' },
        { name: 'Default plant', notes: 'plant central' }
      ],
      'B': [
        { name: 'B Site', alias: ['site B'] },
        { name: 'Banana', notes: 'corredor curvado de T pra B' },
        { name: 'New box', notes: 'box recém-adicionado' },
        { name: 'Coffin', notes: 'caixote sentido CT' },
        { name: 'Sandbags', alias: ['sacos de areia'] },
        { name: 'Dark', notes: 'cantinho escuro perto de CT' },
        { name: 'Quad', notes: '4 caixas' }
      ],
      'Mid': [
        { name: 'Mid', notes: 'curto, perigoso' },
        { name: 'Top mid', alias: ['arch'] },
        { name: 'Short', notes: 'mid curto vindo do T' }
      ],
      'T Spawn': [
        { name: 'T Spawn' },
        { name: 'Banana entry' },
        { name: 'Apps entry', notes: 'entrada de apartamentos' }
      ],
      'CT Spawn': [
        { name: 'CT Spawn' },
        { name: 'Garden', notes: 'jardim atrás de B' }
      ],
      'Conector': [
        { name: 'Apartments', alias: ['apps', 'apartamentos'] },
        { name: 'Balcony apps' },
        { name: 'Window apps' }
      ]
    }
  },
  {
    id: 'dust2',
    name: 'Dust 2',
    pool: 'active',
    description: 'O clássico. Long, mid, tunnels e catwalk.',
    areas: {
      'A': [
        { name: 'A Site', alias: ['site A'] },
        { name: 'Long', alias: ['long A'], notes: 'corredor longo vindo do T' },
        { name: 'Pit', notes: 'buraco em long' },
        { name: 'Goose', notes: 'cantinho com cerca' },
        { name: 'Default plant', notes: 'plant atrás do car' },
        { name: 'Car', notes: 'carro no site' },
        { name: 'Ramp', notes: 'rampa vindo de CT' },
        { name: 'Elevator', alias: ['elevador'] },
        { name: 'Goose', notes: 'cantinho da cerca' }
      ],
      'B': [
        { name: 'B Site', alias: ['site B'] },
        { name: 'Tunnels', alias: ['tunel'] },
        { name: 'Upper tunnels', notes: 'tunel de cima' },
        { name: 'Plat', notes: 'plataforma elevada CT side de B' },
        { name: 'Doors', alias: ['portas'] },
        { name: 'Window', alias: ['janela B'] },
        { name: 'Back plat', notes: 'fundo de B' }
      ],
      'Mid': [
        { name: 'Mid' },
        { name: 'Top mid', notes: 'lado CT do mid' },
        { name: 'Lower tunnels', notes: 'descida do mid pro B' },
        { name: 'Xbox', notes: 'caixa X no mid' },
        { name: 'Catwalk', alias: ['cat'] },
        { name: 'Mid doors' }
      ],
      'T Spawn': [{ name: 'T Spawn' }, { name: 'Long doors' }, { name: 'Tunnel entry' }],
      'CT Spawn': [{ name: 'CT Spawn' }],
      'Conector': [{ name: 'Suicide', notes: 'corredor longo entre long e mid' }]
    }
  },
  {
    id: 'nuke',
    name: 'Nuke',
    pool: 'active',
    description: 'Mapa de 2 andares (A em cima, B embaixo). Outside e ramps são chaves.',
    areas: {
      'A': [
        { name: 'A Site', alias: ['top'] },
        { name: 'Heaven', alias: ['céu'], notes: 'área alta CT' },
        { name: 'Hut', alias: ['casinha'] },
        { name: 'Squeaky', notes: 'porta que faz barulho' },
        { name: 'Radio', notes: 'sala de rádio CT side' },
        { name: 'Crane', alias: ['guindaste'] }
      ],
      'B': [
        { name: 'B Site', alias: ['bottom'] },
        { name: 'Big room', alias: ['sala grande'] },
        { name: 'Ramp', notes: 'descida do A pro B' },
        { name: 'Headshot box', notes: 'altura de cabeça do ramp' },
        { name: 'CT', notes: 'CT lookout pro B' },
        { name: 'Vents', alias: ['ventilação'] }
      ],
      'Mid': [
        { name: 'Outside', alias: ['fora'] },
        { name: 'Lobby' },
        { name: 'Garage', alias: ['garagem'] },
        { name: 'Silo', notes: 'estrutura redonda alta' },
        { name: 'Yard', alias: ['quintal'] }
      ],
      'T Spawn': [{ name: 'T Spawn' }],
      'CT Spawn': [{ name: 'CT Spawn' }],
      'Conector': [{ name: 'Secret', notes: 'sala secreta entre A e B' }, { name: 'Vents', notes: 'ventilação entre andares' }]
    }
  },
  {
    id: 'anubis',
    name: 'Anubis',
    pool: 'active',
    description: 'Mapa egípcio. Bridge no mid, palace em A, water em B.',
    areas: {
      'A': [
        { name: 'A Site' },
        { name: 'Palace', notes: 'estrutura alta no site' },
        { name: 'Mound', alias: ['monte'] },
        { name: 'Heaven' },
        { name: 'Conn', notes: 'connector pro A' },
        { name: 'Default plant' }
      ],
      'B': [
        { name: 'B Site' },
        { name: 'Water', alias: ['água'] },
        { name: 'Canals', alias: ['canais'] },
        { name: 'Stairs', alias: ['escada B'] },
        { name: 'Heaven B' },
        { name: 'Hut' }
      ],
      'Mid': [
        { name: 'Mid' },
        { name: 'Bridge', alias: ['ponte'] },
        { name: 'Boat', notes: 'barco no canal' },
        { name: 'Window', alias: ['janela mid'] }
      ],
      'T Spawn': [{ name: 'T Spawn' }],
      'CT Spawn': [{ name: 'CT Spawn' }],
      'Conector': [{ name: 'Connector', notes: 'liga mid com A' }]
    }
  },
  {
    id: 'ancient',
    name: 'Ancient',
    pool: 'active',
    description: 'Mapa de templo maia. Pequeno e técnico, mid muito disputado.',
    areas: {
      'A': [
        { name: 'A Site' },
        { name: 'Cave', alias: ['caverna'] },
        { name: 'Donut', notes: 'estrutura curva' },
        { name: 'Pillar', alias: ['pilar'] },
        { name: 'Tower', alias: ['torre'] },
        { name: 'Temple' }
      ],
      'B': [
        { name: 'B Site' },
        { name: 'Ramp' },
        { name: 'Mud', notes: 'lama' },
        { name: 'House', alias: ['casa'] },
        { name: 'CT' }
      ],
      'Mid': [
        { name: 'Mid' },
        { name: 'Top mid' },
        { name: 'Snake', notes: 'cobra entre mid e B' }
      ],
      'T Spawn': [{ name: 'T Spawn' }],
      'CT Spawn': [{ name: 'CT Spawn' }],
      'Conector': [{ name: 'Connector' }]
    }
  },
  {
    id: 'train',
    name: 'Train',
    pool: 'active',
    description: 'Reformulado em 2024. Pátio de trens, A com vagões e B com plataforma.',
    areas: {
      'A': [
        { name: 'A Site' },
        { name: 'Ivy', notes: 'parede com hera' },
        { name: 'Pop dog', notes: 'pop em popdog' },
        { name: 'Olof', notes: 'pulinho do Olofmeister' },
        { name: 'Halls', alias: ['corredores'] },
        { name: 'Z connector' }
      ],
      'B': [
        { name: 'B Site' },
        { name: 'Lower', alias: ['lower B'] },
        { name: 'Upper', alias: ['upper B'] },
        { name: 'Sandwich', notes: 'cantinho entre vagões' }
      ],
      'Mid': [
        { name: 'Mid' },
        { name: 'Ladder', alias: ['escada'] }
      ],
      'T Spawn': [{ name: 'T Spawn' }],
      'CT Spawn': [{ name: 'CT Spawn' }],
      'Conector': [{ name: 'T tunnels' }, { name: 'CT halls' }]
    }
  },
  {
    id: 'overpass',
    name: 'Overpass',
    pool: 'reserve',
    description: 'Mapa de passarela. Long, B no esgoto, A com Heaven.',
    areas: {
      'A': [
        { name: 'A Site' },
        { name: 'Long', alias: ['long A'] },
        { name: 'Bathrooms', alias: ['banheiros'] },
        { name: 'Heaven' },
        { name: 'Bank' }
      ],
      'B': [
        { name: 'B Site' },
        { name: 'Sewers', alias: ['esgoto'] },
        { name: 'Monster', alias: ['monstro'] },
        { name: 'Water' },
        { name: 'Short', alias: ['short B'] }
      ],
      'Mid': [
        { name: 'Connector' },
        { name: 'Playground', alias: ['playground'] }
      ],
      'T Spawn': [{ name: 'T Spawn' }],
      'CT Spawn': [{ name: 'CT Spawn' }],
      'Conector': [{ name: 'Connector' }]
    }
  }
];

export function findMap(id: string): CS2Map | null {
  return MAPS.find((m) => m.id === id) ?? null;
}
