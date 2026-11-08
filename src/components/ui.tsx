import type { ReactNode } from 'react'

interface RadioGroupProps<T extends string | number> {
  label: string
  options: T[]
  value: T
  onChange: (value: T) => void
  render?: (option: T) => ReactNode
}

/** Plain native radios: quieter than button groups, and every row is still a 44px tap target */
export function RadioGroup<T extends string | number>({ label, options, value, onChange, render }: RadioGroupProps<T>) {
  return (
    <fieldset>
      <legend className="label mb-1">{label}</legend>
      <div className="flex flex-wrap gap-x-6">
        {options.map(option => (
          <label key={option} className="flex min-h-11 cursor-pointer items-center gap-2">
            <input
              type="radio"
              name={label}
              checked={option === value}
              onChange={() => onChange(option)}
              className="focus-ring h-5 w-5 cursor-pointer accent-accent"
            />
            {render ? render(option) : option}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** `behind` draws a lighter second fill under the main one (covered under learned) */
export function ProgressBar({ value, max, label, behind }: { value: number; max: number; label: string; behind?: number }) {
  const pct = (n: number) => `${max ? (n / max) * 100 : 0}%`
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="relative h-2.5 overflow-hidden rounded-full bg-surface-2">
      {behind !== undefined && <div className="absolute inset-y-0 left-0 rounded-full bg-accent/25 transition-[width] motion-reduce:transition-none" style={{ width: pct(behind) }} />}
      <div className="relative h-full rounded-full bg-accent transition-[width] motion-reduce:transition-none" style={{ width: pct(value) }} />
    </div>
  )
}

function Icon({ className = 'h-6 w-6', strokeWidth = 1.75, children }: { className?: string; strokeWidth?: number; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}

export const SpeakerIcon = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></Icon>
)
export const MicIcon = () => (
  <Icon className="h-5 w-5"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Icon>
)
export const CheckIcon = () => <Icon className="h-5 w-5" strokeWidth={2}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>
export const CrossIcon = () => <Icon className="h-5 w-5" strokeWidth={2}><path d="M6 6l12 12M18 6 6 18" /></Icon>

/** Same look and words everywhere, so he learns one "hear it" button */
export function SpeakButton({ onClick, title = 'Read aloud', className = '' }: { onClick: () => void; title?: string; className?: string }) {
  return (
    <button onClick={onClick} aria-label="Read aloud" title={title} className={`btn h-11 w-11 shrink-0 p-0 text-accent hover:bg-accent-soft ${className}`}>
      <SpeakerIcon />
    </button>
  )
}

export function IconButton({ label, onClick, className = '', children }: { label: string; onClick: () => void; className?: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text motion-reduce:transition-none ${className}`}
    >
      {children}
    </button>
  )
}
