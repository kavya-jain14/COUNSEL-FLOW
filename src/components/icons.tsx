type IconProps = { className?: string }

function base(children: React.ReactNode, className?: string) {
  return (
    <svg
      className={className ?? 'icon'}
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

export function IconSun({ className }: IconProps) {
  return base(
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
    </>,
    className,
  )
}

export function IconMoon({ className }: IconProps) {
  return base(
    <path d="M20.4 13.9A8.6 8.6 0 0 1 10.1 3.6a8.6 8.6 0 1 0 10.3 10.3z" />,
    className,
  )
}
