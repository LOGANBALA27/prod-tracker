import { useState } from 'react'
import { nextStatus } from './streak'

const CELL = {
  done: 'bg-green-500 text-white',
  missed: 'bg-red-500 text-white',
  none: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700/60 dark:text-zinc-300',
}

const keyOf = (y, m, d) => new Date(y, m, d).toLocaleDateString('en-CA')
const dayNames = Array.from({ length: 7 }, (_, i) =>
  new Date(2023, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' })
) // Sunday first

// One month of a habit's history. Tap a past day to cycle it: not marked, done, missed.
export default function MonthCalendar({ log, today, onMark }) {
  const [offset, setOffset] = useState(0) // 0 = this month, -1 = last month ...

  const now = new Date(`${today}T00:00:00`)
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const y = first.getFullYear()
  const m = first.getMonth()
  const total = new Date(y, m + 1, 0).getDate()
  const lead = first.getDay() // empty cells before the 1st

  const days = Array.from({ length: total }, (_, i) => keyOf(y, m, i + 1))
  const done = days.filter((d) => log[d] === 'done').length
  const elapsed = days.filter((d) => d <= today).length

  return (
    <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          aria-label="Previous month"
          className="rounded px-2 py-0.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-medium">
            {first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </p>
          <p className="text-xs text-zinc-500">
            {done} of {elapsed} days
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOffset((o) => o + 1)}
          disabled={offset >= 0}
          aria-label="Next month"
          className="rounded px-2 py-0.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-700"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map((n, i) => (
          <span key={i} className="text-[10px] text-zinc-500">
            {n}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`gap-${i}`} />
        ))}
        {days.map((day, i) => {
          const status = log[day] ?? 'none'
          const future = day > today
          return (
            <button
              key={day}
              type="button"
              disabled={future}
              onClick={() => onMark(day, nextStatus(log[day]))}
              aria-label={`${day}: ${status === 'none' ? 'not marked' : status}`}
              className={`aspect-square rounded-md text-xs ${CELL[status]} ${
                future ? 'opacity-30' : ''
              } ${day === today ? 'ring-2 ring-accent ring-offset-1 dark:ring-offset-zinc-800' : ''}`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}