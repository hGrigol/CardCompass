import type { Card } from '../types/card'
import './DeckStats.css'

interface Entry { card: Card; count: number }

interface Props {
  entries: Entry[]
}

function CounterIcon({ value, color }: { value: string; color: string }) {
  return (
    <span className="counter-icon" style={{ background: color }}>
      {value}
    </span>
  )
}

export default function DeckStats({ entries }: Props) {
  let counter2k = 0
  let counter1k = 0
  let bricks = 0
  let events = 0
  let stages = 0

  for (const { card, count } of entries) {
    if (card.category === 'event') {
      events += count
    } else if (card.category === 'stage') {
      stages += count
    } else if (card.counter === 2000) {
      counter2k += count
    } else if (card.counter === 1000) {
      counter1k += count
    } else {
      bricks += count
    }
  }

  const rows = [
    { icon: <CounterIcon value="2k" color="var(--color-green)" />, label: '2k Counter', value: counter2k, color: 'var(--color-green)' },
    { icon: <CounterIcon value="1k" color="var(--color-blue)" />,  label: '1k Counter', value: counter1k, color: 'var(--color-blue)' },
    { icon: <span className="deck-stats-emoji">🧱</span>,           label: 'Brick',      value: bricks,    color: 'var(--color-red)' },
    { icon: <span className="deck-stats-emoji">⚡</span>,           label: 'Event',      value: events,    color: 'var(--color-purple)' },
    ...(stages > 0 ? [{ icon: <span className="deck-stats-emoji">🏟️</span>, label: 'Stage', value: stages, color: 'var(--color-yellow)' }] : []),
  ]

  return (
    <div className="deck-stats">
      <p className="deck-stats-title">Kartentypen</p>
      {rows.map(({ icon, label, value, color }) => (
        <div key={label} className="deck-stats-row">
          {icon}
          <span className="deck-stats-label">{label}</span>
          <span className="deck-stats-bar-wrap">
            <span
              className="deck-stats-bar"
              style={{ width: `${(value / 50) * 100}%`, background: color }}
            />
          </span>
          <span className="deck-stats-value">{value}</span>
        </div>
      ))}
    </div>
  )
}
