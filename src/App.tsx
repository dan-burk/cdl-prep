import type { User } from 'firebase/auth'
import { useCallback, useEffect, useState } from 'react'
import { LoginModal } from './components/Auth'
import { Home } from './components/Home'
import { SettingsPanel } from './components/SettingsPanel'
import { Study } from './components/Study'
import { TopBar } from './components/TopBar'
import { deckById } from './decks'
import { firebaseReady, loadProgress, onUser, saveProgress, signIn, signOutUser } from './firebase'
import { speak as say, stopSpeaking, useVoices } from './speech'
import { mergeProgress } from './srs'
import { load, save } from './storage'
import type { DeckId, Progress, Settings } from './types'

const DEFAULT_SETTINGS: Settings = { rate: 0.9, autoRead: true, voice: '' }

export default function App() {
  const [deckId, setDeckId] = useState<DeckId | null>(null)
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
  }
  const deck = deckId && deckById(deckId)

  const login = async () => {
    setLoginError(null)
    try {
      await signIn()
      setShowLogin(false)
    } catch (err) {
      // Closing the Google popup isn't an error worth showing
      if ((err as { code?: string }).code !== 'auth/popup-closed-by-user') setLoginError("Couldn't sign in. Try again.")
    }
  }
  const openLogin = () => {
    setLoginError(null)
    setShowLogin(true)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar title={deck ? deck.title : 'CDL Prep'} onBack={deck ? exit : undefined} onSettings={() => setShowSettings(true)} onLogin={firebaseReady && !user ? openLogin : undefined} />
      {deck
        ? <Study key={deck.id} deck={deck} progress={progress} onProgress={setProgress} settings={settings} speak={speak} onExit={exit} />
        : <Home progress={progress} onStudy={setDeckId} onSpeak={speak} />}
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
