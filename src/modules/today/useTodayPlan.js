// Everything that reads/writes planner data lives here.
import { useMemo } from 'react'
import { useModuleData } from '../../data/DataContext'
import { STATUS } from './constants'
import { createLog, createTask, normalizeDay, shiftDateKey } from './model'

const defaults = { days: {} }

export function useTodayPlan(dateKey) {
  const [data, update] = useModuleData('today', defaults)

  const day = useMemo(() => normalizeDay(data.days[dateKey]), [data.days, dateKey])

  const patchDay = (fn) =>
    update((prev) => ({
      ...prev,
      days: { ...prev.days, [dateKey]: fn(normalizeDay(prev.days[dateKey])) },
    }))

  const patchTask = (id, fn) =>
    patchDay((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...fn(t) } : t)),
    }))

  const actions = {
    addTask: (text) => patchDay((d) => ({ ...d, tasks: [...d.tasks, createTask(text)] })),
    remove: (id) => patchDay((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })),
    setNote: (note) => patchDay((d) => ({ ...d, note })),

    markDone: (id) => patchTask(id, () => ({ status: STATUS.DONE, reason: '' })),
    markSkipped: (id, reason) => patchTask(id, () => ({ status: STATUS.SKIPPED, reason })),
    reopen: (id) => patchTask(id, () => ({ status: STATUS.PENDING, reason: '' })),

    addLog: (id, entry) => patchTask(id, (t) => ({ logs: [...t.logs, createLog(entry)] })),
    removeLog: (id, logId) => patchTask(id, (t) => ({ logs: t.logs.filter((l) => l.id !== logId) })),

    // Remove from today, add to tomorrow as a fresh pending task (logs stay with it).
    moveToTomorrow: (id) =>
      update((prev) => {
        const today = normalizeDay(prev.days[dateKey])
        const task = today.tasks.find((t) => t.id === id)
        if (!task) return prev
        const tomorrowKey = shiftDateKey(dateKey, 1)
        const tomorrow = normalizeDay(prev.days[tomorrowKey])
        return {
          ...prev,
          days: {
            ...prev.days,
            [dateKey]: { ...today, tasks: today.tasks.filter((t) => t.id !== id) },
            [tomorrowKey]: {
              ...tomorrow,
              tasks: [...tomorrow.tasks, { ...task, status: STATUS.PENDING, reason: '' }],
            },
          },
        }
      }),
  }

  return { tasks: day.tasks, note: day.note, actions }
}