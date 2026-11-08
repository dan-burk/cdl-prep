import type { Deck, DeckId } from './types'
import general from './decks/general.json'
import airBrakes from './decks/air-brakes.json'
import combination from './decks/combination.json'
// Manual page label ("5-2") -> PDF page number, read from the footers of the PDF below
import pdfPages from './decks/pdf-pages.json'

// The state site only serves the manual through a JavaScript page, so link a direct copy of the same 2025 PDF
export const MANUAL_PDF = 'https://tacinjurylaw.com/wp-content/uploads/2025/10/2025-cdl-manual-south-dakota.pdf'

export function manualLink(page: string) {
  const n = (pdfPages as Record<string, number>)[page]
  return n ? `${MANUAL_PDF}#page=${n}` : MANUAL_PDF
}

// Cards are written in our own words from the 2025 SD CDL Manual (AAMVA); each cites its section and page
export const DECKS: Deck[] = [
  { id: 'general', title: 'General Knowledge', test: '50-question test', sections: 'Sections 1–3', cards: general },
  { id: 'air-brakes', title: 'Air Brakes', test: '25-question test', sections: 'Section 5', cards: airBrakes },
  { id: 'combination', title: 'Combination Vehicles', test: '20-question test', sections: 'Section 6', cards: combination },
]

export const deckById = (id: DeckId) => DECKS.find(d => d.id === id)!
