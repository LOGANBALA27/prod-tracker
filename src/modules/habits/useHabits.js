import { useModuleData } from '../../data/DataContext'

const defaults = { items: [] }

// All habit logic lives here, so the components only draw things.
export function useHabits() {
  const [state, update] = useModuleData('habits', defaults)
  const items = state.items ?? []
  const setItems = (fn) => update((prev) => ({ ...prev, items: fn(prev.items ?? []) }))

  const addHabit = ({ name, quit }) =>
    setItems((list) => [
      ...list,
      { id: crypto.randomUUID(), name, quit: !!quit, log: {}, createdAt: Date.now() },
    ])

  const editHabit = (id, changes) =>
    setItems((list) => list.map((h) => (h.id === id ? { ...h, ...changes } : h)))

  const removeHabit = (id) => setItems((list) => list.filter((h) => h.id !== id))

  // Sets the status of one day. Setting the same status again clears it.
  // status: 'done' | 'missed' | null
  const mark = (id, day, status) =>
    setItems((list) =>
      list.map((h) => {
        if (h.id !== id) return h
        const log = { ...h.log }
        if (!status || log[day] === status) delete log[day]
        else log[day] = status
        return { ...h, log }
      })
    )

  // Evening shortcut: marks every habit that has no answer for this day as done.
  const markRestDone = (day) =>
    setItems((list) =>
      list.map((h) => (h.log?.[day] ? h : { ...h, log: { ...h.log, [day]: 'done' } }))
    )

  return { items, addHabit, editHabit, removeHabit, mark, markRestDone }
}