import { Link, useNavigate } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        CardCompass
      </Link>
      <div className="navbar-actions">
        <button className="btn-primary" onClick={() => navigate('/deck/new')}>
          + Neues Deck
        </button>
      </div>
    </nav>
  )
}
