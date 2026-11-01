export default function ProgressRing({ percent, size = 64, complete }) {
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-200 dark:stroke-zinc-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          className={`transition-all duration-700 ${complete ? 'text-amber-500' : 'text-accent'}`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
        {complete ? '🏆' : `${percent}%`}
      </span>
    </div>
  )
}