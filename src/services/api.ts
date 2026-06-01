import type { Card, CardCategory, CardColor } from '../types/card';

const BASE = 'https://www.optcgapi.com/api';
const CACHE_KEY = 'cardcompass_cards_v5';

interface OptcgCard {
  card_set_id: string;
  card_name: string;
  card_type: string;
  card_color: string;
  card_cost: string | null;
  card_power: string | null;
  life: string | null;
  counter_amount: number | null;
  card_image: string;
  set_id: string;
  set_name: string;
  rarity: string;
  attribute: string;
  sub_types: string;
  card_text: string;
  market_price: number | null;
  inventory_price: number | null;
}

function parseColors(raw: string): CardColor[] {
  const map: Record<string, CardColor> = {
    red: 'red', blue: 'blue', green: 'green',
    purple: 'purple', black: 'black', yellow: 'yellow',
  };
  return raw
    .split(' ')
    .map((w) => map[w.toLowerCase()])
    .filter((c): c is CardColor => !!c);
}

function parseCategory(raw: string): CardCategory {
  switch (raw.toLowerCase()) {
    case 'leader': return 'leader';
    case 'event': return 'event';
    case 'stage': return 'stage';
    default: return 'character';
  }
}

function mapCard(raw: OptcgCard): Card {
  return {
    id: raw.card_set_id,
    name: raw.card_name,
    category: parseCategory(raw.card_type),
    colors: parseColors(raw.card_color ?? ''),
    cost: raw.card_cost ? parseInt(raw.card_cost, 10) : null,
    power: raw.card_power ? parseInt(raw.card_power, 10) : null,
    life: raw.life && raw.life !== 'NULL' ? parseInt(raw.life, 10) : null,
    counter: raw.counter_amount ?? null,
    imageUrl: raw.card_image ?? '',
    set: raw.set_id,
    setName: raw.set_name,
    rarity: raw.rarity,
    attribute: raw.attribute ?? '',
    types: raw.sub_types ? raw.sub_types.split(' ').filter(Boolean) : [],
    effect: raw.card_text ?? '',
    marketPrice: raw.market_price ?? null,
    inventoryPrice: raw.inventory_price ?? null,
  };
}

function isAltArt(raw: OptcgCard): boolean {
  return raw.card_name.includes('(Alternate Art)') ||
         raw.card_name.includes('(Alt Art)') ||
         /_(p|alt)\d*\.jpg$/i.test(raw.card_image);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

export async function fetchAllCards(): Promise<Card[]> {
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) return JSON.parse(cached) as Card[];

  const results = await Promise.allSettled([
    fetchJson<OptcgCard[]>(`${BASE}/allSetCards/`),
    fetchJson<OptcgCard[]>(`${BASE}/allSTCards/`),
  ]);

  const seen = new Map<string, OptcgCard>();
  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const raw of result.value) {
      const existing = seen.get(raw.card_set_id);
      if (!existing) { seen.set(raw.card_set_id, raw); continue; }
      const existingAlt = isAltArt(existing);
      const rawAlt = isAltArt(raw);
      // prefer base over alt art; if equal, prefer cheaper
      if ((existingAlt && !rawAlt) ||
          (existingAlt === rawAlt && (raw.market_price ?? Infinity) < (existing.market_price ?? Infinity))) {
        seen.set(raw.card_set_id, raw);
      }
    }
  }
  const cards = Array.from(seen.values()).map(mapCard);

  sessionStorage.setItem(CACHE_KEY, JSON.stringify(cards));
  return cards;
}
