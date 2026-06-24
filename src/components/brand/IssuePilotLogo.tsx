import { cn } from '@/lib/cn'

interface IssuePilotMarkProps {
  className?: string
}

export function IssuePilotMark({ className }: IssuePilotMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('h-8 w-8', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#0A0A0A" stroke="#2A2A2A" />
      <path
        d="M8 22.5V17.2C8 14.9 9.9 13 12.2 13h7.6c2.3 0 4.2-1.9 4.2-4.2V8"
        stroke="#4ADE80"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="24" r="2.5" fill="#4ADE80" />
      <circle cx="16" cy="13" r="2.5" fill="#0A0A0A" stroke="#86EFAC" strokeWidth="2" />
      <path d="M21.5 6.5 26 8l-4.5 1.5V6.5Z" fill="#F8FAFC" />
    </svg>
  )
}

interface IssuePilotLogoProps {
  compact?: boolean
  className?: string
}

export function IssuePilotLogo({ compact = false, className }: IssuePilotLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <IssuePilotMark className="shrink-0" />
      {!compact && <span className="font-semibold tracking-tight text-white">IssuePilot</span>}
    </span>
  )
}
