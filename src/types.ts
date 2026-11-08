export interface Card {
  id: string
  section?: string
  page?: string
  front: string
  back: string
  why?: string
  /** From a manual "Test Your Knowledge" box, which says these questions may be on the test */
  tyk?: boolean
}

export type DeckId = 'general' | 'air-brakes' | 'combination'

export interface Deck {
  id: DeckId
  title: string
  /** What the real permit test looks like, e.g. "50-question test" */
  test: string
  /** Manual sections the deck covers, e.g. "Sections 1–3" */
  sections: string
  cards: Card[]
}

/** Leitner box for one card. Box 0 is new or just missed; higher boxes wait longer before coming back. */
export interface CardState {
  box: number
  due: number
  seen: number
  missed: number
  /** Talk mode: what he said on his last few misses, so the tutor can see the pattern */
  notes?: string[]
}

export type Progress = Record<string, CardState>

export interface Settings {
  rate: number
  autoRead: boolean
  /** speechSynthesis voice name; empty means pick a good English voice automatically */
  voice: string
}
