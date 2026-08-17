type IconProps = { className?: string }

function base(children: React.ReactNode, className?: string) {
  return (
    <svg
      className={className ?? 'navitem__icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconProfile({ className }: IconProps) {
  return base(
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>,
    className,
  )
}

export function IconSummary({ className }: IconProps) {
  return base(
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>,
    className,
  )
}

export function IconStrategy({ className }: IconProps) {
  return base(
    <>
      <path d="M4 6h10M4 12h7M4 18h13" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
    </>,
    className,
  )
}

export function IconConflict({ className }: IconProps) {
  return base(
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.4-4.4M11 8v3.5M11 14.2v.1" />
    </>,
    className,
  )
}

export function IconLock({ className }: IconProps) {
  return base(
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
    </>,
    className,
  )
}
