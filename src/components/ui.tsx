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
    glyph: 'CR',
    className: 'badge--critical',
    blocking: 'Blocks locking',
  },
  WARNING: {
    label: 'Warning',
    glyph: 'WA',
    className: 'badge--warning',
    blocking: 'Can be overridden with a reason',
  },
  INFO: {
    label: 'Info',
    glyph: 'IN',
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
  DREAM: { label: 'Dream', glyph: 'D', hint: 'Closed at least 10% above your rank last cycle. A stretch worth retaining near the top.' },
  TARGET: { label: 'Target', glyph: 'T', hint: 'Closed within the 40% band around your rank last cycle. These are core options.' },
  SAFE: { label: 'Safe', glyph: 'S', hint: 'Closed at least 40% below your rank last cycle. A reliable fallback.' },
  UNKNOWN: { label: 'No data', glyph: 'N', hint: 'No closing-rank evidence on record. Confidence is marked low.' },
}

export function TierBadge({ tier }: { tier: Tier }) {
  const meta = TIER_META[tier]
  return (
    <span className={`tier tier--${tier}`} title={meta.hint}>
      <span aria-hidden="true">{meta.glyph}</span>
      {meta.label}
      <span className="sr-only">. {meta.hint}</span>
    </span>
  )
}

export function HardSoftBadge({ mode }: { mode: 'hard' | 'soft' }) {
  return mode === 'hard' ? (
    <span className="badge badge--hard">
      <span className="badge__glyph" aria-hidden="true">
        H
      </span>
      Hard limit
    </span>
  ) : (
    <span className="badge badge--soft">
      <span className="badge__glyph" aria-hidden="true">
        S
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
  critical: 'CR',
  warning: 'WA',
  info: 'IN',
  success: 'OK',
  stale: 'RV',
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
          <span aria-hidden="true">Field</span>
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

export function PageHead({
  step,
  total,
  kicker,
  title,
  lede,
  actions,
}: {
  step?: number
  total?: number
  kicker: string
  title: string
  lede?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="page-head">
      <div className="page-head__text">
        <span className="stepmark">
          <span className="stepmark__rule" aria-hidden="true" />
          {step != null && total != null && (
            <span>
              Step {step}
              <span className="stepmark__of"> / {total}</span>
              <span aria-hidden="true"> · </span>
            </span>
          )}
          {kicker}
        </span>
        <h1>{title}</h1>
        {lede && <p className="page-head__lede">{lede}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  )
}

export function Band({
  num,
  title,
  note,
  children,
}: {
  num: string
  title: string
  note?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="band">
      <div className="band__aside">
        <span className="band__num">{num}</span>
        <h2 className="band__title">{title}</h2>
        {note && <p className="band__note">{note}</p>}
      </div>
      <div className="band__main">{children}</div>
    </section>
  )
}

const NEXT_GLYPH = {
  go: 'NEXT',
  blocked: 'HOLD',
  ready: 'READY',
  wait: 'REVIEW',
} as const

export function NextStep({
  tone,
  what,
  why,
  children,
}: {
  tone: keyof typeof NEXT_GLYPH
  what: string
  why: ReactNode
  children: ReactNode
}) {
  return (
    <div className="nextstep" data-tone={tone} role="region" aria-label="What to do next">
      <span className="nextstep__glyph" aria-hidden="true">
        {NEXT_GLYPH[tone]}
      </span>
      <span className="nextstep__text">
        <span className="nextstep__what">{what}</span>
        <span className="nextstep__why">{why}</span>
      </span>
      <span className="nextstep__actions">{children}</span>
    </div>
  )
}

export function Meter({
  label,
  value,
  detail,
  polarity,
  fill,
}: {
  label: string
  value: string
  detail?: string
  polarity: 'positive' | 'negative' | 'neutral'
  fill: number
}) {
  return (
    <div className="meter" data-polarity={polarity}>
      <div className="meter__top">
        <span className="meter__label">{label}</span>
        <span className="meter__value">{value}</span>
      </div>
      <div className="meter__track">
        <span className="meter__fill" style={{ width: `${Math.round(fill * 100)}%` }} />
      </div>
      {detail && <p className="meter__detail">{detail}</p>}
    </div>
  )
}
