import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import type { Progress } from './types'

// Public web config, injected at build time from repo Variables (or .env.local in dev)
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Without config (a fresh clone with no .env.local) the app still runs, just signed out
export const firebaseReady = Boolean(config.apiKey && config.projectId)
const app = firebaseReady ? initializeApp(config) : undefined
const auth = app && getAuth(app)
const db = app && getFirestore(app)
const functions = app && getFunctions(app, 'us-central1')

export function onUser(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

// Popup rather than redirect: redirects break when the site (github.io domain) and authDomain differ
export const signIn = () => auth && signInWithPopup(auth, new GoogleAuthProvider())
export const signOutUser = () => auth && signOut(auth)

/** One document per person: users/{uid} holds their card progress */
export async function loadProgress(uid: string): Promise<Progress> {
  if (!db) return {}
  const snap = await getDoc(doc(db, 'users', uid))
  return (snap.data()?.progress as Progress | undefined) ?? {}
}

export async function saveProgress(uid: string, progress: Progress) {
  if (!db) return
  // Whole-document write: merging would keep old cards after "Start over"
  await setDoc(doc(db, 'users', uid), { progress, updatedAt: serverTimestamp() })
}

// Talk mode. The xAI key lives only in the functions; the browser gets a short-lived token.
export interface TalkSession { token: string; expiresAt: number; sessionId: string }
export interface TranscriptLine { role: 'user' | 'tutor'; text: string }
export interface TopicStat { topic: string; seen: number; missed: number; example?: string }

export async function startTalk(): Promise<TalkSession> {
  if (!functions) throw new Error('Firebase not configured')
  return (await httpsCallable<void, TalkSession>(functions, 'session')()).data
}

export async function saveTalk(uid: string, sessionId: string, data: { transcript: TranscriptLine[]; stats?: TopicStat[]; ended?: boolean }) {
  if (!db) return
  const { ended, ...rest } = data
  await setDoc(doc(db, 'users', uid, 'sessions', sessionId), { ...rest, ...(ended && { endedAt: serverTimestamp() }) }, { merge: true })
}

/** Fire and forget: the summary is for the next talk, so nothing waits on it */
export function requestDebrief(sessionId: string) {
  if (!functions) return
  httpsCallable(functions, 'debrief')({ sessionId }).catch(err => console.error('Could not write debrief', err))
}

export async function recentDebriefs(uid: string, n = 3): Promise<string[]> {
  if (!db) return []
  const snap = await getDocs(query(collection(db, 'users', uid, 'debriefs'), orderBy('createdAt', 'desc'), limit(n)))
  return snap.docs.map(d => d.data().markdown as string).filter(Boolean)
}
