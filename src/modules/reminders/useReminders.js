import { useMemo, useState } from 'react'
import { useModuleData } from '../../data/DataContext'
import { useTasks } from '../tasks/useTasks'
import { toggleId } from '../tasks/constants'

const defaults = { items: [] }

// All reminder logic lives here, so the components only draw things.
// Tags are shared with the Tasks page (same tag list, create and delete work in both).
export function useReminders() {
  const [state, update] = useModuleData('reminders', defaults)
  const { tags, createTag, deleteTag } = useTasks()
  const [activeTags, setActiveTags] = useState([])

  const items = state.items ?? []
  const setItems = (fn) => update((prev) => ({ ...prev, items: fn(prev.items ?? []) }))

  const shown = useMemo(() => {
    const filtered = activeTags.length
      ? items.filter((r) => (r.tagIds ?? []).some((id) => activeTags.includes(id)))
      : items
    // Pinned first; otherwise keeps the order they were added
    return [...filtered].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
  }, [items, activeTags])

  const addReminder = ({ text, description, tagIds }) =>
    setItems((list) => [
      ...list,
      { id: crypto.randomUUID(), text, description, tagIds, pinned: false, createdAt: Date.now() },
    ])

  const editReminder = (id, changes) =>
    setItems((list) => list.map((r) => (r.id === id ? { ...r, ...changes } : r)))

  const togglePin = (id) =>
    setItems((list) => list.map((r) => (r.id === id ? { ...r, pinned: !r.pinned } : r)))

  const removeReminder = (id) => setItems((list) => list.filter((r) => r.id !== id))

  return {
    items,
    shown,
    tags,
    activeTags,
    createTag,
    deleteTag,
    toggleFilter: (id) => setActiveTags((prev) => toggleId(prev, id)),
    clearFilter: () => setActiveTags([]),
    addReminder,
    editReminder,
    togglePin,
    removeReminder,
  }
}