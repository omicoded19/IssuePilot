interface MatchScoreRingProps {
  score: number
  size?: number
  label?: string
}

export function MatchScoreRing({ score, size = 72, label }: MatchScoreRingProps) {
  const stroke = size <= 56 ? 4 : 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 90 ? '#4ade80' : score >= 75 ? '#22c55e' : '#a3a3a3'
  const fontSize = size <= 48 ? 10 : size <= 58 ? 12 : 14

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-semibold text-slate-100" style={{ fontSize }}>
            {score}%
          </span>
        </div>
      </div>
      {label && <span className="text-[11px] text-slate-500">{label}</span>}
    </div>
  )
}
