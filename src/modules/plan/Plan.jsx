import { useState } from 'react'
import { useModuleData } from '../../data/DataContext'
import RichEditor from '../tasks/RichEditor'

// Must be a stable object (useModuleData depends on it)
const DEFAULTS = { items: [], templates: [] }

const RESULTS = [
  { id: 'done', label: '✅ Done', style: 'bg-green-500/15 text-green-700 dark:text-green-400' },
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

const toMinutes = (t) => {
  const [h, m] = (t || '0:0').split(':').map(Number)
  return h * 60 + m
}

// Current clock time as "HH:MM"
const nowTime = () => new Date().toTimeString().slice(0, 5)

// Add minutes to an "HH:MM" time (stops at 23:59)
const addMinutes = (t, m) => {
  const total = Math.min(23 * 60 + 59, toMinutes(t) + m)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// Expected time of a plan = the From/To slot
const expectedOf = (start, end) => Math.max(0, toMinutes(end) - toMinutes(start))

// "" or undefined -> null (not entered yet), otherwise a whole number >= 0
const num = (v) => (v === '' || v == null ? null : Math.max(0, Math.round(Number(v) || 0)))

const fmtMin = (m) => {
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h ${r}m` : `${h}h`
}

// Minutes between two "HH:MM" times, or null if either is missing
const spanMin = (start, end) =>
  start && end ? Math.max(0, toMinutes(end) - toMinutes(start)) : null

// New urgent tasks store start / expectedEnd / actualEnd as clock times.
// Older ones only have minutes (`expected`, `actual`, `minutes`), so fall back to those.
const uExpected = (u) => (u.start && u.expectedEnd ? spanMin(u.start, u.expectedEnd) : (u.expected ?? null))
const uActual = (u) => (u.start && u.actualEnd ? spanMin(u.start, u.actualEnd) : (u.actual ?? u.minutes ?? null))

// Time lost to urgent tasks: actual if known, otherwise the expected time.
const lost = (i) => (i.interruptions ?? []).reduce((sum, u) => sum + (uActual(u) ?? uExpected(u) ?? 0), 0)

// Compare expected vs actual and say whether it ran over or under.
const compare = (expected, actual) => {
  if (expected == null || actual == null) return null
  const d = actual - expected
  if (d === 0) return { text: 'on time', style: 'text-green-700 dark:text-green-400' }
  if (d > 0) return { text: `${fmtMin(d)} over`, style: 'text-red-600 dark:text-red-400' }
  return { text: `${fmtMin(-d)} under`, style: 'text-green-700 dark:text-green-400' }
}

const sum = (list, fn) => list.reduce((total, x) => total + fn(x), 0)

// Tailwind resets lists and links, so put the basics back for saved rich text.
const RICH =
  'break-words text-sm [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5'

const input =
  'min-h-9 w-full min-w-0 rounded-lg border border-zinc-200 bg-transparent px-3 py-1 text-base focus-visible:outline-2 focus-visible:outline-accent md:min-h-8 md:text-sm dark:border-zinc-700 dark:[color-scheme:dark]'

const iconBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-lg hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-accent md:h-10 md:w-10 dark:border-zinc-700 dark:hover:bg-zinc-800'

const smallIcon =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-accent dark:hover:bg-zinc-800'

const secondaryBtn =
  'min-h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-accent dark:border-zinc-700 dark:hover:bg-zinc-800'

const primaryBtn =
  'min-h-10 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50'

const linkBtn =
  'text-xs font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-accent'

// Plain text of the editor's HTML (used as the name of a repeated task)
const textOf = (html) =>
  new DOMParser().parseFromString(html || '', 'text/html').body.textContent.replace(/\s+/g, ' ').trim()

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/* ------------------------------------------------------------------ */
/* Saved repeated tasks: tap one to fill in the task and its duration  */
/* ------------------------------------------------------------------ */
function TemplateChips({ templates, onPick, onRemove }) {
  if (templates.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((t) => (
        <span key={t.id} className="flex items-center rounded-full bg-zinc-100 text-xs dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => onPick(t)}
            className="min-h-9 rounded-l-full py-1 pl-3 pr-2 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
          >
            {t.name} · {fmtMin(t.minutes)}
          </button>
          <button
            type="button"
            onClick={() => onRemove(t.id)}
            aria-label={`Remove ${t.name}`}
            className="min-h-9 rounded-r-full py-1 pl-1 pr-3 text-zinc-400 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-accent"
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Switch between typing an end time and typing a duration             */
/* ------------------------------------------------------------------ */
function ModeToggle({ mode, onChange }) {
  const options = [
    { id: 'end', label: 'End time' },
    { id: 'duration', label: 'Duration' },
  ]
  return (
    <div
      role="group"
      aria-label="How to set the finish time"
      className="col-span-2 flex gap-1 rounded-lg bg-zinc-100 p-0.5 text-xs dark:bg-zinc-800"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={mode === o.id}
          className={`min-h-8 flex-1 rounded-md px-2 py-1 font-medium focus-visible:outline-2 focus-visible:outline-accent ${
            mode === o.id
              ? 'bg-white text-accent shadow-sm dark:bg-zinc-700'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* One plan as a card: view mode, edit mode, and urgent-task logging   */
/* ------------------------------------------------------------------ */
function PlanCard({ item: i, patch, remove, templates, saveTemplate, removeTemplate }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    start: i.start,
    end: i.end,
    what: i.what,
    remark: i.remark ?? '',
    actual: i.actual ?? '',
    completedAt: i.completedAt ?? '',
  })
  const [logging, setLogging] = useState(false)
  // A new urgent task: what it is, when it started, when I expect to finish
  const [urgent, setUrgent] = useState({ what: '', start: '', expectedEnd: '', dur: '15' })
  // The urgent task being edited (null when none)
  const [editingUrgent, setEditingUrgent] = useState(null)
  // Whether the urgent form asks for an end time or a duration (kept between openings)
  const [urgentMode, setUrgentMode] = useState('end')
  // Done plans are folded into one line unless this is true
  const [expanded, setExpanded] = useState(false)

  const interruptions = i.interruptions ?? []
  const needsWhy = i.result === 'partial' || i.result === 'missed'
  const lostMin = lost(i)
  const expectedMin = expectedOf(i.start, i.end)
  const planCmp = compare(expectedMin, i.actual ?? null)
  // Focused time = actual time minus the time lost to urgent tasks
  const focusedMin = i.actual != null && lostMin > 0 ? Math.max(0, i.actual - lostMin) : null
  const focusedCmp = compare(expectedMin, focusedMin)

  // Mark a result. "Done" stamps the current time as the completion time
  // and fills the actual time (start -> now) if it is still empty and the plan is today's.
  // "Missed" clears the actual time and completion stamp.
  const setResult = (id) => {
    const next = i.result === id ? 'pending' : id
    setExpanded(false)
    const changes = { result: next }

    if (next === 'done' && i.result !== 'done') {
      // Newly done: stamp completion time, and fill actual time if it's today's plan
      const now = nowTime()
      changes.completedAt = now
      if (i.actual == null && i.date === todayStr()) {
        const taken = toMinutes(now) - toMinutes(i.start)
        if (taken >= 0) {
          changes.actual = taken
          changes.actualAuto = true
        }
      }
    } else if (next !== 'done' && i.result === 'done') {
      // No longer done: clear the stamp and any automatic actual time
      changes.completedAt = null
      if (i.actualAuto) {
        changes.actual = null
        changes.actualAuto = false
      }
    }

    // Missed means nothing was completed, so no actual time or completion stamp
    if (next === 'missed') {
      changes.actual = null
      changes.actualAuto = false
      changes.completedAt = null
    }

    patch(i.id, changes)
  }

  const startEdit = () => {
    setDraft({
      start: i.start,
      end: i.end,
      what: i.what,
      remark: i.remark ?? '',
      actual: i.actual ?? '',
      completedAt: i.completedAt ?? '',
    })
    setEditing(true)
  }

  const saveEdit = () => {
    if (isEmpty(draft.what)) return
    patch(i.id, {
      start: draft.start,
      end: draft.end,
      what: draft.what,
      remark: draft.remark,
      actual: num(draft.actual),
      completedAt: draft.completedAt || null,
      // If the actual time was typed by hand, it is no longer the automatic one
      actualAuto: draft.actual === (i.actual ?? '') ? (i.actualAuto ?? false) : false,
    })
    setEditing(false)
  }

  // Opening the form pre-fills "started" with the current time
  const openLogging = () => {
    const now = nowTime()
    setUrgent({ what: '', start: now, expectedEnd: addMinutes(now, 15), dur: '15' })
    setLogging(true)
  }

  // Expected finish of the urgent task: start + duration, or the typed time
  const urgentEnd =
    urgentMode === 'duration'
      ? addMinutes(urgent.start || nowTime(), num(urgent.dur) || 0)
      : urgent.expectedEnd

  // Pick a repeated task: fill the name and set expected finish = start + duration
  const pickUrgentTemplate = (t) =>
    setUrgent({
      ...urgent,
      what: t.name,
      dur: String(t.minutes),
      expectedEnd: addMinutes(urgent.start || nowTime(), t.minutes),
    })

  const saveUrgentTemplate = () =>
    saveTemplate(urgent.what.trim(), spanMin(urgent.start, urgentEnd))

  const addUrgent = (e) => {
    e.preventDefault()
    if (!urgent.what.trim()) return
    patch(i.id, {
      interruptions: [
        ...interruptions,
        {
          id: newId(),
          what: urgent.what.trim(),
          start: urgent.start,
          expectedEnd: urgentEnd || null,
          actualEnd: null,
        },
      ],
    })
    setLogging(false)
  }

  // One tap: record the current time as the finish time
  const completeUrgent = (uid) =>
    patch(i.id, {
      interruptions: interruptions.map((u) => (u.id === uid ? { ...u, actualEnd: nowTime() } : u)),
    })

  const startEditUrgent = (u) =>
    setEditingUrgent({
      id: u.id,
      what: u.what,
      start: u.start ?? '',
      expectedEnd: u.expectedEnd ?? '',
      actualEnd: u.actualEnd ?? '',
    })

  const saveUrgent = (e) => {
    e.preventDefault()
    if (!editingUrgent.what.trim()) return
    patch(i.id, {
      interruptions: interruptions.map((u) => {
        if (u.id !== editingUrgent.id) return u
        const next = {
          ...u,
          what: editingUrgent.what.trim(),
          start: editingUrgent.start || null,
          expectedEnd: editingUrgent.expectedEnd || null,
          actualEnd: editingUrgent.actualEnd || null,
        }
        // Once it has a start time, the old minute fields are no longer needed
        if (next.start) {
          next.expected = null
          next.actual = null
          next.minutes = null
        }
        return next
      }),
    })
    setEditingUrgent(null)
  }

  const removeUrgent = (uid) =>
    patch(i.id, { interruptions: interruptions.filter((u) => u.id !== uid) })

  /* ---------- Edit mode ---------- */
  if (editing) {
    const draftExpected = expectedOf(draft.start, draft.end)
    return (
      <li className="rounded-xl border-2 border-accent p-3 sm:p-4">
        <p className="mb-3 text-sm font-semibold">Edit plan</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            From
            <input
              type="time"
              value={draft.start}
              onChange={(e) => setDraft({ ...draft, start: e.target.value })}
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            To
            <input
              type="time"
              value={draft.end}
              onChange={(e) => setDraft({ ...draft, end: e.target.value })}
              className={input}
            />
          </label>

          <div className="col-span-2 min-w-0">
            <p className="mb-1 text-xs font-medium text-zinc-500">What will I do?</p>
            <RichEditor value={draft.what} onChange={(html) => setDraft({ ...draft, what: html })} />
          </div>

          <label className="col-span-2 flex flex-col gap-1 text-xs text-zinc-500">
            Actual time taken (minutes) · Expected {fmtMin(draftExpected)}
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={draft.actual}
              onChange={(e) => setDraft({ ...draft, actual: e.target.value })}
              placeholder="Fill in when finished"
              className={input}
            />
          </label>

          <label className="col-span-2 flex flex-col gap-1 text-xs text-zinc-500">
            Completed at (set automatically when you mark Done)
            <input
              type="time"
              value={draft.completedAt}
              onChange={(e) => setDraft({ ...draft, completedAt: e.target.value })}
              className={input}
            />
          </label>

          <div className="col-span-2 min-w-0">
            <p className="mb-1 text-xs font-medium text-zinc-500">
              {needsWhy ? 'Why did it not go as planned?' : 'Remark (optional)'}
            </p>
            <RichEditor value={draft.remark} onChange={(html) => setDraft({ ...draft, remark: html })} />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className={secondaryBtn}>
            Cancel
          </button>
          <button onClick={saveEdit} disabled={isEmpty(draft.what)} className={primaryBtn}>
            Save changes
          </button>
        </div>
      </li>
    )
  }

  /* ---------- Collapsed (done plans) ---------- */
  if (i.result === 'done' && !expanded) {
    return (
      <li className="rounded-xl border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setExpanded(true)}
          aria-expanded="false"
          className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-accent dark:hover:bg-zinc-800"
        >
          <span className="text-green-700 dark:text-green-400">✅</span>
          <span className="shrink-0 text-xs font-medium text-zinc-500">
            {i.start} – {i.end}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
            {textOf(i.what)}
          </span>
          {i.actual != null && planCmp && (
            <span className={`shrink-0 text-xs font-semibold ${planCmp.style}`}>{planCmp.text}</span>
          )}
          <span className="shrink-0 text-zinc-400">▾</span>
        </button>
      </li>
    )
  }

  /* ---------- View mode ---------- */
  return (
    <li className="rounded-xl border border-zinc-200 p-3 sm:p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-zinc-500">
            {i.start} – {i.end}
          </p>
          {/* Saved as HTML by the editor */}
          <div className={`${RICH} font-medium`} dangerouslySetInnerHTML={{ __html: i.what }} />
        </div>
        <button onClick={startEdit} aria-label="Edit plan" className={`${smallIcon} hover:text-accent`}>
          ✏️
        </button>
        {i.result === 'done' && (
          <button onClick={() => setExpanded(false)} aria-label="Collapse plan" className={smallIcon}>
            ▴
          </button>
        )}
        <button
          onClick={() => remove(i.id)}
          aria-label="Delete plan"
          className={`${smallIcon} hover:text-red-500`}
        >
          ✕
        </button>
      </div>

      {/* Expected vs actual time of the plan */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="text-zinc-500">Expected {fmtMin(expectedMin)}</span>
        {i.actual != null ? (
          <>
            <span className="font-medium">Actual {fmtMin(i.actual)}</span>
            {planCmp && <span className={`font-semibold ${planCmp.style}`}>{planCmp.text}</span>}
            {focusedMin != null && (
              <span className="text-zinc-500">
                Focused {fmtMin(focusedMin)}
                {focusedCmp && (
                  <span className={`font-semibold ${focusedCmp.style}`}> ({focusedCmp.text})</span>
                )}
              </span>
            )}
          </>
        ) : (
          <button onClick={startEdit} className={linkBtn}>
            + Add actual time
          </button>
        )}
        {i.completedAt && <span className="text-zinc-500">Completed at {i.completedAt}</span>}
      </div>

      {/* Done / Partly / Missed */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {RESULTS.map((r) => (
          <button
            key={r.id}
            onClick={() => setResult(r.id)}
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

      {/* Urgent tasks that interrupted this plan */}
      <div className="mt-3 rounded-lg bg-amber-500/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {interruptions.length === 0
              ? 'No interruptions'
              : `⚡ ${fmtMin(lostMin)} lost to ${interruptions.length} urgent ${
                  interruptions.length === 1 ? 'task' : 'tasks'
                }`}
          </p>
          {!logging && (
            <button onClick={openLogging} className={linkBtn}>
              + Log urgent task
            </button>
          )}
        </div>

        {interruptions.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2">
            {interruptions.map((u) => {
              /* Editing one urgent task */
              if (editingUrgent?.id === u.id) {
                return (
                  <li key={u.id}>
                    <form
                      onSubmit={saveUrgent}
                      className="grid grid-cols-2 gap-2 rounded-lg border border-accent p-2"
                    >
                      <input
                        autoFocus
                        value={editingUrgent.what}
                        onChange={(e) => setEditingUrgent({ ...editingUrgent, what: e.target.value })}
                        aria-label="Urgent task"
                        className={`${input} col-span-2`}
                      />
                      <label className="flex flex-col gap-1 text-xs text-zinc-500">
                        Started at
                        <input
                          type="time"
                          value={editingUrgent.start}
                          onChange={(e) => setEditingUrgent({ ...editingUrgent, start: e.target.value })}
                          className={input}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-zinc-500">
                        Expected finish
                        <input
                          type="time"
                          value={editingUrgent.expectedEnd}
                          onChange={(e) => setEditingUrgent({ ...editingUrgent, expectedEnd: e.target.value })}
                          className={input}
                        />
                      </label>
                      <label className="col-span-2 flex flex-col gap-1 text-xs text-zinc-500">
                        Finished at (leave empty if still going)
                        <input
                          type="time"
                          value={editingUrgent.actualEnd}
                          onChange={(e) => setEditingUrgent({ ...editingUrgent, actualEnd: e.target.value })}
                          className={input}
                        />
                      </label>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingUrgent(null)} className={secondaryBtn}>
                          Cancel
                        </button>
                        <button type="submit" disabled={!editingUrgent.what.trim()} className={primaryBtn}>
                          Save
                        </button>
                      </div>
                    </form>
                  </li>
                )
              }

              /* Showing one urgent task */
              const actual = uActual(u)
              const expected = uExpected(u)
              const cmp = compare(expected, actual)
              return (
                <li key={u.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="break-words">{u.what}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {u.start ? (
                        <>
                          <span className="text-zinc-500">Started {u.start}</span>
                          <span className="text-zinc-500">
                            Expected done {u.expectedEnd ?? 'not set'}
                            {expected != null && ` (${fmtMin(expected)})`}
                          </span>
                          {u.actualEnd ? (
                            <span className="font-medium">
                              Finished {u.actualEnd} · {fmtMin(actual)}
                            </span>
                          ) : (
                            <button onClick={() => completeUrgent(u.id)} className={linkBtn}>
                              ✓ Complete
                            </button>
                          )}
                        </>
                      ) : (
                        /* Older tasks saved with minutes only */
                        <>
                          <span className="text-zinc-500">
                            Expected {expected != null ? fmtMin(expected) : 'not set'}
                          </span>
                          {actual != null ? (
                            <span className="font-medium">Actual {fmtMin(actual)}</span>
                          ) : (
                            <button onClick={() => startEditUrgent(u)} className={linkBtn}>
                              + Add actual time
                            </button>
                          )}
                        </>
                      )}
                      {cmp && <span className={`font-semibold ${cmp.style}`}>{cmp.text}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0">
                    <button
                      onClick={() => startEditUrgent(u)}
                      aria-label="Edit urgent task"
                      className="px-1.5 text-zinc-400 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => removeUrgent(u.id)}
                      aria-label="Remove urgent task"
                      className="px-1.5 text-zinc-400 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {logging && (
          <form onSubmit={addUrgent} className="mt-2 grid grid-cols-2 gap-2">
            {templates.length > 0 && (
              <div className="col-span-2">
                <TemplateChips templates={templates} onPick={pickUrgentTemplate} onRemove={removeTemplate} />
              </div>
            )}
            <input
              autoFocus
              value={urgent.what}
              onChange={(e) => setUrgent({ ...urgent, what: e.target.value })}
              placeholder="What came up?"
              aria-label="Urgent task"
              className={`${input} col-span-2`}
            />
            <ModeToggle mode={urgentMode} onChange={setUrgentMode} />
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Started at
              <input
                type="time"
                value={urgent.start}
                onChange={(e) => setUrgent({ ...urgent, start: e.target.value })}
                className={input}
              />
            </label>
            {urgentMode === 'duration' ? (
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                Duration (min) · done {urgentEnd}
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={urgent.dur}
                  onChange={(e) => setUrgent({ ...urgent, dur: e.target.value })}
                  className={input}
                />
              </label>
            ) : (
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                Expected finish
                <input
                  type="time"
                  value={urgent.expectedEnd}
                  onChange={(e) => setUrgent({ ...urgent, expectedEnd: e.target.value })}
                  className={input}
                />
              </label>
            )}
            <div className="col-span-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={saveUrgentTemplate}
                disabled={!urgent.what.trim() || !spanMin(urgent.start, urgentEnd)}
                className={`${linkBtn} mr-auto disabled:opacity-50 disabled:no-underline`}
              >
                ★ Save as repeated task
              </button>
              <button type="button" onClick={() => setLogging(false)} className={secondaryBtn}>
                Cancel
              </button>
              <button type="submit" disabled={!urgent.what.trim()} className={primaryBtn}>
                Save
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Remark is only displayed here. It is edited by clicking the pencil. */}
      {!isEmpty(i.remark) ? (
        <div className="mt-3 min-w-0">
          <p className="mb-1 text-xs font-medium text-zinc-500">
            {needsWhy ? 'Why it did not go as planned' : 'Remark'}
          </p>
          <div className={RICH} dangerouslySetInnerHTML={{ __html: i.remark }} />
        </div>
      ) : (
        needsWhy && (
          <button onClick={startEdit} className={`mt-3 ${linkBtn}`}>
            + Add reason
          </button>
        )
      )}
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Plan() {
  const [{ items, templates = [] }, update] = useModuleData('plan', DEFAULTS)
  const [date, setDate] = useState(todayStr)
  // New plans start now and last one hour by default
  const [start, setStart] = useState(nowTime)
  const [end, setEnd] = useState(() => addMinutes(nowTime(), 60))
  const [what, setWhat] = useState('')
  // Changing this key remounts the editor, which reliably clears it after adding
  const [formKey, setFormKey] = useState(0)
  // Whether the "done" group is open
  const [showDone, setShowDone] = useState(false)
  // Type an end time, or a duration (kept between plans)
  const [endMode, setEndMode] = useState('end')
  const [dur, setDur] = useState('60')
  // The end time that is actually used
  const endEff = endMode === 'duration' ? addMinutes(start, num(dur) || 0) : end

  const dayItems = items.filter((i) => i.date === date).sort((a, b) => a.start.localeCompare(b.start))

  const add = (e) => {
    e.preventDefault()
    if (isEmpty(what)) return
    update((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: newId(), date, start, end: endEff, what, result: 'pending', remark: '', actual: null, completedAt: null, actualAuto: false, interruptions: [] },
      ],
    }))
    // Next plan starts at the current time again
    const now = nowTime()
    setStart(now)
    setEnd(addMinutes(now, 60))
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

  // Save a repeated task (or update its duration if the name already exists)
  const saveTemplate = (name, minutes) => {
    if (!name || !minutes) return
    update((prev) => {
      const list = prev.templates ?? []
      const key = name.toLowerCase()
      const exists = list.some((t) => t.name.toLowerCase() === key)
      return {
        ...prev,
        templates: exists
          ? list.map((t) => (t.name.toLowerCase() === key ? { ...t, minutes } : t))
          : [...list, { id: newId(), name, minutes }],
      }
    })
  }

  const removeTemplate = (id) =>
    update((prev) => ({ ...prev, templates: (prev.templates ?? []).filter((t) => t.id !== id) }))

  // Pick a repeated task for a new plan: fill the text, end = start + duration
  const pickTemplate = (t) => {
    setWhat(`<p>${escapeHtml(t.name)}</p>`)
    setEnd(addMinutes(start, t.minutes))
    setDur(String(t.minutes))
    setFormKey((k) => k + 1) // remount the editor so it shows the new text
  }

  const saveCurrentAsTemplate = () => saveTemplate(textOf(what), spanMin(start, endEff))

  const doneItems = dayItems.filter((i) => i.result === 'done')
  const openItems = dayItems.filter((i) => i.result !== 'done')

  const marked = dayItems.filter((i) => i.result !== 'pending').length
  const done = dayItems.filter((i) => i.result === 'done').length

  // Plans that have an actual time: compare against their expected time
  const plansTimed = dayItems.filter((i) => i.actual != null)
  const planExpected = sum(plansTimed, (i) => expectedOf(i.start, i.end))
  const planActual = sum(plansTimed, (i) => i.actual)
  const planCmp = compare(planExpected, planActual)

  // Urgent tasks
  const urgentAll = dayItems.flatMap((i) => i.interruptions ?? [])
  const totalLost = sum(dayItems, lost)
  const urgentTimed = urgentAll.filter((u) => uExpected(u) != null && uActual(u) != null)
  const urgentExpected = sum(urgentTimed, (u) => uExpected(u))
  const urgentActual = sum(urgentTimed, (u) => uActual(u))
  const urgentCmp = compare(urgentExpected, urgentActual)

  return (
    // Mobile: one column (form on top, list below).
    // Laptop: form stays on the left, plans fill the right.
    <div className="mx-auto w-full max-w-5xl md:grid md:grid-cols-[24rem_minmax(0,1fr)] md:items-start md:gap-8">
      {/* ---------- Left: day picker, add form, summary ---------- */}
      <section className="mb-6 min-w-0 md:sticky md:top-4 md:mb-0">
        {/* Day navigation */}
        <div className="mb-2 flex items-center gap-2">
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
          className={`${input} mb-2`}
          aria-label="Pick a date"
        />

        {/* Add a plan */}
        <form onSubmit={add} className="grid grid-cols-2 gap-1.5">
          {/* Optional: tap a saved repeated task to fill in the name and end time */}
          {templates.length > 0 && (
            <div className="col-span-2">
              <TemplateChips templates={templates} onPick={pickTemplate} onRemove={removeTemplate} />
            </div>
          )}

          <ModeToggle mode={endMode} onChange={setEndMode} />
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            From
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={input} />
          </label>
          {endMode === 'duration' ? (
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Duration (min) · ends {endEff}
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={dur}
                onChange={(e) => setDur(e.target.value)}
                className={input}
              />
            </label>
          ) : (
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              To
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={input} />
            </label>
          )}

          <div className="col-span-2 min-w-0">
            <p className="mb-1 text-xs font-medium text-zinc-500">What will I do?</p>
            <div className="[&_.ProseMirror]:min-h-14 [&_.ProseMirror]:py-1 [&_[contenteditable]]:min-h-14 [&_textarea]:min-h-14">
              <RichEditor key={formKey} value={what} onChange={setWhat} />
            </div>
          </div>

          <button
            type="button"
            onClick={saveCurrentAsTemplate}
            disabled={isEmpty(what) || !spanMin(start, endEff)}
            className={`${linkBtn} col-span-2 justify-self-start disabled:opacity-50 disabled:no-underline`}
          >
            ★ Save as repeated task
          </button>

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
          <div className="mt-4 flex flex-col gap-1 text-sm text-zinc-500">
            <p>
              Done {done} of {dayItems.length} plans
              {marked < dayItems.length && ` · ${dayItems.length - marked} not marked yet`}
            </p>
            {plansTimed.length > 0 && (
              <p>
                Plans: expected {fmtMin(planExpected)}, actual {fmtMin(planActual)}
                {planCmp && <span className={`font-semibold ${planCmp.style}`}> ({planCmp.text})</span>}
              </p>
            )}
            {urgentAll.length > 0 && (
              <p className="text-amber-700 dark:text-amber-400">
                ⚡ {fmtMin(totalLost)} lost to {urgentAll.length} urgent{' '}
                {urgentAll.length === 1 ? 'task' : 'tasks'}
              </p>
            )}
            {urgentTimed.length > 0 && (
              <p>
                Urgent tasks: expected {fmtMin(urgentExpected)}, actual {fmtMin(urgentActual)}
                {urgentCmp && <span className={`font-semibold ${urgentCmp.style}`}> ({urgentCmp.text})</span>}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ---------- Right: the day's plans as cards ---------- */}
      <section className="min-w-0">
        {dayItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No plans for this day yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {doneItems.length > 0 && (
              <li className="rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setShowDone((v) => !v)}
                  aria-expanded={showDone}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-accent dark:hover:bg-zinc-800"
                >
                  <span className="text-green-700 dark:text-green-400">✅</span>
                  <span className="flex-1 font-medium">
                    {doneItems.length} done
                    {openItems.length === 0 && ' · all finished 🎉'}
                  </span>
                  <span className="text-zinc-400">{showDone ? '▴' : '▾'}</span>
                </button>
                {showDone && (
                  <ul className="flex flex-col gap-2 border-t border-zinc-200 p-2 dark:border-zinc-800">
                    {doneItems.map((i) => (
                      <PlanCard
                        key={i.id}
                        item={i}
                        patch={patch}
                        remove={remove}
                        templates={templates}
                        saveTemplate={saveTemplate}
                        removeTemplate={removeTemplate}
                      />
                    ))}
                  </ul>
                )}
              </li>
            )}
            {openItems.map((i) => (
              <PlanCard
                key={i.id}
                item={i}
                patch={patch}
                remove={remove}
                templates={templates}
                saveTemplate={saveTemplate}
                removeTemplate={removeTemplate}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}