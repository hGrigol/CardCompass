import type { CardColor } from './card';

export interface DeckEntry {
  cardId: string;
  count: number;
}

export interface Deck {
  id: string;
  name: string;
  leaderId: string;
  leaderColors: CardColor[];
  cards: DeckEntry[];
  createdAt: string;
  updatedAt: string;
}

export const DECK_RULES = {
  TOTAL_CARDS: 50,
  NON_LEADER_CARDS: 49,
  MAX_COPIES: 4,
} as const;
