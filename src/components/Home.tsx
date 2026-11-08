import { DECKS } from '../decks'
import { deckStats } from '../srs'
import type { DeckId, Progress } from '../types'
import { ProgressBar, SpeakButton } from './ui'

const INTRO = 'Pick a Test to Study'

function whenNext(next: number) {
  const days = Math.ceil((next - Date.now()) / (24 * 60 * 60 * 1000))
  return days <= 1 ? 'tomorrow' : `in ${days} days`
}

export function Home({ progress, onStudy, onSpeak }: { progress: Progress; onStudy: (id: DeckId) => void; onSpeak: (text: string) => void }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="flex-1 text-2xl font-bold sm:text-3xl">{INTRO}</h1>
        {/* Reads the choices too, so he can pick without reading */}
        <SpeakButton onClick={() => onSpeak([INTRO, ...DECKS.map(d => d.title)].join('. '))} className="-mr-1" />
      </div>

      <div className="grid gap-4">
        {DECKS.map(deck => {
          const s = deckStats(deck.cards, progress)
          const todo = s.due + s.unseen
          return (
            <section key={deck.id} className="card p-5 sm:p-6">
              <h2 className="text-xl font-bold">{deck.title}</h2>
              <p className="text-muted">{deck.test}</p>
              <div className="mt-4">
                <ProgressBar value={s.learned} max={s.total} label={`${deck.title} cards learned`} />
                {/* Two numbers at most: more than that turns into a blur */}
                <div className="mt-2 flex flex-wrap justify-between gap-x-4 text-muted">
                  <span><b className="text-text">{s.learned}</b> of {s.total} learned</span>
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
        <p>Pass with 80%.</p>
        <p>
          Source: <a className="focus-ring rounded underline hover:text-text" href="https://dps.sd.gov/driver-licensing/commercial-drivers-license/cdl-manual" target="_blank" rel="noreferrer">2025 SD CDL Manual</a>.
        </p>
      </footer>
    </main>
  )
}
