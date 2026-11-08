import type { User } from 'firebase/auth'
import { useCallback, useEffect, useState } from 'react'
import { LoginModal } from './components/Auth'
import { Home } from './components/Home'
import { SettingsPanel } from './components/SettingsPanel'
import { Study } from './components/Study'
import { Talk } from './components/Talk'
import { TopBar } from './components/TopBar'
import { deckById } from './decks'
import { firebaseReady, loadProgress, onUser, saveProgress, signIn, signOutUser } from './firebase'
import { speak as say, stopSpeaking, useVoices } from './speech'
import { mergeProgress } from './srs'
import { unlockAudio } from './talk/audio'
import { load, save } from './storage'
import type { DeckId, Progress, Settings } from './types'

const DEFAULT_SETTINGS: Settings = { rate: 0.9, autoRead: true, voice: '' }

export default function App() {
  const [deckId, setDeckId] = useState<DeckId | null>(null)
  const [talking, setTalking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<Settings>(() => load('cdl.settings', DEFAULT_SETTINGS))
  const [progress, setProgress] = useState<Progress>(() => load('cdl.progress', {}))
  const [user, setUser] = useState<User | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  // The uid whose account copy has been merged in; saving waits for it so a stale device copy can't overwrite the account
  const [syncedUid, setSyncedUid] = useState<string | null>(null)
  const voices = useVoices()

  useEffect(() => save('cdl.settings', settings), [settings])
  useEffect(() => save('cdl.progress', progress), [progress])

  useEffect(() => onUser(u => {
    setUser(u)
    setSyncedUid(null)
    if (!u) return
    loadProgress(u.uid)
      .then(remote => {
        setProgress(local => mergeProgress(local, remote))
        setSyncedUid(u.uid)
      })
      .catch(err => console.error('Could not load progress', err))
  }), [])

  useEffect(() => {
    if (!user || syncedUid !== user.uid) return
    // Batch rapid answers into one write
    const t = setTimeout(() => saveProgress(user.uid, progress).catch(err => console.error('Could not save progress', err)), 1500)
    return () => clearTimeout(t)
  }, [progress, user, syncedUid])

  const speak = useCallback(
    (text: string) => say(text, { rate: settings.rate, voice: settings.voice, voices }),
    [settings.rate, settings.voice, voices],
  )

  const exit = () => {
    stopSpeaking()
    setDeckId(null)
    setTalking(false)
  }
  const deck = deckId && deckById(deckId)

  const login = async () => {
    setLoginError(null)
    try {
      await signIn()
      setShowLogin(false)
    } catch (err) {
      // Closing the Google popup isn't an error worth showing
      const code = (err as { code?: string }).code ?? 'unknown'
      console.error('Sign-in failed', err)
      if (code !== 'auth/popup-closed-by-user') setLoginError(code === 'auth/popup-blocked' ? 'Allow pop-ups for this site, then try again.' : `Couldn't sign in (${code}).`)
    }
  }
  const openLogin = () => {
    setLoginError(null)
    setShowLogin(true)
  }
  const talk = () => {
    if (!user) return openLogin()
    stopSpeaking()
    // In the tap itself, so iPhone Safari allows the tutor's audio
    unlockAudio()
    setTalking(true)
  }
  const inTalk = talking && user

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar title={deck ? deck.title : inTalk ? 'Talk' : 'CDL Prep'} onBack={deck || inTalk ? exit : undefined} onSettings={() => setShowSettings(true)} onLogin={firebaseReady && !user ? openLogin : undefined} />
      {deck
        ? <Study key={deck.id} deck={deck} progress={progress} onProgress={setProgress} settings={settings} speak={speak} onExit={exit} />
        : inTalk
          ? <Talk uid={user.uid} progress={progress} onProgress={setProgress} />
          : <Home progress={progress} onStudy={setDeckId} onTalk={firebaseReady ? talk : undefined} />}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          voices={voices}
          speak={speak}
          onReset={() => setProgress({})}
          onLogout={user ? () => { setShowSettings(false); signOutUser() } : undefined}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showLogin && <LoginModal onGoogle={login} onClose={() => setShowLogin(false)} error={loginError} />}
    </div>
  )
}
