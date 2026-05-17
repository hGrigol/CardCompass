export type CardColor = 'red' | 'blue' | 'green' | 'purple' | 'black' | 'yellow';

export type CardCategory = 'leader' | 'character' | 'event' | 'stage';

export interface Card {
  id: string;
  name: string;
  category: CardCategory;
  colors: CardColor[];
  cost: number | null;
  power: number | null;
  life: number | null;
  counter: number | null;
  imageUrl: string;
  set: string;
  setName: string;
  rarity: string;
  attribute: string;
  types: string[];
  effect: string;
  marketPrice: number | null;
  inventoryPrice: number | null;
}
