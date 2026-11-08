import { useRef, useState } from 'react'
import { useModuleData } from '../../data/DataContext'

const uid = () => Math.random().toString(36).slice(2, 9)

// Four two-way factors give 2 x 2 x 2 x 2 = 16 combinations.
const FACTORS = [
  { id: 'w', name: 'Day type', options: [['work', 'Work'], ['off', 'Off']] },
  { id: 't', name: 'Time', options: [['morning', 'Morning'], ['night', 'Night']] },
  { id: 'b', name: 'Mood', options: [['bored', 'Bored'], ['notbored', 'Not bored']] },
  { id: 's', name: 'Energy', options: [['sleepy', 'Sleepy'], ['awake', 'Not sleepy']] },
]

// Every combination, e.g. { key: 'work-night-bored-sleepy', values: ['work','night','bored','sleepy'] }
const COMBOS = FACTORS.reduce(
  (acc, f) => acc.flatMap((c) => f.options.map(([v]) => [...c, v])),
  [[]]
).map((values) => ({ key: values.join('-'), values }))

const labelOf = (factorIndex, value) =>
  FACTORS[factorIndex].options.find(([v]) => v === value)[1]

const comboTitle = (values) => values.map((v, i) => labelOf(i, v)).join(', ')

// Starter suggestions, in the same order as COMBOS (work first, sleepy changes fastest).
const SEED = [
  /* work, morning, bored, sleepy */ ['Cold water and a 5-minute walk, then start the easiest task', 'Knock out the 3 quickest tasks to build momentum'],
  /* work, morning, bored, awake */ ['Pick the most interesting task and time-box 45 minutes', 'Switch to a task with a clear finish line'],
  /* work, morning, not bored, sleepy */ ['Drink water, sit near light, then start the hardest task', '5-minute stretch, then one 25-minute focus block'],
  /* work, morning, not bored, awake */ ['Deep work on the top priority for 90 minutes', 'Answer messages in a batch after the first block'],
  /* work, night, bored, sleepy */ ['Stop for today and write tomorrow\u2019s top 3', 'Short walk, then go to bed on time'],
  /* work, night, bored, awake */ ['One 25-minute block on the task you keep avoiding', 'Learn something related to work for 20 minutes'],
  /* work, night, not bored, sleepy */ ['Finish only what is due tomorrow, then stop', 'Write down what is left and go to sleep'],
  /* work, night, not bored, awake */ ['Use the energy for one focused block on the main deliverable', 'Set a hard stop time so sleep is not pushed back'],
  /* off, morning, bored, sleepy */ ['Walk outside in the daylight, then a slow breakfast', 'Stretch and drink water before touching the phone'],
  /* off, morning, bored, awake */ ['Try something new: a place, a recipe or a side project', 'Call or meet a friend'],
  /* off, morning, not bored, sleepy */ ['Slow start: a warm drink and light stretching, no screens for 30 minutes', 'Pick one thing to look forward to today'],
  /* off, morning, not bored, awake */ ['Exercise or take a long walk', 'Work on a personal project you care about'],
  /* off, night, bored, sleepy */ ['Wind down: shower, read, phone away', 'Go to bed early and let the boredom pass'],
  /* off, night, bored, awake */ ['Watch a film or play a game for a fixed amount of time', 'Make something or learn a skill for 30 minutes'],
  /* off, night, not bored, sleepy */ ['Go to sleep: brush teeth, lights out', 'Write tomorrow\u2019s top 3 so your head can let go'],
  /* off, night, not bored, awake */ ['Read 10 pages or write in a journal', 'Tidy up a little, then wind down with no screens'],
]

const DEFAULT_RULES = COMBOS.flatMap((c, ci) =>
  SEED[ci].map((text, i) => ({ id: `${c.key}-${i}`, combo: c.key, text, order: i }))
)

// Must be a stable reference: useModuleData uses it as a dependency.
// Shape matches stamp/merge: one top-level list of items that have ids.
const MODULE_DEFAULTS = { rules: DEFAULT_RULES }

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0)

const inputCls =
  'w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-accent md:text-sm dark:border-zinc-700'
const ghostBtn =
  'rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-accent dark:text-zinc-400 dark:hover:bg-zinc-800'
const primaryBtn =
  'shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function Chip({ children }) {
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] leading-tight text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      {children}
    </span>
  )
}

const startingChoice = () => {
  const hour = new Date().getHours()
  return { w: 'work', t: hour >= 5 && hour < 18 ? 'morning' : 'night', b: 'bored', s: 'sleepy' }
}

