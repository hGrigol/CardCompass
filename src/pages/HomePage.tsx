import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadDecks, deleteDeck } from '../services/storage'
import type { Deck } from '../types/deck'
import './HomePage.css'

export default function HomePage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    setDecks(loadDecks())
  }, [])

  function handleDelete(id: string) {
    deleteDeck(id)
    setDecks(loadDecks())
  }

  return (
    <div className="home-page">
      <h1 className="home-title">Meine Decks</h1>

      {decks.length === 0 ? (
        <div className="home-empty">
          <p>Noch keine Decks gespeichert.</p>
          <button className="btn-primary" onClick={() => navigate('/deck/new')}>
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
                {deck.cards.reduce((s, e) => s + e.count, 0) + 1} / 50 Karten
              </p>
              <button
                className="deck-card-delete"
                onClick={(e) => { e.stopPropagation(); handleDelete(deck.id) }}
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
