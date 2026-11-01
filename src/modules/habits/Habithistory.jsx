import { useState } from 'react'
import { pastStreaks } from './streak'

const WEEK = 7
const FIRST_SHOWN = 3

const short = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

// Past streaks, newest first. Each one is split into weeks, like the card's Week 1, Week 2...
export default function HabitHistory({ log, today }) {
  const [showAll, setShowAll] = useState(false)
  const streaks = pastStreaks(log, today).reverse()
  const shown = showAll ? streaks : streaks.slice(0, FIRST_SHOWN)

  return (
    <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <p className="mb-2 text-sm font-medium">Past streaks</p>

      {streaks.length === 0 ? (
        <p className="text-xs text-zinc-500">
          Nothing yet. A streak shows up here after it ends.
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((s) => (
            <li key={s.start}>
              <p className="text-xs text-zinc-500">
                {short(s.start)} – {short(s.end)} · {s.length} {s.length === 1 ? 'day' : 'days'}
              </p>
              <ul className="mt-1 space-y-1">
                {Array.from({ length: Math.ceil(s.length / WEEK) }, (_, w) => {
                  const count = Math.min(WEEK, s.length - w * WEEK)
                  return (
                    <li key={w} className="flex items-center gap-2 text-xs">
                      <span className="w-14 shrink-0">Week {w + 1}</span>
                      <span className="flex gap-1" aria-hidden="true">
                        {Array.from({ length: WEEK }, (_, i) => (
                          <span
                            key={i}
                            className={`h-3 w-3 rounded-full ${
                              i < count ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
                            }`}
                          />
                        ))}
                      </span>
                      <span className="ml-auto text-zinc-500">
                        {count}/{WEEK} {count === WEEK && '🏆'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {streaks.length > FIRST_SHOWN && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-xs text-zinc-500 hover:underline"
        >
          {showAll ? 'Show fewer' : `Show all ${streaks.length}`}
        </button>
      )}
    </div>
  )
}