import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { loadDecks, saveDeck } from '../services/storage'
import { fetchAllCards } from '../services/api'
import { useDeck } from '../hooks/useDeck'
import LeaderSelect from '../components/LeaderSelect'
import CardPreview from '../components/CardPreview'
import ManaCurve from '../components/ManaCurve'
import DeckStats from '../components/DeckStats'
import type { Card, CardColor } from '../types/card'
import type { Deck } from '../types/deck'
import { DECK_RULES } from '../types/deck'
import './DeckBuilderPage.css'

const CARD_MIN_WIDTH = 190 // wider cards → fewer per row

function createNewDeck(): Deck {
  return {
    id: crypto.randomUUID(),
    name: 'Neues Deck',
    leaderId: '',
    leaderColors: [],
    cards: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function sortCards(cards: Card[], leaderColors: CardColor[]): Card[] {
  return [...cards].sort((a, b) => {
    // Primary sort: which leader color does the card match first?
    const colorRank = (card: Card) => {
      for (let i = 0; i < leaderColors.length; i++) {
        if (card.colors.includes(leaderColors[i])) return i
      }
      return leaderColors.length
    }
    const colorDiff = colorRank(a) - colorRank(b)
    if (colorDiff !== 0) return colorDiff
    // Secondary sort: cost ascending (null treated as 0)
    return (a.cost ?? 0) - (b.cost ?? 0)
  })
}

function filterCards(cards: Card[], query: string): Card[] {
  const q = query.trim().toLowerCase()
  if (!q) return cards

  const asNumber = Number(q)
  if (q !== '' && !isNaN(asNumber) && Number.isInteger(asNumber)) {
    return cards.filter((c) => c.cost === asNumber)
  }

  return cards.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.types.some((t) => t.toLowerCase().includes(q)) ||
      c.attribute.toLowerCase().includes(q) ||
      c.effect.toLowerCase().includes(q),
  )
}

export default function DeckBuilderPage() {
  const { id } = useParams()
  const existingDeck = id ? loadDecks().find((d) => d.id === id) : undefined
  const { deck, setLeader, addCard, removeCard, cardCount } = useDeck(existingDeck ?? createNewDeck())

  const [allCards, setAllCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [colorFilter, setColorFilter] = useState<CardColor | null>(null)
  const [deckName, setDeckName] = useState(deck.name)
  const [preview, setPreview] = useState<Card | null>(null)
  const [mobileTab, setMobileTab] = useState<'cards' | 'deck' | 'info'>('cards')

  useEffect(() => {
    fetchAllCards()
      .then(setAllCards)
      .catch(() => setError('Karten konnten nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [])

  const leaderCard = allCards.find((c) => c.id === deck.leaderId)

  const playableCards = useMemo(() => {
    if (!deck.leaderId || deck.leaderColors.length === 0) return []
    const filtered = allCards.filter(
      (c) => c.category !== 'leader' && c.colors.some((col) => deck.leaderColors.includes(col)),
    )
    return sortCards(filtered, deck.leaderColors)
  }, [allCards, deck.leaderId, deck.leaderColors])

  const displayedCards = useMemo(() => {
    let cards = filterCards(playableCards, query)
    if (colorFilter) cards = cards.filter((c) => c.colors.includes(colorFilter))
    return cards
  }, [playableCards, query, colorFilter])

  const deckCardMap = new Map(deck.cards.map((e) => [e.cardId, e.count]))

  const curveEntries = useMemo(() =>
    deck.cards.flatMap((e) => {
      const card = allCards.find((c) => c.id === e.cardId)
      return card ? [{ card, count: e.count }] : []
    }),
  [deck.cards, allCards])

  const totalPrice = useMemo(() => {
    let sum = 0
    let hasAny = false
    if (leaderCard?.marketPrice != null) { sum += leaderCard.marketPrice; hasAny = true }
    for (const entry of deck.cards) {
      const card = allCards.find((c) => c.id === entry.cardId)
      if (card?.marketPrice != null) { sum += card.marketPrice * entry.count; hasAny = true }
    }
    return hasAny ? sum : null
  }, [deck.cards, allCards, leaderCard])

  // Virtualization — callback ref triggers re-render when element mounts
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)
  const scrollRef = useCallback((el: HTMLDivElement | null) => setScrollEl(el), [])
  const [columns, setColumns] = useState(4)

  useEffect(() => {
    if (!scrollEl) return
    const update = () => {
      setColumns(Math.max(2, Math.floor(scrollEl.clientWidth / CARD_MIN_WIDTH)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(scrollEl)
    return () => ro.disconnect()
  }, [scrollEl])


  const rows = useMemo(() => {
    const result: Card[][] = []
    for (let i = 0; i < displayedCards.length; i += columns) {
      result.push(displayedCards.slice(i, i + columns))
    }
    return result
  }, [displayedCards, columns])

  // Dynamic height estimate: card width = container / columns, height = width * 7/5 + gap
  const estimateSize = useCallback(() => {
    if (!scrollEl || columns === 0) return 260
    const cardWidth = (scrollEl.clientWidth - 40) / columns // 40px for padding
    return Math.round(cardWidth * (7 / 5)) + 10
  }, [scrollEl, columns])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollEl,
    estimateSize,
    overscan: 5,
    measureElement: (el) => el.getBoundingClientRect().height,
  })

  const handleNameBlur = useCallback(() => {
    const trimmed = deckName.trim()
    if (trimmed && trimmed !== deck.name) saveDeck({ ...deck, name: trimmed })
  }, [deckName, deck])

  if (loading) {
    return (
      <div className="builder-loading">
        <p>Lade alle Karten...</p>
        <p className="builder-loading-hint">Beim ersten Aufruf dauert das einen Moment.</p>
      </div>
    )
  }

  if (error) {
    return <div className="builder-loading"><p className="error-text">{error}</p></div>
  }

  if (!deck.leaderId) {
    return <LeaderSelect allCards={allCards} onSelect={setLeader} />
  }

  return (
    <>
    <div className="builder-layout">
      <div className={`builder-left${mobileTab === 'info' ? ' mobile-active' : ''}`}>
        {leaderCard?.imageUrl && (
          <img src={leaderCard.imageUrl} alt={leaderCard.name} className="leader-panel-img" />
        )}
        <ManaCurve entries={curveEntries} />
        <DeckStats entries={curveEntries} />
      </div>

      <div className={`builder-right${mobileTab === 'cards' ? ' mobile-active' : ''}`}>
        <div className="builder-toolbar">
          <input
            className="search-input"
            placeholder="Kosten (z.B. 4) oder Typ (z.B. Revolutionary Army)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {deck.leaderColors.length > 1 && (
            <div className="color-filter">
              {deck.leaderColors.map((c) => (
                <button
                  key={c}
                  className={`color-filter-btn color-filter-${c}${colorFilter === c ? ' active' : ''}`}
                  onClick={() => setColorFilter(colorFilter === c ? null : c)}
                  title={c.charAt(0).toUpperCase() + c.slice(1)}
                />
              ))}
            </div>
          )}
          <span className="results-count">{displayedCards.length} Karten</span>
        </div>

        <div className="builder-scroll" ref={scrollRef}>
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vRow) => (
              <div
                key={vRow.key}
                data-index={vRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: vRow.start,
                  left: 0,
                  right: 0,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: '0.6rem',
                  padding: '0 1.25rem 0.6rem',
                }}
              >
                {rows[vRow.index].map((card) => {
                  const count = deckCardMap.get(card.id) ?? 0
                  const maxed = count >= DECK_RULES.MAX_COPIES
                  return (
                    <div
                      key={card.id}
                      className={`card-item${maxed ? ' card-maxed' : ''}`}
                      onClick={() => !maxed && addCard(card)}
                      onMouseEnter={() => setPreview(card)}
                      onMouseLeave={() => setPreview(null)}
                    >
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.name} className="card-img" loading="lazy" />
                      ) : (
                        <div className="card-img-placeholder">{card.name}</div>
                      )}
                      {count > 0 && <span className="card-badge">x{count}</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className={`builder-sidebar${mobileTab === 'deck' ? ' mobile-active' : ''}`}>
        <div className="leader-colors">
          {deck.leaderColors.map((c) => (
            <span key={c} className={`color-dot color-${c}`} />
          ))}
        </div>

        <input
          className="deck-name-input"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          onBlur={handleNameBlur}
        />

        <p className="sidebar-count">
          <span className={cardCount >= DECK_RULES.NON_LEADER_CARDS ? 'count-complete' : ''}>
            {cardCount + 1}
          </span>{' '}
          / 51 Karten
          {totalPrice != null && (
            <span className="sidebar-total-price"> · ${totalPrice.toFixed(2)}</span>
          )}
        </p>

        <div className="sidebar-cards">
          {deck.cards.map((entry) => {
            const card = allCards.find((c) => c.id === entry.cardId)
            return (
              <div
                key={entry.cardId}
                className="sidebar-entry"
                onMouseEnter={() => card && setPreview(card)}
                onMouseLeave={() => setPreview(null)}
              >
                {card && (
                  <div className="entry-stats">
                    {card.cost !== null && (
                      <span className={`entry-cost-circle color-${card.colors[0] ?? ''}`}>
                        {card.cost}
                      </span>
                    )}
                    {card.power !== null && <span className="entry-stat-power">{(card.power / 1000).toFixed(0)}k</span>}
                  </div>
                )}
                <div className="entry-thumb-wrap">
                  {card?.imageUrl ? (
                    <img src={card.imageUrl} alt={card.name} className="entry-thumb" />
                  ) : (
                    <div className="entry-thumb-placeholder" />
                  )}
                </div>
                <div className="entry-info">
                  <span className="entry-name">{card?.name ?? entry.cardId}</span>
                  {card?.marketPrice != null && (
                    <span className="entry-price">${card.marketPrice.toFixed(2)}</span>
                  )}
                </div>
                <div className="entry-actions">
                  <span className="entry-count">{entry.count}</span>
                  <div className="entry-buttons">
                    <button
                      className="entry-add"
                      onClick={() => card && addCard(card)}
                      disabled={entry.count >= DECK_RULES.MAX_COPIES || cardCount >= DECK_RULES.NON_LEADER_CARDS}
                    >+</button>
                    <button className="entry-remove" onClick={() => removeCard(entry.cardId)}>−</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      <nav className="mobile-tabs">
        <button className={mobileTab === 'cards' ? 'active' : ''} onClick={() => setMobileTab('cards')}>🃏 Karten</button>
        <button className={mobileTab === 'deck'  ? 'active' : ''} onClick={() => setMobileTab('deck')}>📋 Deck <span className="mobile-tab-count">{cardCount + 1}</span></button>
        <button className={mobileTab === 'info'  ? 'active' : ''} onClick={() => setMobileTab('info')}>📊 Info</button>
      </nav>
    </div>

    {preview && <CardPreview card={preview} />}
    </>
  )
}
