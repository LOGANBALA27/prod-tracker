import { useState } from 'react'
import { useModuleData } from '../../data/DataContext'
import { Button, Card, Input, PageHeader, Textarea } from '../../components/ui'
import { todayKey, uid } from '../../lib/utils'

const MAX_TASKS = 3 // change this number to allow more tasks per day
const defaults = { days: {} }
const emptyDay = { tasks: [], note: '' }

export default function Today() {
  const [data, update] = useModuleData('today', defaults)
  const [text, setText] = useState('')
  const key = todayKey()
  const day = data.days[key] ?? emptyDay
  const doneCount = day.tasks.filter((t) => t.done).length

  const patchDay = (fn) =>
    update((prev) => ({ ...prev, days: { ...prev.days, [key]: fn(prev.days[key] ?? emptyDay) } }))

  const addTask = (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value || day.tasks.length >= MAX_TASKS) return
    patchDay((d) => ({ ...d, tasks: [...d.tasks, { id: uid(), text: value, done: false }] }))
    setText('')
  }
  const toggle = (id) =>
    patchDay((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }))
  const remove = (id) => patchDay((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }))
  const setNote = (note) => patchDay((d) => ({ ...d, note }))

  const subtitle = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <>
      <PageHeader title="Today" subtitle={subtitle} />

      <Card className="mb-4">
        <h3 className="font-medium">Your plan</h3>
        <p className="mb-4 text-sm text-zinc-500">
          Pick up to {MAX_TASKS} things you will do today.
        </p>

        {day.tasks.length === 0 && (
          <p className="mb-4 text-sm text-zinc-500">Nothing planned yet. Add your first task below.</p>
        )}

        <ul className="mb-4 space-y-2">
          {day.tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
                className="size-5 accent-[var(--color-accent)]"
                aria-label={`Mark "${t.text}" as done`}
              />
              <span className={`flex-1 ${t.done ? 'text-zinc-400 line-through' : ''}`}>{t.text}</span>
              <Button variant="ghost" onClick={() => remove(t.id)} aria-label={`Remove "${t.text}"`}>
                Remove
              </Button>
            </li>
          ))}
        </ul>

        {day.tasks.length < MAX_TASKS && (
          <form onSubmit={addTask} className="flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="What will you do?" />
            <Button type="submit" disabled={!text.trim()}>
              Add task
            </Button>
          </form>
        )}

        {day.tasks.length > 0 && (
          <p className="mt-4 text-sm text-zinc-500">
            {doneCount} of {day.tasks.length} done
          </p>
        )}
      </Card>

      <Card>
        <h3 className="font-medium">Evening check-in</h3>
        <p className="mb-3 text-sm text-zinc-500">One sentence: what got done, what didn’t, and why.</p>
        <Textarea value={day.note} onChange={(e) => setNote(e.target.value)} placeholder="Today I…" />
      </Card>
    </>
  )
}
