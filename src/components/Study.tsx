import confetti from 'canvas-confetti'
import { useCallback, useEffect, useRef, useState } from 'react'
import { buildSession, grade, RETRY_GAP, SESSION_SIZE } from '../srs'
import { manualLink } from '../decks'
import type { Deck, Progress, Settings } from '../types'
import { CheckIcon, CrossIcon, ProgressBar, SpeakButton } from './ui'

// 28px keeps ~22 letters a line on a phone; 1.4 line height gives the lines room
const CARD_TEXT = 'text-[1.75rem] leading-[1.4] sm:text-4xl sm:leading-[1.4]'

interface Props {
  deck: Deck
  progress: Progress
  onProgress: (p: Progress) => void
  settings: Settings
  speak: (text: string) => void
  onExit: () => void
}

/** Weakest cards first, for studying after everything is caught up */
function practiceSession(deck: Deck, progress: Progress) {
  return [...deck.cards]
    .sort((a, b) => (progress[a.id]?.box ?? 0) - (progress[b.id]?.box ?? 0) || (progress[b.id]?.missed ?? 0) - (progress[a.id]?.missed ?? 0))
    .slice(0, SESSION_SIZE)
    .map(c => c.id)
}

/** A small burst from the Got it button; skipped for people who turn off motion */
function celebrate(from: HTMLElement | null) {
  const r = from?.getBoundingClientRect()
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 35,
    ticks: 120,
    origin: r ? { x: (r.left + r.width / 2) / innerWidth, y: r.top / innerHeight } : { x: 0.5, y: 0.9 },
    disableForReducedMotion: true,
  })
}

function newSession(deck: Deck, progress: Progress) {
  const ids = buildSession(deck.cards, progress)
  return ids.length ? ids : practiceSession(deck, progress)
}

export function Study({ deck, progress, onProgress, settings, speak, onExit }: Props) {
  const [queue, setQueue] = useState(() => newSession(deck, progress))
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [missedIds, setMissedIds] = useState<Set<string>>(new Set())
  const gotItRef = useRef<HTMLButtonElement>(null)

  const done = i >= queue.length
  const card = done ? undefined : deck.cards.find(c => c.id === queue[i])
  const uniqueCount = new Set(queue).size

  const readCard = useCallback(() => {
    if (!card) return
    speak(revealed ? [card.back, card.why].filter(Boolean).join('. ') : card.front)
  }, [card, revealed, speak])

  useEffect(() => {
    if (settings.autoRead) readCard()
  }, [readCard, settings.autoRead])

  const answer = useCallback((gotIt: boolean) => {
    if (!card) return
    onProgress(grade(progress, card.id, gotIt))
    if (gotIt) celebrate(gotItRef.current)
    if (!gotIt) {
      // Bring it back a few cards later so it gets repeated while it's fresh
      setMissedIds(s => new Set(s).add(card.id))
      setQueue(q => [...q.slice(0, i + 1 + RETRY_GAP), card.id, ...q.slice(i + 1 + RETRY_GAP)])
    }
    setRevealed(false)
    setI(n => n + 1)
  }, [card, i, onProgress, progress])

  // Keyboard on a computer: Space shows the answer, arrows grade, R reads again
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || (e.target instanceof HTMLElement && e.target.closest('button, select, input'))) return
      if (e.key === 'r' || e.key === 'R') readCard()
      else if (!revealed && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); setRevealed(true) }
      else if (revealed && (e.key === 'ArrowLeft' || e.key === '1')) answer(false)
      else if (revealed && (e.key === 'ArrowRight' || e.key === '2')) answer(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer, done, readCard, revealed])

  const restart = () => {
    setQueue(newSession(deck, progress))
    setI(0)
    setRevealed(false)
    setMissedIds(new Set())
  }

  if (!card) {
    const firstTry = uniqueCount - missedIds.size
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="text-5xl" aria-hidden>🚛</div>
        <h1 className="mt-4 text-3xl font-bold">Nice work!</h1>
        <p className="mt-3 text-xl">First try: <b>{firstTry} of {uniqueCount}</b></p>
        {missedIds.size > 0 && <p className="mt-1 text-xl text-muted">Missed cards come back first.</p>}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={restart} className="btn-outline h-11 px-6">Study more</button>
          <button onClick={onExit} className="btn-ghost h-11 px-6">Back</button>
        </div>
      </main>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1"><ProgressBar value={i} max={queue.length} label="Session progress" /></div>
          <span className="shrink-0 tabular-nums text-muted">{i + 1} / {queue.length}</span>
        </div>

        <article className="card flex flex-1 flex-col p-5 sm:p-8" aria-live="polite">
          <div className="flex items-start gap-3">
            <p className={`flex-1 font-semibold tracking-wide ${CARD_TEXT}`}>
              {missedIds.has(card.id) && <span className="label mb-1 block text-base tracking-normal">Try again</span>}
              {card.front}
            </p>
            <SpeakButton onClick={readCard} title="Read aloud (R)" className="-mr-1 -mt-1" />
          </div>

          {revealed && (
            <div className="mt-6 border-t border-border pt-5">
              <span className="label">Answer</span>
              <p className={`mt-1 font-bold tracking-wide text-accent ${CARD_TEXT}`}>{card.back}</p>
              {card.why && <p className="mt-4 text-xl leading-relaxed text-muted">{card.why}</p>}
            </div>
          )}

          {card.page && (
            <p className="mt-auto pt-6">
              <a href={manualLink(card.page)} target="_blank" rel="noreferrer" className="focus-ring rounded text-muted underline hover:text-text">
                Manual page {card.page}
              </a>
            </p>
          )}
        </article>
      </main>

      <footer className="sticky bottom-0 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {/* On a computer each button shows its key underneath; phones hide the keys */}
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
          {!revealed ? (
            <button onClick={() => setRevealed(true)} className="btn h-14 w-full flex-col gap-1 bg-accent text-lg text-accent-fg hover:bg-accent/90 sm:h-16">
              Show answer
              <kbd className="kbd">Space</kbd>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => answer(false)} className="btn h-14 flex-col gap-1 border border-bad/40 text-lg text-bad hover:bg-bad-soft sm:h-16">
                <span className="flex items-center gap-2"><CrossIcon /> Missed it</span>
                <kbd className="kbd">←</kbd>
              </button>
              <button ref={gotItRef} onClick={() => answer(true)} className="btn h-14 flex-col gap-1 border border-good/40 text-lg text-good hover:bg-good-soft sm:h-16">
                <span className="flex items-center gap-2"><CheckIcon /> Got it</span>
                <kbd className="kbd">→</kbd>
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
