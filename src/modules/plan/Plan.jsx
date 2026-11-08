import { useState } from 'react'
import { useModuleData } from '../../data/DataContext'
import RichEditor from '../tasks/RichEditor'

// Must be a stable object (useModuleData depends on it)
const DEFAULTS = { items: [] }

const RESULTS = [
  { id: 'done', label: '✅ Followed', style: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  { id: 'partial', label: '🟡 Partly', style: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  { id: 'missed', label: '❌ Missed', style: 'bg-red-500/15 text-red-700 dark:text-red-400' },
]

const todayStr = () => new Date().toLocaleDateString('en-CA')

const shiftDate = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

const prettyDate = (dateStr) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`

// The editor returns HTML like "<p></p>" when empty, so strip tags before checking.
const isEmpty = (html) => !html || (!html.replace(/<[^>]*>/g, '').trim() && !/<img/i.test(html))

// Tailwind resets lists and links, so put the basics back for saved rich text.
const RICH =
  'break-words text-sm [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5'

const input =
  'min-h-11 w-full min-w-0 rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-accent md:min-h-10 md:text-sm dark:border-zinc-700 dark:[color-scheme:dark]'

const iconBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-lg hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-accent md:h-10 md:w-10 dark:border-zinc-700 dark:hover:bg-zinc-800'

export default function Plan() {
  const [{ items }, update] = useModuleData('plan', DEFAULTS)
  const [date, setDate] = useState(todayStr)
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')
  const [what, setWhat] = useState('')
  // Changing this key remounts the editor, which reliably clears it after adding
  const [formKey, setFormKey] = useState(0)

  const dayItems = items.filter((i) => i.date === date).sort((a, b) => a.start.localeCompare(b.start))

  const add = (e) => {
    e.preventDefault()
    if (isEmpty(what)) return
    update((prev) => ({
      ...prev,
      items: [...prev.items, { id: newId(), date, start, end, what, result: 'pending', remark: '' }],
    }))
    // Next slot starts where this one ended
    setStart(end)
    setWhat('')
    setFormKey((k) => k + 1)
  }

  const patch = (id, changes) =>
    update((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, ...changes } : i)),
    }))

  const remove = (id) =>
    update((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }))

  const marked = dayItems.filter((i) => i.result !== 'pending').length
  const done = dayItems.filter((i) => i.result === 'done').length

  return (
    // Mobile: one column (form on top, list below).
    // Laptop: form stays on the left, plans fill the right.
    <div className="mx-auto w-full max-w-5xl md:grid md:grid-cols-[24rem_minmax(0,1fr)] md:items-start md:gap-8">
      {/* ---------- Left: day picker, add form, summary ---------- */}
      <section className="mb-6 min-w-0 md:sticky md:top-4 md:mb-0">
        {/* Day navigation */}
        <div className="mb-4 flex items-center gap-2">
          <button onClick={() => setDate(shiftDate(date, -1))} className={iconBtn} aria-label="Previous day">
            ‹
          </button>
          <div className="min-w-0 flex-1 text-center">
            <h2 className="truncate text-lg font-semibold">{prettyDate(date)}</h2>
            {date !== todayStr() && (
              <button onClick={() => setDate(todayStr())} className="text-xs text-accent underline">
                Back to today
              </button>
            )}
          </div>
          <button onClick={() => setDate(shiftDate(date, 1))} className={iconBtn} aria-label="Next day">
            ›
          </button>
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className={`${input} mb-4`}
          aria-label="Pick a date"
        />

        {/* Add a plan */}
        <form onSubmit={add} className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            From
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            To
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={input} />
          </label>

          <div className="col-span-2 min-w-0">
            <p className="mb-1 text-xs font-medium text-zinc-500">What will I do?</p>
            <RichEditor key={formKey} value={what} onChange={setWhat} />
          </div>

          <button
            type="submit"
            disabled={isEmpty(what)}
            className="col-span-2 min-h-11 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 md:min-h-10"
          >
            Add plan
          </button>
        </form>

        {/* Day summary */}
        {dayItems.length > 0 && (
          <p className="mt-4 text-sm text-zinc-500">
            Followed {done} of {dayItems.length} plans
            {marked < dayItems.length && ` · ${dayItems.length - marked} not marked yet`}
          </p>
        )}
      </section>

      {/* ---------- Right: the day's plans ---------- */}
      <section className="min-w-0">
        {dayItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No plans for this day yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {dayItems.map((i) => {
              const needsWhy = i.result === 'partial' || i.result === 'missed'
              return (
                <li key={i.id} className="rounded-xl border border-zinc-200 p-3 sm:p-4 dark:border-zinc-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-500">
                        {i.start} – {i.end}
                      </p>
                      {/* Saved as HTML by the editor */}
                      <div className={`${RICH} font-medium`} dangerouslySetInnerHTML={{ __html: i.what }} />
                    </div>
                    <button
                      onClick={() => remove(i.id)}
                      aria-label="Delete plan"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-accent dark:hover:bg-zinc-800"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {RESULTS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => patch(i.id, { result: i.result === r.id ? 'pending' : r.id })}
                        aria-pressed={i.result === r.id}
                        className={`min-h-10 rounded-lg px-1 py-2 text-xs transition focus-visible:outline-2 focus-visible:outline-accent sm:text-sm ${
                          i.result === r.id
                            ? `${r.style} font-semibold ring-1 ring-current`
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {/* Remark shows once a result is chosen (or if one already exists) */}
                  {(i.result !== 'pending' || !isEmpty(i.remark)) && (
                    <div className="mt-3 min-w-0">
                      <p className="mb-1 text-xs font-medium text-zinc-500">
                        {needsWhy ? 'Why did it not go as planned?' : 'Remark (optional)'}
                      </p>
                      <RichEditor value={i.remark ?? ''} onChange={(html) => patch(i.id, { remark: html })} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}