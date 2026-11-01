const WEEK = 7

// All colors live here, so the look can be changed in one place.
const STYLE = {
  block:
    'rounded-xl border border-zinc-200 bg-zinc-100 p-3 shadow-md shadow-black/10 ' +
    'dark:border-zinc-600 dark:bg-zinc-700/50 dark:shadow-black/40',
  title: 'font-semibold text-zinc-900 dark:text-zinc-100',
  count: 'font-semibold text-emerald-600 dark:text-emerald-400',
  done: 'bg-emerald-500 text-white',
  empty: 'bg-white text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  next: 'ring-2 ring-emerald-500',
}

// Shows where the current streak sits inside its week: filled circles for finished days,
// numbers for the days still ahead, and a trophy that lights up when the week is complete.
// Breaking the streak sends it back to Week 1.
export default function WeekProgress({ streak, pendingToday }) {
  const week = streak === 0 ? 1 : Math.ceil(streak / WEEK)
  const count = streak === 0 ? 0 : streak % WEEK === 0 ? WEEK : streak % WEEK
  const complete = count === WEEK

  return (
    <div className={STYLE.block}>
      <div className="mb-2 flex items-baseline justify-between">
        <p className={STYLE.title}>
          Week {week}
          {week > 1 && (
            <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
              🏆 {week - 1} done
            </span>
          )}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className={STYLE.count}>{count}</span>/{WEEK}
        </p>
      </div>

      <div className="flex items-center justify-between gap-1 sm:justify-start sm:gap-3">
        {Array.from({ length: WEEK }, (_, i) => {
          const done = i < count
          const next = !done && i === count && pendingToday // the day still to be marked
          return (
            <span
              key={i}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold sm:h-9 sm:w-9 ${
                done ? STYLE.done : STYLE.empty
              } ${next ? STYLE.next : ''}`}
            >
              {done ? '✓' : i + 1}
            </span>
          )
        })}
        <span
          className={`shrink-0 text-2xl sm:ml-1 ${complete ? '' : 'opacity-30 grayscale'}`}
          title={complete ? 'Week complete!' : 'Finish 7 days in a row'}
          aria-label={complete ? 'Week complete' : 'Week not complete'}
        >
          🏆
        </span>
      </div>
    </div>
  )
}