import { DECKS, MANUAL_PDF } from '../decks'
import { deckStats } from '../srs'
import type { DeckId, Progress } from '../types'
import { MicIcon, ProgressBar } from './ui'

const INTRO = 'Pick a Test to Study'

function whenNext(next: number) {
  const days = Math.ceil((next - Date.now()) / (24 * 60 * 60 * 1000))
  return days <= 1 ? 'tomorrow' : `in ${days} days`
}

export function Home({ progress, onStudy, onTalk }: { progress: Progress; onStudy: (id: DeckId) => void; onTalk?: () => void }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Voice tutor first; hidden without Firebase, since it needs sign-in and the server */}
      {onTalk && (
        <button onClick={onTalk} className="btn-outline mb-8 h-12 w-full px-6 sm:w-auto"><MicIcon /> Speak with Customized AI Tutor!</button>
      )}

      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{INTRO}</h1>

      <div className="grid gap-4">
        {DECKS.map(deck => {
          const s = deckStats(deck.cards, progress)
          const todo = s.due + s.unseen
          return (
            <section key={deck.id} className="card p-5 sm:p-6">
              <h2 className="text-xl font-bold">{deck.title}</h2>
              <p className="text-muted">{deck.test}</p>
              <div className="mt-4">
                <ProgressBar value={s.learned} max={s.total} label={`${deck.title} questions covered`} />
                {/* Two numbers at most: more than that turns into a blur */}
                <div className="mt-2 flex flex-wrap justify-between gap-x-4 text-muted">
                  <span><b className="text-text">{s.learned}</b> of {s.total} questions covered</span>
                  <span>{todo > 0 ? <><b className="text-text">{todo}</b> to study</> : <>Next review {whenNext(s.next)}</>}</span>
                </div>
              </div>
              <button onClick={() => onStudy(deck.id)} className="btn-outline mt-5 h-11 px-6">
                {todo > 0 ? 'Study' : 'Practice'}
              </button>
            </section>
          )
        })}
      </div>

      <footer className="mt-10 space-y-1 text-muted">
        <p>Real tests need 80% to pass.</p>
        <p>
          Source: <a className="focus-ring rounded underline hover:text-text" href={MANUAL_PDF} target="_blank" rel="noreferrer">2025 SD CDL Manual</a>.
        </p>
      </footer>
    </main>
  )
}
