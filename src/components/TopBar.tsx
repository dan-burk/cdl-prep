import type { ReactNode } from 'react'
import { IconButton } from './ui'

/** Signed out shows Log in; signed in (or no Firebase in local dev) shows Settings, which holds Log out */
export function TopBar({ title, onBack, onSettings, onLogin }: { title: ReactNode; onBack?: () => void; onSettings: () => void; onLogin?: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      {/* Same width and gutter as the page below; icon buttons pull out by their padding so the icons line up with the content edge */}
      <div className="mx-auto flex max-w-2xl items-center gap-1 px-4 py-2 sm:px-6">
        {onBack && (
          <IconButton label="Back" onClick={onBack} className="-ml-3">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden><path d="m15 18-6-6 6-6" /></svg>
          </IconButton>
        )}
        {!onBack && <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="mr-2 h-7 w-auto" />}
        <div className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</div>
        {onLogin ? (
          <button onClick={onLogin} className="btn-ghost -mr-2 min-h-11 px-3 text-text">Log in</button>
        ) : (
        <IconButton label="Settings" onClick={onSettings} className="-mr-2.5">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </IconButton>
        )}
      </div>
    </header>
  )
}
