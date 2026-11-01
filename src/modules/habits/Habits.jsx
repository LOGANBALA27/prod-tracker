import { useState } from 'react'
import { Button, Input, PageHeader } from '../../components/ui'
import { todayKey } from '../../lib/utils'
import HabitCard from './HabitCard'
import { useHabits } from './useHabits'

export default function Habits() {
  const { items, addHabit, editHabit, removeHabit, mark, markRestDone } = useHabits()
  const [name, setName] = useState('')
  const [quit, setQuit] = useState(false)

  const today = todayKey()
  const doneCount = items.filter((h) => h.log?.[today] === 'done').length
  const unmarked = items.filter((h) => !h.log?.[today]).length

  const add = (e) => {
    e.preventDefault()
    const value = name.trim()
    if (!value) return
    addHabit({ name: value, quit })
    setName('')
    setQuit(false)
  }

  return (
    <>
      <PageHeader title="Habits" />

      <form onSubmit={add} className="mb-4 space-y-2">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New habit, e.g. No smoking"
            aria-label="New habit"
          />
          <Button type="submit" disabled={!name.trim()}>
            Add
          </Button>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={quit} onChange={(e) => setQuit(e.target.checked)} />
          Something I'm quitting (buttons read "Stayed clean" and "Slipped")
        </label>
      </form>

      {items.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-zinc-500">
            Today: {doneCount} of {items.length} done
          </p>
          {unmarked > 0 && (
            <Button variant="ghost" className="ml-auto px-3 py-1" onClick={() => markRestDone(today)}>
              Mark remaining as done
            </Button>
          )}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-sm text-zinc-500">
          No habits yet. Add one above, then check in every evening to build a streak.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((h) => (
          <li key={h.id}>
            <HabitCard
              habit={h}
              today={today}
              onMark={(day, status) => mark(h.id, day, status)}
              onEdit={(changes) => editHabit(h.id, changes)}
              onRemove={() => removeHabit(h.id)}
            />
          </li>
        ))}
      </ul>
    </>
  )
}