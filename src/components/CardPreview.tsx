import { createPortal } from 'react-dom'
import type { Card } from '../types/card'
import './CardPreview.css'

interface Props {
  card: Card
}

export default function CardPreview({ card }: Props) {
  return createPortal(
    <div className="card-preview-backdrop">
      <div className="card-preview">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="card-preview-img" />
        ) : (
          <div className="card-preview-placeholder">{card.name}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
