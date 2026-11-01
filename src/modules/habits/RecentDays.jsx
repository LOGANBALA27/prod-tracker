import { lastDays, nextStatus } from './streak'

// All colors live here, so the look can be changed in one place.
const STYLE = {
  block:
    'rounded-xl border border-zinc-200 bg-zinc-100 p-3 shadow-md shadow-black/10 ' +
    'dark:border-zinc-600 dark:bg-zinc-700/50 dark:shadow-black/40',
  title: 'font-semibold text-zinc-900 dark:text-zinc-100',
  count: 'font-semibold text-emerald-600 dark:text-emerald-400',
  done: 'bg-emerald-500 text-white',
  missed: 'bg-red-500 text-white',
  none: 'bg-white text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  today: 'ring-2 ring-accent',
}

const weekday = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })
const fullDate = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })

// The last 7 days, one circle each: done, missed, or not marked yet.
// Tap a circle to change that day (not marked, done, missed).
export default function RecentDays({ log, today, onMark }) {
  const days = lastDays(today, 7)
  const doneCount = days.filter((d) => log[d] === 'done').length

  return (
    <div className={STYLE.block}>
      <div className="mb-2 flex items-baseline justify-between">
        <p className={STYLE.title}>Last 7 days</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className={STYLE.count}>{doneCount}</span>/7
        </p>
      </div>

      <div className="flex justify-between gap-1 sm:justify-start sm:gap-3">
        {days.map((day) => {
          const status = log[day] ?? 'none'
          const label = `${fullDate(day)}: ${status === 'none' ? 'not marked' : status}`
          return (
            <button
              key={day}
              type="button"
              onClick={() => onMark(day, nextStatus(log[day]))}
              title={`${label}. Tap to change`}
              aria-label={label}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold sm:h-9 sm:w-9 ${
                  STYLE[status]
                } ${day === today ? STYLE.today : ''}`}
              >
                {status === 'done' ? '✓' : status === 'missed' ? '✗' : Number(day.slice(8))}
              </span>
              <span className="text-[10px] text-zinc-500">{weekday(day)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}