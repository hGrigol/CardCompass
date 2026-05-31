import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadDecks, deleteDeck } from '../services/storage'
import NewDeckModal from '../components/NewDeckModal'
import type { Deck } from '../types/deck'
import './HomePage.css'

export default function HomePage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [showNewDeck, setShowNewDeck] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setDecks(loadDecks())
  }, [])

  function handleDelete(id: string) {
    deleteDeck(id)
    setDecks(loadDecks())
  }

  function handleCopy(e: React.MouseEvent, deck: Deck) {
    e.stopPropagation()
    const leader = deck.leaderId ? `1x${deck.leaderId}` : ''
    const rest = deck.cards.map((c) => `${c.count}x${c.cardId}`).join('\n')
    const text = [leader, rest].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="home-page">
      <h1 className="home-title">Meine Decks</h1>

      {decks.length === 0 ? (
        <div className="home-empty">
          <p>Noch keine Decks gespeichert.</p>
          <button className="btn-primary" onClick={() => setShowNewDeck(true)}>
            Erstes Deck erstellen
          </button>
        </div>
      ) : (
        <div className="deck-grid">
          {decks.map((deck) => (
            <div key={deck.id} className="deck-card" onClick={() => navigate(`/deck/${deck.id}`)}>
              <div className="deck-card-colors">
                {deck.leaderColors.map((c) => (
                  <span key={c} className={`color-dot color-${c}`} />
                ))}
              </div>
              <h2 className="deck-card-name">{deck.name}</h2>
              <p className="deck-card-count">
                {deck.cards.reduce((s, e) => s + e.count, 0) + 1} / 51 Karten
              </p>
              <div className="deck-card-actions">
                <button
                  className="deck-card-copy"
                  onClick={(e) => handleCopy(e, deck)}
                  title="Deckliste kopieren"
                >
                  📋
                </button>
                <button
                  className="deck-card-delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(deck.id) }}
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewDeck && <NewDeckModal onClose={() => setShowNewDeck(false)} />}
    </div>
  )
}
