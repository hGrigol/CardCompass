import type { Deck } from '../types/deck';

const DECKS_KEY = 'cardcompass_decks';

export function loadDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    return raw ? (JSON.parse(raw) as Deck[]) : [];
  } catch {
    return [];
  }
}

export function saveDeck(deck: Deck): void {
  const decks = loadDecks();
  const index = decks.findIndex((d) => d.id === deck.id);
  if (index >= 0) {
    decks[index] = deck;
  } else {
    decks.push(deck);
  }
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function deleteDeck(id: string): void {
  const decks = loadDecks().filter((d) => d.id !== id);
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}
