import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveDeck } from '../services/storage'
import { fetchAllCards } from '../services/api'
import type { Deck } from '../types/deck'
import type { Card } from '../types/card'
import './ImportModal.css'

interface Props {
  onClose: () => void
}

interface ParsedEntry { cardId: string; count: number }
interface ValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  leader?: Card
  entries?: ParsedEntry[]
}

function parseDecklist(text: string): ParsedEntry[] | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const entries: ParsedEntry[] = []
  for (const line of lines) {
    const match = line.match(/^(\d+)x([A-Za-z0-9-]+)$/i)
    if (!match) return null
    entries.push({ count: parseInt(match[1], 10), cardId: match[2].toUpperCase() })
  }
  return entries
}

function validate(entries: ParsedEntry[], allCards: Card[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const cardMap = new Map(allCards.map((c) => [c.id, c]))

  const notFound = entries.filter((e) => !cardMap.has(e.cardId))
  if (notFound.length > 0)
    warnings.push(`Nicht in Datenbank: ${notFound.map((e) => e.cardId).join(', ')}`)

  const known = entries.filter((e) => cardMap.has(e.cardId))
  const leaderEntries = known.filter((e) => cardMap.get(e.cardId)!.category === 'leader')
  const nonLeaderEntries = known.filter((e) => cardMap.get(e.cardId)!.category !== 'leader')

  if (leaderEntries.length === 0) errors.push('Kein Leader gefunden.')
  else if (leaderEntries.length > 1)
    errors.push(`Mehrere Leader: ${leaderEntries.map((e) => `${e.cardId} (${cardMap.get(e.cardId)!.name})`).join(', ')}`)
  else if (leaderEntries[0].count !== 1)
    errors.push(`Leader muss genau 1x vorkommen (gefunden: ${leaderEntries[0].count}x).`)

  const totalNonLeader =
    nonLeaderEntries.reduce((s, e) => s + e.count, 0) + notFound.reduce((s, e) => s + e.count, 0)
  if (totalNonLeader !== 50)
    errors.push(`50 Karten erwartet (ohne Leader), gefunden: ${totalNonLeader}.`)

  for (const entry of nonLeaderEntries)
    if (entry.count > 4)
      errors.push(`${cardMap.get(entry.cardId)!.name}: max. 4 Kopien (gefunden: ${entry.count}x).`)

  if (errors.length > 0) return { ok: false, errors, warnings }

  const leader = cardMap.get(leaderEntries[0].cardId)!
  for (const entry of nonLeaderEntries) {
    const card = cardMap.get(entry.cardId)!
    if (!card.colors.some((col) => leader.colors.includes(col)))
      errors.push(`${card.name} (${entry.cardId}): Farbe passt nicht zum Leader.`)
  }

  if (errors.length > 0) return { ok: false, errors, warnings }
  return { ok: true, errors: [], warnings, leader, entries: [...nonLeaderEntries, ...notFound] }
}

type Tab = 'new' | 'import'

export default function NewDeckModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('new')
  const [name, setName] = useState('')

  // Import state
  const [importText, setImportText] = useState('')
  const [allCards, setAllCards] = useState<Card[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [parseError, setParseError] = useState(false)

  const navigate = useNavigate()

  function handleTabChange(t: Tab) {
    setTab(t)
    if (t === 'import' && allCards.length === 0) {
      setCardsLoading(true)
      fetchAllCards().then(setAllCards).catch(() => {}).finally(() => setCardsLoading(false))
    }
  }

  function handleCreate() {
    const deck: Deck = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Neues Deck',
      leaderId: '',
      leaderColors: [],
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveDeck(deck)
    onClose()
    navigate(`/deck/${deck.id}`)
  }

  function handleCheck() {
    const entries = parseDecklist(importText)
    if (!entries) { setParseError(true); setResult(null); return }
    setParseError(false)
    setResult(validate(entries, allCards))
  }

  function handleImport() {
    if (!result?.ok || !result.leader || !result.entries) return
    const deck: Deck = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Importiertes Deck',
      leaderId: result.leader.id,
      leaderColors: result.leader.colors,
      cards: result.entries.map((e) => ({ cardId: e.cardId, count: e.count })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveDeck(deck)
    onClose()
    navigate(`/deck/${deck.id}`)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Neues Deck</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab${tab === 'new' ? ' active' : ''}`}
            onClick={() => handleTabChange('new')}
          >Manuell erstellen</button>
          <button
            className={`modal-tab${tab === 'import' ? ' active' : ''}`}
            onClick={() => handleTabChange('import')}
          >Aus Clipboard importieren</button>
        </div>

        <input
          className="modal-name-input"
          placeholder="Deckname (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && tab === 'new') handleCreate() }}
          autoFocus
          maxLength={60}
        />

        {tab === 'new' && (
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
            <button className="btn-primary" onClick={handleCreate}>Erstellen</button>
          </div>
        )}

        {tab === 'import' && (
          <>
            <p className="modal-hint">Format: <code>4xOP01-002</code> pro Zeile. Leader mit <code>1x</code>.</p>

            <textarea
              className="modal-textarea"
              placeholder={'1xOP01-001\n4xOP01-002\n...'}
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setResult(null); setParseError(false) }}
              spellCheck={false}
            />

            {parseError && (
              <p className="modal-error">Ungültiges Format — jede Zeile muss <code>NxKARTEN-ID</code> sein.</p>
            )}

            {result && (
              <div className="modal-result">
                {result.warnings.map((w, i) => <p key={i} className="modal-warning">⚠ {w}</p>)}
                {result.errors.map((e, i) => <p key={i} className="modal-error">✕ {e}</p>)}
                {result.ok && result.leader && (
                  <p className="modal-success">✓ Gültig — Leader: <strong>{result.leader.name}</strong></p>
                )}
              </div>
            )}

            <div className="modal-actions">
              {cardsLoading && <span className="modal-loading">Lade Kartendatenbank...</span>}
              <button className="btn-secondary" onClick={handleCheck} disabled={!importText.trim() || cardsLoading}>
                Prüfen
              </button>
              <button className="btn-primary" onClick={handleImport} disabled={!result?.ok}>
                Importieren
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