export default function Playbook() {
  const [state, update] = useModuleData('playbookMatrix', MODULE_DEFAULTS)
  const rules = state.rules ?? []

  const [choice, setChoice] = useState(startingChoice)
  const [editing, setEditing] = useState(false)
  const [picked, setPicked] = useState(null) // id of the randomly picked rule
  const [draft, setDraft] = useState('')
  const panelRef = useRef(null)

  const currentKey = FACTORS.map((f) => choice[f.id]).join('-')
  const currentValues = FACTORS.map((f) => choice[f.id])
  const rulesFor = (key) => rules.filter((r) => r.combo === key).sort(byOrder)
  const actions = rulesFor(currentKey)

  const choose = (factorId, value) => {
    setChoice((c) => ({ ...c, [factorId]: value }))
    setPicked(null)
    setDraft('')
  }

  const jumpTo = (combo) => {
    setChoice(Object.fromEntries(FACTORS.map((f, i) => [f.id, combo.values[i]])))
    setPicked(null)
    setDraft('')
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Every update spreads prev so the module's `deleted` records are kept.
  // Only changed items get new objects, so only they are re-stamped.
  const patchRule = (id, patch) =>
    update((prev) => ({
      ...prev,
      rules: (prev.rules ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))

  const removeRule = (id) =>
    update((prev) => ({ ...prev, rules: (prev.rules ?? []).filter((r) => r.id !== id) }))

  const moveUp = (i) => {
    if (i === 0) return
    const above = actions[i - 1]
    const current = actions[i]
    update((prev) => ({
      ...prev,
      rules: (prev.rules ?? []).map((r) => {
        if (r.id === current.id) return { ...r, order: above.order }
        if (r.id === above.id) return { ...r, order: current.order }
        return r
      }),
    }))
  }

  const addRule = () => {
    const text = draft.trim()
    if (!text) return
    const order = actions.length ? Math.max(...actions.map((a) => a.order ?? 0)) + 1 : 0
    const rule = { id: uid(), combo: currentKey, text, order }
    update((prev) => ({ ...prev, rules: [...(prev.rules ?? []), rule] }))
    setDraft('')
  }

  const pickForMe = () => {
    if (!actions.length) return
    setPicked(actions[Math.floor(Math.random() * actions.length)].id)
  }

  const resetDefaults = () => {
    if (window.confirm('Replace every suggestion with the starter ones? Your edits will be lost.')) {
      update((prev) => ({ ...prev, rules: DEFAULT_RULES }))
      setEditing(false)
    }
  }

  return (
    <section className="w-full">
      <header className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Playbook</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Choose what is true right now. Each of the 16 combinations has its own suggestions.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FACTORS.map((f) => (
          <div
            key={f.id}
            role="group"
            aria-label={f.name}
            className="flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-800"
          >
            {f.options.map(([value, label]) => {
              const on = choice[f.id] === value
              return (
                <button
                  key={value}
                  onClick={() => choose(f.id, value)}
                  aria-pressed={on}
                  className={`flex-1 rounded-md px-2 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-accent ${
                    on
                      ? 'bg-accent/10 font-semibold text-accent'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div ref={panelRef} className="mt-6 scroll-mt-4 rounded-lg border border-accent p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{comboTitle(currentValues)}</h3>
          <div className="flex items-center gap-2">
            {!editing && actions.length > 1 && (
              <button onClick={pickForMe} className={primaryBtn}>
                Pick one for me
              </button>
            )}
            <button onClick={() => setEditing((e) => !e)} className={ghostBtn}>
              {editing ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>

        {!editing &&
          (actions.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nothing here yet. Tap Edit and add what you will do in this case.
            </p>
          ) : (
            <ol className="grid gap-2 lg:grid-cols-2">
              {actions.map((a, i) => (
                <li
                  key={a.id}
                  className={`rounded-lg border px-4 py-3 text-sm transition ${
                    picked === a.id
                      ? 'border-accent bg-accent/10 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {i + 1}. {a.text}
                </li>
              ))}
            </ol>
          ))}

        {editing && (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {actions.map((a, i) => (
                <li key={a.id} className="flex gap-1">
                  <input
                    value={a.text}
                    onChange={(e) => patchRule(a.id, { text: e.target.value })}
                    aria-label={`Suggestion ${i + 1}`}
                    className={inputCls}
                  />
                  <button
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    aria-label="Move up"
                    title="Move up"
                    className={`${ghostBtn} disabled:opacity-30`}
                  >
                    ↑
                  </button>
                  <button onClick={() => removeRule(a.id)} aria-label="Delete suggestion" title="Delete suggestion" className={ghostBtn}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRule()}
                placeholder="In this case, I will…"
                aria-label="New suggestion"
                className={inputCls}
              />
              <button onClick={addRule} className={primaryBtn}>
                Add
              </button>
            </div>

            <div className="flex justify-end border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <button onClick={resetDefaults} className={ghostBtn}>
                Restore starter suggestions
              </button>
            </div>
          </div>
        )}
      </div>

      <h3 className="mb-3 mt-8 text-base font-semibold">All 16 combinations</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {COMBOS.map((combo) => {
          const list = rulesFor(combo.key)
          const active = combo.key === currentKey
          return (
            <li
              key={combo.key}
              className={`rounded-lg border p-3 ${
                active ? 'border-accent bg-accent/5' : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <button
                onClick={() => jumpTo(combo)}
                aria-current={active ? 'true' : undefined}
                aria-label={`Show ${comboTitle(combo.values)}`}
                className="mb-2 flex w-full flex-wrap gap-1 text-left focus-visible:outline-2 focus-visible:outline-accent"
              >
                {combo.values.map((v, i) => (
                  <Chip key={i}>{labelOf(i, v)}</Chip>
                ))}
              </button>
              {list.length === 0 ? (
                <p className="text-xs text-zinc-500">No suggestions yet.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-600 dark:text-zinc-400">
                  {list.map((a) => (
                    <li key={a.id}>{a.text}</li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}