import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'
import type { Severity, Tier } from '../types'

export const SEVERITY_META: Record<
  Severity,
  { label: string; glyph: string; className: string; blocking: string }
> = {
  CRITICAL: {
    label: 'Critical',
    glyph: '✕',
    className: 'badge--critical',
    blocking: 'Blocks locking',
  },
  WARNING: {
    label: 'Warning',
    glyph: '!',
    className: 'badge--warning',
    blocking: 'Can be overridden with a reason',
  },
  INFO: {
    label: 'Info',
    glyph: 'i',
    className: 'badge--info',
    blocking: 'Explanation only',
  },
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const meta = SEVERITY_META[severity]
  return (
    <span className={`badge ${meta.className}`}>
      <span className="badge__glyph" aria-hidden="true">
        {meta.glyph}
      </span>
      {meta.label}
    </span>
  )
}

const TIER_META: Record<Tier, { label: string; glyph: string; hint: string }> = {
  DREAM: { label: 'Dream', glyph: '▲', hint: 'Closed above your rank last cycle' },
  TARGET: { label: 'Target', glyph: '●', hint: 'Closed near your rank last cycle' },
  SAFE: { label: 'Safe', glyph: '■', hint: 'Closed well below your rank last cycle' },
  UNKNOWN: { label: 'No data', glyph: '?', hint: 'No closing-rank evidence on record' },
}

export function TierBadge({ tier }: { tier: Tier }) {
  const meta = TIER_META[tier]
  return (
    <span className={`tier tier--${tier}`} title={meta.hint}>
      <span aria-hidden="true">{meta.glyph}</span>
      {meta.label}
      <span className="sr-only"> — {meta.hint}</span>
    </span>
  )
}

export function HardSoftBadge({ mode }: { mode: 'hard' | 'soft' }) {
  return mode === 'hard' ? (
    <span className="badge badge--hard">
      <span className="badge__glyph" aria-hidden="true">
        ⛔
      </span>
      Hard limit
    </span>
  ) : (
    <span className="badge badge--soft">
      <span className="badge__glyph" aria-hidden="true">
        ◇
      </span>
      Soft preference
    </span>
  )
}

export function Pill({
  tone,
  children,
}: {
  tone: 'critical' | 'warning' | 'info' | 'success' | 'neutral'
  children: ReactNode
}) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

const BANNER_GLYPH = {
  critical: '✕',
  warning: '!',
  info: 'i',
  success: '✓',
  stale: '↻',
} as const

export function Banner({
  tone,
  title,
  children,
  action,
  live,
}: {
  tone: keyof typeof BANNER_GLYPH
  title: string
  children?: ReactNode
  action?: ReactNode
  live?: boolean
}) {
  return (
    <div
      className={`banner banner--${tone}`}
      role={tone === 'critical' ? 'alert' : 'status'}
      aria-live={live ? 'polite' : undefined}
    >
      <span className="banner__glyph" aria-hidden="true">
        {BANNER_GLYPH[tone]}
      </span>
      <span className="banner__body">
        <strong>{title}</strong>
        {children}
      </span>
      {action}
    </div>
  )
}

export function Field({
  label,
  hint,
  error,
  badge,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  error?: string
  badge?: ReactNode
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {badge}
      </label>
      {hint && <span className="field__hint">{hint}</span>}
      {children}
      {error && (
        <span className="field__error" role="alert">
          <span aria-hidden="true">✕</span>
          {error}
        </span>
      )}
    </div>
  )
}

export function Dialog({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    )?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const focusables = Array.from(
        ref.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [onClose])

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <h2 id={titleId}>{title}</h2>
        {children}
        {footer && <div className="row row--between">{footer}</div>}
      </div>
    </div>
  )
}

export function LiveRegion({ message }: { message: string }) {
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  )
}
