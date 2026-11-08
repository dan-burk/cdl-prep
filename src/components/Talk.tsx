import { useCallback, useEffect, useRef, useState } from 'react'
import { recentDebriefs, requestDebrief, saveTalk, startTalk, type TranscriptLine } from '../firebase'
import { Player, startMic, unlockAudio } from '../talk/audio'
import { buildInstructions, WRAP_UP } from '../talk/prompt'
import { VoiceTutor } from '../talk/realtime'
import { nextCard, opening, recordAnswer, TOOLS, topicStats, weakSpots } from '../talk/tools'
import type { Progress } from '../types'

const LENGTH = 600
const WRAP_AT = 540
const SAVE_EVERY = 30_000

type Phase = 'connecting' | 'listening' | 'speaking' | 'done' | 'error'

interface Props {
  uid: string
  progress: Progress
  onProgress: (p: Progress) => void
}

function errorText(err: unknown) {
  const e = err as { name?: string; code?: string }
  if (e.name === 'NotAllowedError' || e.name === 'SecurityError') return 'Mic blocked. Allow it in your browser settings.'
  if (e.name === 'NotFoundError') return 'No mic found.'
  if (e.code === 'functions/resource-exhausted') return 'Daily limit reached. Try again tomorrow.'
  return "Couldn't connect. Try again."
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function Talk({ uid, progress, onProgress }: Props) {
  const [phase, setPhase] = useState<Phase>('connecting')
  const [error, setError] = useState('')
  const [left, setLeft] = useState(LENGTH)

  // Tools run from socket callbacks, so they read and write progress through a ref that is always current
  const progressRef = useRef(progress)
  progressRef.current = progress
  const stopRef = useRef<() => void>()

  const start = useCallback(async () => {
    setPhase('connecting')
    setError('')
    setLeft(LENGTH)
    const ctx = unlockAudio()
    const transcript: TranscriptLine[] = []
    const recent: string[] = []
    let sessionId = ''
    let ended = false
    let stopMic: (() => void) | undefined
    let timer: number | undefined
    let saver: number | undefined

    const player = new Player(ctx, playing => !ended && setPhase(playing ? 'speaking' : 'listening'))
    const tutor = new VoiceTutor({
      onAudio: b64 => player.push(b64),
      onBargeIn: () => player.flush(),
      onLine: line => transcript.push(line),
      onClose: unexpected => finish(unexpected ? "Couldn't connect. Try again." : ''),
      onTool: (name, args) => {
        if (name === 'next_card') {
          const card = nextCard(progressRef.current, recent, typeof args.topic === 'string' ? args.topic : undefined)
          if (card.card_id) recent.push(card.card_id)
          return card
        }
        if (name === 'record_answer') {
          const { progress: next, result } = recordAnswer(progressRef.current, args)
          progressRef.current = next
          onProgress(next)
          return result
        }
        if (name === 'weak_spots') return weakSpots(progressRef.current)
        return { error: `Unknown tool ${name}` }
      },
    })

    const save = (final = false) => {
      if (!sessionId) return
      saveTalk(uid, sessionId, { transcript, ...(final && { stats: topicStats(progressRef.current), ended: true }) })
        .then(() => final && requestDebrief(sessionId))
        .catch(err => console.error('Could not save talk', err))
    }

    function finish(message = '') {
      if (ended) return
      ended = true
      clearInterval(timer)
      clearInterval(saver)
      stopMic?.()
      player.flush()
      tutor.close()
      save(true)
      setError(message)
      setPhase(message ? 'error' : 'done')
    }
    stopRef.current = () => finish()

    try {
      // Mic first, so a blocked mic doesn't use up one of today's talks
      stopMic = await startMic(ctx, b64 => tutor.appendAudio(b64))
      if (ended) return stopMic()
      const [session, debriefs] = await Promise.all([startTalk(), recentDebriefs(uid).catch(() => [])])
      if (ended) return
      sessionId = session.sessionId
      await tutor.connect(session.token, { instructions: buildInstructions(debriefs, weakSpots(progressRef.current), opening(progressRef.current, debriefs.length)), tools: TOOLS })
      if (ended) return tutor.close()
    } catch (err) {
      finish(errorText(err))
      return
    }

    setPhase('listening')
    const began = Date.now()
    let warned = false
    timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - began) / 1000)
      setLeft(Math.max(0, LENGTH - elapsed))
      if (!warned && elapsed >= WRAP_AT) {
        warned = true
        tutor.instruct(WRAP_UP)
      }
      if (elapsed >= LENGTH) finish()
    }, 1000)
    saver = window.setInterval(() => save(), SAVE_EVERY)
  }, [onProgress, uid])

  useEffect(() => {
    // Deferred a tick so React's dev double-mount doesn't open two talks
    const t = setTimeout(start, 0)
    return () => {
      clearTimeout(t)
      stopRef.current?.()
    }
  }, [start])

  const live = phase === 'listening' || phase === 'speaking'
  const status = { connecting: 'Connecting…', listening: 'Listening', speaking: 'Speaking', done: 'Done', error: '' }[phase]

  const retry = () => {
    // Inside the tap, so iPhone lets audio start
    unlockAudio()
    start()
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center sm:px-6">
      {phase === 'error' ? (
        <p role="alert" className="text-xl text-bad">{error}</p>
      ) : (
        <div aria-live="polite" className="flex items-center gap-3 text-2xl font-semibold">
          {phase !== 'done' && (
            <span aria-hidden className={`h-3 w-3 rounded-full ${phase === 'speaking' ? 'bg-accent' : phase === 'listening' ? 'bg-good' : 'bg-border'} ${phase === 'connecting' ? 'motion-safe:animate-pulse' : ''}`} />
          )}
          {status}
        </div>
      )}

      {live && <p className="tabular-nums text-muted" aria-label="Time left">{clock(left)}</p>}

      {live || phase === 'connecting' ? (
        <button onClick={() => stopRef.current?.()} className="btn h-14 w-full max-w-xs bg-accent text-lg text-accent-fg hover:bg-accent/90">Stop</button>
      ) : (
        <button onClick={retry} className="btn-outline h-11 px-6">{phase === 'done' ? 'Again' : 'Try again'}</button>
      )}
    </main>
  )
}
