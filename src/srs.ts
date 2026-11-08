import type { Card, CardState, Progress } from './types'

const DAY = 24 * 60 * 60 * 1000
/** Days to wait before a card in each box comes back. Box 0 = new or missed. */
const WAIT_DAYS = [0, 1, 3, 7, 14, 30]
export const TOP_BOX = WAIT_DAYS.length - 1
/** A card counts as learned once it has been right 3 times in a row on different days */
export const LEARNED_BOX = 3

export const SESSION_SIZE = 20
/** A missed card comes back this many cards later in the same session */
export const RETRY_GAP = 3

const fresh = (): CardState => ({ box: 0, due: 0, seen: 0, missed: 0 })

export function grade(progress: Progress, id: string, gotIt: boolean, now = Date.now()): Progress {
  const s = progress[id] ?? fresh()
  const box = gotIt ? Math.min(s.box + 1, TOP_BOX) : 0
  return {
    ...progress,
    // Spread first so talk-mode notes survive a flashcard answer
    [id]: { ...s, box, due: now + WAIT_DAYS[box] * DAY, seen: s.seen + 1, missed: s.missed + (gotIt ? 0 : 1) },
  }
}

/** Cards due for review first (oldest first), then new cards in manual order */
export function buildSession(cards: Card[], progress: Progress, now = Date.now()): string[] {
  const due = cards
    .filter(c => progress[c.id] && progress[c.id].due <= now)
    .sort((a, b) => progress[a.id].due - progress[b.id].due)
  const fresh = cards.filter(c => !progress[c.id])
  return [...due, ...fresh].slice(0, SESSION_SIZE).map(c => c.id)
}

export function deckStats(cards: Card[], progress: Progress, now = Date.now()) {
  let learned = 0, due = 0, unseen = 0
  for (const c of cards) {
    const s = progress[c.id]
    if (!s) unseen++
    else {
      if (s.box >= LEARNED_BOX) learned++
      if (s.due <= now) due++
    }
  }
  // When nothing is due yet, the earliest card to come back
  const next = Math.min(...cards.map(c => progress[c.id]?.due ?? Infinity))
  return { total: cards.length, learned, due, unseen, next }
}

/** Combine two copies of progress (this device and the account), keeping whichever has seen each card more */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const out: Progress = { ...a }
  for (const [id, s] of Object.entries(b)) {
    const mine = out[id]
    if (!mine || s.seen > mine.seen || (s.seen === mine.seen && s.due > mine.due)) out[id] = s
  }
  return out
}
