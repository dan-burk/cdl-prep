import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { setGlobalOptions } from 'firebase-functions/v2'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions'

initializeApp()
const db = getFirestore()
const XAI_API_KEY = defineSecret('XAI_API_KEY')

// One person uses this; a low ceiling keeps a runaway loop from spending the xAI credit
setGlobalOptions({ region: 'us-central1', maxInstances: 3 })

/** 6 talks of 10 minutes = 60 minutes a day per person */
const DAILY_SESSIONS_PER_USER = 6
/** Across everyone, since sign-in is open to any Google account */
const DAILY_SESSIONS_TOTAL = 12
const TOKEN_SECONDS = 300
/** The live site and local dev only */
const CORS = ['https://danielburkhalter.dev', 'http://localhost:3000']
const DEBRIEF_MODEL = 'grok-4.3'

// South Dakota is mostly Central time, so the daily limit resets at his midnight, not UTC's
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())

function requireUid(auth: { uid: string } | undefined) {
  if (!auth) throw new HttpsError('unauthenticated', 'Log in first.')
  return auth.uid
}

export const session = onCall({ secrets: [XAI_API_KEY], cors: CORS }, async req => {
  const uid = requireUid(req.auth)
  const day = today()
  const usage = db.doc(`usage/${uid}_${day}`)
  const total = db.doc(`usage/_all_${day}`)

  await db.runTransaction(async tx => {
    const [mine, all] = await Promise.all([tx.get(usage), tx.get(total)])
    const count = (mine.data()?.count as number | undefined) ?? 0
    const allCount = (all.data()?.count as number | undefined) ?? 0
    if (count >= DAILY_SESSIONS_PER_USER) throw new HttpsError('resource-exhausted', 'Daily limit reached. Try again tomorrow.')
    if (allCount >= DAILY_SESSIONS_TOTAL) throw new HttpsError('resource-exhausted', 'Daily limit reached. Try again tomorrow.')
    const now = FieldValue.serverTimestamp()
    tx.set(usage, { uid, count: count + 1, updatedAt: now }, { merge: true })
    tx.set(total, { count: allCount + 1, updatedAt: now }, { merge: true })
  })

  let secret: { value: string; expires_at: number }
  try {
    const res = await fetch('https://api.x.ai/v1/realtime/client_secrets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${XAI_API_KEY.value()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expires_after: { seconds: TOKEN_SECONDS } }),
    })
    if (!res.ok) throw new Error(`client_secrets ${res.status}: ${await res.text()}`)
    secret = await res.json() as typeof secret
  } catch (err) {
    // A failed mint shouldn't use up one of his talks
    const back = { count: FieldValue.increment(-1) }
    await Promise.all([usage.update(back), total.update(back)])
    logger.error('Could not mint xAI client secret', err)
    throw new HttpsError('unavailable', 'Could not connect. Try again.')
  }

  const ref = await db.collection(`users/${uid}/sessions`).add({ startedAt: FieldValue.serverTimestamp() })
  return { token: secret.value, expiresAt: secret.expires_at, sessionId: ref.id }
})

interface Line { role: 'user' | 'tutor'; text: string }
interface TopicStat { topic: string; seen: number; missed: number; example?: string }

const LIST = { type: 'array', items: { type: 'string' } }
const DEBRIEF_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    misunderstandings: LIST,
    whatWorked: LIST,
    tryNext: LIST,
    strongTopics: LIST,
    weakTopics: LIST,
  },
  required: ['summary', 'misunderstandings', 'whatWorked', 'tryNext', 'strongTopics', 'weakTopics'],
  additionalProperties: false,
}
type Debrief = { summary: string; misunderstandings: string[]; whatWorked: string[]; tryNext: string[]; strongTopics: string[]; weakTopics: string[] }

const SYSTEM = `You review a voice tutoring session for someone studying for the South Dakota Class A CDL permit tests. He has dyslexia.
Write for the next tutor session, which will read this before starting. Be specific and brief: short plain sentences, at most 4 items per list.
summary: 1-2 sentences. misunderstandings: what he got wrong or mixed up, and what he said. whatWorked: explanations or memory hooks that clicked.
tryNext: what the next session should do. strongTopics / weakTopics: topic names in plain words (not section numbers).`

