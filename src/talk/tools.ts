import { DECKS } from '../decks'
import type { TopicStat } from '../firebase'
import { buildSession, grade, RETRY_GAP } from '../srs'
import type { Card, DeckId, Progress } from '../types'

const ALL: (Card & { deck: string; deckId: DeckId })[] = DECKS.flatMap(d => d.cards.map(c => ({ ...c, deck: d.title, deckId: d.id })))
const byId = new Map(ALL.map(c => [c.id, c]))
const NOTES_KEPT = 3

const topic = (c: Card & { deck: string }) => (c.section ? `${c.deck}, section ${c.section}` : c.deck)

/** Tool definitions for session.update (flat shape, per xAI's voice agent guide) */
export const TOOLS = [
  {
    type: 'function',
    name: 'next_card',
    description: 'Get the next question to ask. Call this before every question.',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', enum: ['general', 'air-brakes', 'combination', 'any'], description: 'The test he chose to study' },
      },
      required: [],
    },
  },
  {
    type: 'function',
    name: 'record_answer',
    description: 'Save whether his answer was right. Call once per question, right after he answers.',
    parameters: {
      type: 'object',
      properties: {
        card_id: { type: 'string', description: 'The card_id from next_card' },
        correct: { type: 'boolean' },
        heard: { type: 'string', description: 'What he said, in a few words' },
        note: { type: 'string', description: 'If wrong: a short note on what he mixed up' },
      },
      required: ['card_id', 'correct'],
    },
  },
  {
    type: 'function',
    name: 'weak_spots',
    description: 'The questions he misses most, with notes on what he said.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
]

/**
 * Same order the flashcards use (due first, then new), across all three tests.
 * Skips the last few asked so a miss comes back a little later, not right away.
 */
export function nextCard(progress: Progress, recent: string[], deck?: string) {
  const avoid = new Set(recent.slice(-RETRY_GAP))
  const pool = ALL.filter(c => !deck || deck === 'any' || c.deckId === deck)
  const queue = buildSession(pool, progress).filter(id => !avoid.has(id))
  // Everything caught up: practice the weakest
  const id = queue[0] ?? [...pool]
    .filter(c => !avoid.has(c.id))
    .sort((a, b) => (progress[a.id]?.box ?? 0) - (progress[b.id]?.box ?? 0) || (progress[b.id]?.missed ?? 0) - (progress[a.id]?.missed ?? 0))[0]?.id
  const c = id ? byId.get(id) : undefined
  if (!c) return { error: 'No questions left' }
  return { card_id: c.id, question: c.front, answer: c.back, why: c.why ?? '', topic: topic(c) }
}

export function recordAnswer(progress: Progress, args: { card_id?: string; correct?: boolean; heard?: string; note?: string }) {
  const id = args.card_id ?? ''
  if (!byId.has(id)) return { progress, result: { error: 'Unknown card_id' } }
  const correct = args.correct === true
  let next = grade(progress, id, correct)
  const said = (args.note || args.heard || '').trim().slice(0, 140)
  if (!correct && said) {
    const s = next[id]
    next = { ...next, [id]: { ...s, notes: [...(s.notes ?? []), said].slice(-NOTES_KEPT) } }
  }
  return { progress: next, result: { ok: true } }
}

export function weakSpots(progress: Progress, n = 5) {
  return ALL
    .filter(c => (progress[c.id]?.missed ?? 0) > 0)
    .sort((a, b) => progress[b.id].missed - progress[a.id].missed || progress[a.id].box - progress[b.id].box)
    .slice(0, n)
    .map(c => ({ question: c.front, answer: c.back, missed: progress[c.id].missed, seen: progress[c.id].seen, notes: progress[c.id].notes ?? [] }))
}

/**
 * What the tutor offers to cover first: the test with his most misses, else the first test with questions left.
 * Also says how much it knows about him, for the opening line.
 */
export function opening(progress: Progress, debriefCount: number) {
  const misses = new Map<DeckId, number>()
  for (const c of ALL) misses.set(c.deckId, (misses.get(c.deckId) ?? 0) + (progress[c.id]?.missed ?? 0))
  const worst = [...misses].sort((a, b) => b[1] - a[1])[0]
  const deck = worst && worst[1] > 0
    ? DECKS.find(d => d.id === worst[0])!
    : DECKS.find(d => buildSession(d.cards, progress).length > 0) ?? DECKS[0]
  const history = debriefCount > 0 ? 'notes' : Object.keys(progress).length > 0 ? 'practice' : 'none'
  return { topic: deck.id, title: deck.title, history } as const
}

/** Miss rate per manual section, for the debrief; the function can't read the decks itself */
export function topicStats(progress: Progress): TopicStat[] {
  const out = new Map<string, TopicStat>()
  for (const c of ALL) {
    const s = progress[c.id]
    if (!s) continue
    const key = topic(c)
    const t = out.get(key) ?? { topic: key, seen: 0, missed: 0, example: c.front }
    t.seen += s.seen
    t.missed += s.missed
    out.set(key, t)
  }
  return [...out.values()]
}
