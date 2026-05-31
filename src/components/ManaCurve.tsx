import type { Card } from '../types/card'
import './ManaCurve.css'

interface Entry { card: Card; count: number }

interface Props {
  entries: Entry[]
}

const MAX_COST = 9

export default function ManaCurve({ entries }: Props) {
  const buckets: number[] = Array(MAX_COST + 1).fill(0)
  for (const { card, count } of entries) {
    const cost = card.cost ?? 0
    const idx = Math.min(cost, MAX_COST)
    buckets[idx] += count
  }

  const max = Math.max(...buckets, 1)

  return (
    <div className="mana-curve">
      <p className="mana-curve-title">Kostenverteilung</p>
      <div className="mana-curve-bars">
        {buckets.map((count, cost) => (
          <div key={cost} className="mana-curve-col">
            <span className="mana-curve-count">{count > 0 ? count : ''}</span>
            <div
              className="mana-curve-bar"
              style={{ height: `${(count / max) * 100}%` }}
            />
            <span className="mana-curve-label">{cost === MAX_COST ? `${MAX_COST}+` : cost}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