async function chat(key: string, messages: object[], responseFormat: object) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: DEBRIEF_MODEL, reasoning_effort: 'none', messages, response_format: responseFormat }),
  })
  if (!res.ok) throw new Error(`chat ${res.status}: ${await res.text()}`)
  const body = await res.json() as { choices: { message: { content: string } }[] }
  return body.choices[0].message.content
}

function parse(text: string): Debrief {
  // The plain-JSON fallback may wrap the object in a code fence
  const raw = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as Partial<Debrief>
  const list = (v: unknown) => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : [])
  return {
    summary: typeof raw.summary === 'string' ? raw.summary : '',
    misunderstandings: list(raw.misunderstandings),
    whatWorked: list(raw.whatWorked),
    tryNext: list(raw.tryNext),
    strongTopics: list(raw.strongTopics),
    weakTopics: list(raw.weakTopics),
  }
}

function markdown(d: Debrief) {
  const section = (title: string, items: string[]) => (items.length ? `\n## ${title}\n${items.map(i => `- ${i}`).join('\n')}\n` : '')
  return [
    d.summary,
    section('Mixed up', d.misunderstandings),
    section('What worked', d.whatWorked),
    section('Try next', d.tryNext),
    section('Strong', d.strongTopics),
    section('Weak', d.weakTopics),
  ].join('\n').trim()
}

export const debrief = onCall({ secrets: [XAI_API_KEY], cors: CORS }, async req => {
  const uid = requireUid(req.auth)
  const sessionId = (req.data as { sessionId?: unknown })?.sessionId
  if (typeof sessionId !== 'string' || !/^[A-Za-z0-9]{1,40}$/.test(sessionId)) throw new HttpsError('invalid-argument', 'Bad session.')

  const out = db.doc(`users/${uid}/debriefs/${sessionId}`)
  if ((await out.get()).exists) return { ok: true }

  const snap = await db.doc(`users/${uid}/sessions/${sessionId}`).get()
  if (!snap.exists) throw new HttpsError('not-found', 'No session.')
  const transcript = ((snap.data()?.transcript as Line[] | undefined) ?? []).filter(l => l && typeof l.text === 'string')
  if (!transcript.some(l => l.role === 'user')) return { ok: true, skipped: true }
  const stats = ((snap.data()?.stats as TopicStat[] | undefined) ?? []).slice(0, 40)

  // The client writes the transcript, so cap it rather than trust its size
  const talk = transcript.map(l => `${l.role === 'user' ? 'Student' : 'Tutor'}: ${l.text.slice(0, 500)}`).join('\n').slice(-30000)
  const misses = stats
    .filter(s => s.seen > 0)
    .map(s => `- ${s.example ?? s.topic}: missed ${s.missed} of ${s.seen}`)
    .join('\n')
  const user = `Transcript:\n${talk}\n\nMiss rates by topic (example question shown):\n${misses || '(none yet)'}`

  const key = XAI_API_KEY.value()
  let result: Debrief
  try {
    result = parse(await chat(key, [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }], {
      type: 'json_schema',
      json_schema: { name: 'debrief', schema: DEBRIEF_SCHEMA, strict: true },
    }))
  } catch (err) {
    logger.warn('Structured debrief failed, retrying as plain JSON', err)
    const fallback = `${SYSTEM}\nReply with only a JSON object with keys summary (string) and misunderstandings, whatWorked, tryNext, strongTopics, weakTopics (arrays of strings).`
    try {
      result = parse(await chat(key, [{ role: 'system', content: fallback }, { role: 'user', content: user }], { type: 'json_object' }))
    } catch (err2) {
      logger.error('Debrief failed', err2)
      throw new HttpsError('internal', 'Could not write the summary.')
    }
  }

  await out.set({ ...result, markdown: markdown(result), createdAt: FieldValue.serverTimestamp() })
  return { ok: true }
})
