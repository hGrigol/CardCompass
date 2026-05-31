import { useState } from 'react'
import { Link } from 'react-router-dom'
import NewDeckModal from './NewDeckModal'
import './Navbar.css'

export default function Navbar() {
  const [showNewDeck, setShowNewDeck] = useState(false)

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          CardCompass
        </Link>
        <div className="navbar-actions">
          <button className="btn-primary" onClick={() => setShowNewDeck(true)}>
            + Neues Deck
          </button>
        </div>
      </nav>

      {showNewDeck && <NewDeckModal onClose={() => setShowNewDeck(false)} />}
    </>
  )
}
