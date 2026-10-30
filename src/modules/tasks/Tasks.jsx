import { useState } from 'react'
import { useModuleData } from '../../data/DataContext'
import { Button, Input } from '../../components/ui'
import { formatDate, todayKey, uid } from '../../lib/utils'

// Add, rename or reorder columns here. The board updates by itself.
// canAdd: true shows the "+ Add a task" button in that column.
const COLUMNS = [
  { id: 'todo', label: 'To do', canAdd: true },
  { id: 'doing', label: 'In progress' },
  { id: 'done', label: 'Done' },
]
const FIRST = COLUMNS[0].id
const LAST = COLUMNS[COLUMNS.length - 1].id

const defaults = { items: [] }

// Older tasks used done: true/false, and tasks in a removed column
// fall back to the first one, so nothing disappears.
const statusOf = (t) => {
  const s = t.status ?? (t.done ? LAST : FIRST)
  return COLUMNS.some((c) => c.id === s) ? s : FIRST
}

function TaskCard({ task, status, today, onMove, onRemove }) {
  const index = COLUMNS.findIndex((c) => c.id === status)
  const overdue = task.due && task.due < today && status !== LAST

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className="cursor-grab rounded-lg border border-zinc-200 bg-white p-3 active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-800"
    >
      <p className={status === LAST ? 'text-zinc-400 line-through' : ''}>{task.text}</p>
      {task.due && (
        <p className={`mt-1 text-xs ${overdue ? 'text-red-500' : 'text-zinc-500'}`}>
          {overdue ? 'Overdue: ' : 'Due '}
          {formatDate(`${task.due}T00:00:00`, { day: 'numeric', month: 'short' })}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            className="px-2 py-1"
            disabled={index === 0}
            onClick={() => onMove(COLUMNS[index - 1].id)}
            aria-label={`Move "${task.text}" to ${COLUMNS[index - 1]?.label}`}
          >
            ‹
          </Button>
          <Button
            variant="ghost"
            className="px-2 py-1"
            disabled={index === COLUMNS.length - 1}
            onClick={() => onMove(COLUMNS[index + 1].id)}
            aria-label={`Move "${task.text}" to ${COLUMNS[index + 1]?.label}`}
          >
            ›
          </Button>
        </div>
        <Button variant="danger" className="px-2 py-1" onClick={onRemove} aria-label={`Remove "${task.text}"`}>
          Remove
        </Button>
      </div>
    </li>
  )
}

function AddTask({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [due, setDue] = useState('')

  const close = () => {
    setOpen(false)
    setText('')
    setDue('')
  }

  const submit = (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onAdd(value, due || null)
    setText('')
    setDue('')
  }

  if (!open) {
    return (
      <Button variant="ghost" className="w-full text-left" onClick={() => setOpen(true)}>
        + Add a task
      </Button>
    )
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      className="space-y-2"
    >
      <Input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Task name"
      />
      <Input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        aria-label="Due date (optional)"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={!text.trim()}>
          Add task
        </Button>
        <Button type="button" variant="ghost" onClick={close}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default function Tasks() {
  const [data, update] = useModuleData('tasks', defaults)
  const [overColumn, setOverColumn] = useState(null)
  const today = todayKey()

  const add = (status, text, due) =>
    update((prev) => ({
      ...prev,
      items: [...prev.items, { id: uid(), text, status, due }],
    }))

  const move = (id, status) =>
    update((prev) => ({
      ...prev,
      items: prev.items.map((t) => (t.id === id ? { ...t, status } : t)),
    }))

  const remove = (id) => update((prev) => ({ ...prev, items: prev.items.filter((t) => t.id !== id) }))

  const openCount = data.items.filter((t) => statusOf(t) !== LAST).length

  return (
    <>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Tasks</h2>
        <p className="text-sm text-zinc-500">{openCount} open</p>
        </div>

      <div
  className="flex items-start gap-4 overflow-x-auto pb-4 md:grid md:items-stretch md:overflow-visible"
  style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(0, 1fr))` }}
>
        {COLUMNS.map((col) => {
          const tasks = data.items.filter((t) => statusOf(t) === col.id)
          return (
            <section
              key={col.id}
              aria-label={col.label}
              onDragOver={(e) => {
                e.preventDefault()
                setOverColumn(col.id)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOverColumn(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/plain')
                if (id) move(id, col.id)
                setOverColumn(null)
              }}
              className={`min-h-40 w-[85vw] max-w-80 shrink-0 rounded-xl p-3 transition md:w-auto md:max-w-none ${
                overColumn === col.id
                  ? 'bg-accent/10 outline-2 outline-dashed outline-accent'
                  : 'bg-zinc-100 dark:bg-zinc-900/60'
              }`}
            >
              <h3 className="mb-3 flex items-center justify-between text-sm font-medium">
                {col.label}
                <span className="text-zinc-500">{tasks.length}</span>
              </h3>
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    status={col.id}
                    today={today}
                    onMove={(status) => move(t.id, status)}
                    onRemove={() => remove(t.id)}
                  />
                ))}
              </ul>
              {col.canAdd && (
                <div className="mt-3">
                  <AddTask onAdd={(text, due) => add(col.id, text, due)} />
                </div>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}