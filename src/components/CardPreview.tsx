import { createPortal } from 'react-dom'
import type { Card } from '../types/card'
import './CardPreview.css'

interface Props {
  card: Card
  rect: DOMRect
}

const PREVIEW_W = 260
const OFFSET = 12

export default function CardPreview({ card, rect }: Props) {
  const spaceRight = window.innerWidth - rect.right
  const x = spaceRight >= PREVIEW_W + OFFSET
    ? rect.right + OFFSET
    : rect.left - PREVIEW_W - OFFSET
  const y = Math.max(8, Math.min(rect.top, window.innerHeight - 420))

  return createPortal(
    <div className="card-preview" style={{ left: x, top: y }}>
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} className="card-preview-img" />
      ) : (
        <div className="card-preview-placeholder">{card.name}</div>
      )}
      {card.effect && <p className="card-preview-effect">{card.effect}</p>}
    </div>,
    document.body,
  )
}
