import { useEffect, useRef, useState } from 'react'

export interface Account {
  user: { name: string; photoURL: string | null } | null
  onLogin: () => void
  onLogout: () => void
}

/** Top-bar login, laid out like dairytranslate's: a Login button, or the person's photo and name with a Logout menu */
export function AuthButton({ account }: { account: Account }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const { user } = account
  if (!user) {
    return (
      <button onClick={account.onLogin} className="btn min-h-11 bg-accent px-4 text-accent-fg hover:bg-accent/90">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
        </svg>
        Login
      </button>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={`Account: ${user.name}`}
        className="focus-ring flex min-h-11 items-center gap-2 rounded-lg px-2 transition-colors hover:bg-surface-2"
      >
        {user.photoURL
          ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-7 w-7 rounded-full" />
          : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent">{user.name[0]?.toUpperCase()}</span>}
        <span className="hidden max-w-[10rem] truncate sm:inline">{user.name}</span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <button
            onClick={() => { setOpen(false); account.onLogout() }}
            className="flex min-h-11 w-full items-center gap-2 px-4 text-left hover:bg-surface-2"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

/** Google-only version of dairytranslate's login modal */
export function LoginModal({ onGoogle, onClose, error }: { onGoogle: () => void; onClose: () => void; error: string | null }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="login-title" onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-lg bg-surface p-8 shadow-card">
        <h2 id="login-title" className="mb-2 text-center text-2xl font-bold">Sign in to continue</h2>
        <p className="mb-6 text-center text-muted">Saves progress on every device.</p>

        {error && <p className="mb-4 rounded-lg border border-bad bg-bad-soft p-3 text-bad">{error}</p>}

        <button onClick={onGoogle} className="btn min-h-12 w-full gap-3 border border-border bg-surface text-text hover:bg-surface-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <button onClick={onClose} className="btn mt-4 min-h-11 w-full text-muted hover:text-text">Cancel</button>
      </div>
    </div>
  )
}
