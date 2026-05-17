import { useState, useCallback } from 'react';
import type { Deck, DeckEntry } from '../types/deck';
import type { Card } from '../types/card';
import { DECK_RULES } from '../types/deck';
import { saveDeck } from '../services/storage';

function totalCards(deck: Deck): number {
  return deck.cards.reduce((sum, e) => sum + e.count, 0);
}

export function useDeck(initial: Deck) {
  const [deck, setDeck] = useState<Deck>(initial);

  const setLeader = useCallback((leader: Card) => {
    setDeck((prev) => {
      const updated: Deck = {
        ...prev,
        leaderId: leader.id,
        leaderColors: leader.colors,
        cards: [],
        updatedAt: new Date().toISOString(),
      };
      saveDeck(updated);
      return updated;
    });
  }, []);

  const addCard = useCallback((card: Card): { ok: boolean; reason?: string } => {
    if (card.category === 'leader') return { ok: false, reason: 'Leader kann nicht als normale Karte hinzugefügt werden.' };

    let reason: string | undefined;

    setDeck((prev) => {
      if (totalCards(prev) >= DECK_RULES.NON_LEADER_CARDS) {
        reason = 'Deck ist voll (49 Karten).';
        return prev;
      }
      const existing = prev.cards.find((e) => e.cardId === card.id);
      if (existing && existing.count >= DECK_RULES.MAX_COPIES) {
        reason = `Maximal ${DECK_RULES.MAX_COPIES} Kopien erlaubt.`;
        return prev;
      }
      const cards: DeckEntry[] = [...prev.cards];
      const idx = cards.findIndex((e) => e.cardId === card.id);
      if (idx >= 0) {
        cards[idx] = { ...cards[idx], count: cards[idx].count + 1 };
      } else {
        cards.push({ cardId: card.id, count: 1 });
      }
      const updated = { ...prev, cards, updatedAt: new Date().toISOString() };
      saveDeck(updated);
      return updated;
    });

    return reason ? { ok: false, reason } : { ok: true };
  }, []);

  const removeCard = useCallback((cardId: string) => {
    setDeck((prev) => {
      const cards: DeckEntry[] = prev.cards
        .map((e) => (e.cardId === cardId ? { ...e, count: e.count - 1 } : e))
        .filter((e) => e.count > 0);
      const updated = { ...prev, cards, updatedAt: new Date().toISOString() };
      saveDeck(updated);
      return updated;
    });
  }, []);

  const cardCount = totalCards(deck);
  const isComplete = cardCount === DECK_RULES.NON_LEADER_CARDS;

  return { deck, setLeader, addCard, removeCard, cardCount, isComplete };
}
