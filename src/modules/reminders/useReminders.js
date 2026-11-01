import { useMemo, useState } from 'react'
import { useModuleData } from '../../data/DataContext'
import { plainText } from '../../lib/text'
import { useTasks } from '../tasks/useTasks'
import { toggleId } from '../tasks/constants'

const defaults = { items: [] }

// All reminder logic lives here, so the components only draw things.
// Tags are shared with the Tasks page (same tag list, create and delete work in both).
export function useReminders() {
  const [state, update] = useModuleData('reminders', defaults)
  const { tags, createTag, deleteTag } = useTasks()
  const [activeTags, setActiveTags] = useState([])
  const [query, setQuery] = useState('')

  const items = state.items ?? []
  const setItems = (fn) => update((prev) => ({ ...prev, items: fn(prev.items ?? []) }))

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const nameOf = (id) => tags.find((t) => t.id === id)?.name ?? ''

    const filtered = items.filter((r) => {
      const ids = r.tagIds ?? []
      if (activeTags.length && !ids.some((id) => activeTags.includes(id))) return false
      if (!needle) return true
      const haystack = [r.text, plainText(r.description), ...ids.map(nameOf)]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })

    // Pinned first; otherwise keeps the order they were added
    return filtered.sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
  }, [items, activeTags, query, tags])

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
    query,
    setQuery,
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