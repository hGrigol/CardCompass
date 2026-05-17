import { useEffect, useState } from 'react'
import type { Card } from '../types/card'
import './LeaderSelect.css'

interface Props {
  allCards: Card[]
  onSelect: (leader: Card) => void
}

export default function LeaderSelect({ allCards, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const leaders = allCards.filter((c) => c.category === 'leader')

  const filtered = query.trim()
    ? leaders.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.types.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
        c.colors.some((col) => col.toLowerCase().includes(query.toLowerCase())) ||
        c.attribute.toLowerCase().includes(query.toLowerCase())
      )
    : leaders

  return (
    <div className="leader-select">
      <h1 className="leader-select-title">Leader wählen</h1>
      <p className="leader-select-hint">Wähle zuerst einen Leader — er bestimmt die erlaubten Farben.</p>
      <input
        className="search-input"
        placeholder="Name, Farbe oder Typ suchen..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      <div className="leader-grid">
        {filtered.map((card) => (
          <div key={card.id} className="leader-card" onClick={() => onSelect(card)}>
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className="leader-img" loading="lazy" />
            ) : (
              <div className="leader-img-placeholder">
                <span>{card.name}</span>
              </div>
            )}
            <div className="leader-card-footer">
              <span className="leader-card-name">{card.name}</span>
              <div className="leader-card-colors">
                {card.colors.map((c) => (
                  <span key={c} className={`color-dot color-${c}`} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
