import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DeckBuilderPage from './pages/DeckBuilderPage'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/deck/new" element={<DeckBuilderPage />} />
          <Route path="/deck/:id" element={<DeckBuilderPage />} />
        </Routes>
      </main>
    </div>
  )
}
