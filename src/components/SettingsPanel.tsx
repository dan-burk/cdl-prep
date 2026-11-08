import { useEffect, useRef, useState } from 'react'
import { canSpeak } from '../speech'
import type { Settings } from '../types'
import { IconButton, RadioGroup } from './ui'

const RATES = [0.75, 0.9, 1, 1.15]
const RATE_NAMES: Record<number, string> = { 0.75: 'Slow', 0.9: 'Steady', 1: 'Normal', 1.15: 'Fast' }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="label">{label}</div>
      {children}
    </div>
  )
}

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
  voices: SpeechSynthesisVoice[]
  speak: (text: string) => void
  onReset: () => void
  onClose: () => void
  onLogout?: () => void
}

export function SettingsPanel({ settings, onChange, voices, speak, onReset, onClose, onLogout }: Props) {
  const [confirmReset, setConfirmReset] = useState(false)
  const dialog = useRef<HTMLDivElement>(null)
  // Move focus into the dialog once, on open, so keyboard and screen reader users land in it
  useEffect(() => dialog.current?.focus(), [])
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        ref={dialog}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-border bg-surface p-5 outline-none pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-card sm:rounded-lg sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Settings</h2>
          <IconButton label="Close settings" onClick={onClose}>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </IconButton>
        </div>

        <div className="space-y-6">
          {canSpeak ? (
            <>
              <RadioGroup label="Read aloud" options={['on', 'off']} value={settings.autoRead ? 'on' : 'off'}
                onChange={v => set('autoRead', v === 'on')} render={v => (v === 'on' ? 'Always' : 'On tap')} />

              <RadioGroup label="Speed" options={RATES} value={settings.rate} onChange={v => set('rate', v)} render={r => RATE_NAMES[r]} />

              <Row label="Voice">
                <div className="flex gap-2">
                  <select
                    aria-label="Voice"
                    value={settings.voice}
                    onChange={e => set('voice', e.target.value)}
                    className="focus-ring min-h-11 min-w-0 flex-1 rounded-lg bg-surface-2 px-3 text-text"
                  >
                    <option value="">Best available</option>
                    {voices.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                  </select>
                  <button onClick={() => speak('Check your mirrors every 5 to 8 seconds.')} className="btn-outline min-h-11">Test</button>
                </div>
              </Row>
            </>
          ) : (
            <p className="rounded-lg bg-bad-soft p-3 text-bad">No read-aloud here. Use Chrome, Edge or Safari.</p>
          )}

          <Row label="Progress">
            {confirmReset ? (
              <div className="flex gap-2">
                <button onClick={() => { onReset(); setConfirmReset(false) }} className="btn min-h-11 flex-1 border border-bad/40 text-bad hover:bg-bad-soft">Erase all</button>
                <button onClick={() => setConfirmReset(false)} className="btn-ghost min-h-11 flex-1">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)} className="btn-ghost min-h-11 -ml-3 px-3 text-bad hover:text-bad">Start over</button>
            )}
          </Row>
        </div>

        {onLogout && (
          <div className="mt-6 flex justify-end border-t border-border pt-4">
            <button onClick={onLogout} className="btn-ghost -mr-3 min-h-11 px-3 text-bad hover:text-bad">Log out</button>
          </div>
        )}
      </div>
    </div>
  )
}
