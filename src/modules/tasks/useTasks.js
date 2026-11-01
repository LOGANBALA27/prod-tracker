import { useState } from 'react'
import { useModuleData } from '../../data/DataContext'
import { uid } from '../../lib/utils'
import { LAST, statusOf, toggleId } from './constants'

const defaults = { items: [], tags: [] }

// All task and tag data plus every action that changes it.
// The components only display things and call these functions.
export function useTasks() {
  const [data, update] = useModuleData('tasks', defaults)
  const [activeTags, setActiveTags] = useState([])
  const [activePriorities, setActivePriorities] = useState([])

  const items = data.items
  const tags = data.tags ?? [] // older saved data has no tags list yet

  /* ----- tasks ----- */

  // priority is 'high' | 'medium' | 'low', or undefined for none
  const addTask = (status, text, due, tagIds, priority) =>
    update((prev) => ({
      ...prev,
      items: [...prev.items, { id: uid(), text, status, due, tagIds, priority }],
    }))

  // changes: any of { text, due, tagIds, priority }
  const editTask = (id, changes) =>
    update((prev) => ({
      ...prev,
      items: prev.items.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    }))

  // Moves a task to a column. Order inside a column follows the order of the
  // items list, so beforeId places it above that task (or at the end if null).
  const moveTask = (id, status, beforeId = null) =>
    update((prev) => {
      const task = prev.items.find((t) => t.id === id)
      if (!task) return prev
      const rest = prev.items.filter((t) => t.id !== id)
      const moved = { ...task, status }
      const at = beforeId ? rest.findIndex((t) => t.id === beforeId) : -1
      if (at === -1) return { ...prev, items: [...rest, moved] }
      return { ...prev, items: [...rest.slice(0, at), moved, ...rest.slice(at)] }
    })

  const removeTask = (id) =>
    update((prev) => ({ ...prev, items: prev.items.filter((t) => t.id !== id) }))

  /* ----- tags ----- */

  // Creates a tag (or reuses one with the same name) and returns it.
  const createTag = (name, color) => {
    const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
    if (existing) return existing
    const tag = { id: uid(), name, color }
    update((prev) => ({ ...prev, tags: [...(prev.tags ?? []), tag] }))
    return tag
  }

  const deleteTag = (tagId) => {
    update((prev) => ({
      ...prev,
      tags: (prev.tags ?? []).filter((t) => t.id !== tagId),
      items: prev.items.map((t) =>
        t.tagIds?.includes(tagId) ? { ...t, tagIds: t.tagIds.filter((id) => id !== tagId) } : t,
      ),
    }))
    setActiveTags((prev) => prev.filter((id) => id !== tagId))
  }

  /* ----- filters ----- */

  const toggleFilter = (tagId) => setActiveTags((prev) => toggleId(prev, tagId))
  const clearFilter = () => setActiveTags([])

  const togglePriority = (id) => setActivePriorities((prev) => toggleId(prev, id))
  const clearPriorities = () => setActivePriorities([])

  // With a tag filter on, a task shows if it has any of the selected tags.
  const matchesTags = (t) =>
    activeTags.length === 0 || (t.tagIds ?? []).some((id) => activeTags.includes(id))

  // With a priority filter on, a task shows if its priority is one of the selected.
  const matchesPriority = (t) =>
    activePriorities.length === 0 || activePriorities.includes(t.priority)

  // Both filters must pass (tags AND priority).
  const matchesFilter = (t) => matchesTags(t) && matchesPriority(t)

  const tasksIn = (columnId) => items.filter((t) => statusOf(t) === columnId && matchesFilter(t))

  return {
    items,
    tags,
    activeTags,
    activePriorities,
    openCount: items.filter((t) => statusOf(t) !== LAST).length,
    shownCount: items.filter(matchesFilter).length,
    tasksIn,
    addTask,
    editTask,
    moveTask,
    removeTask,
    createTag,
    deleteTag,
    toggleFilter,
    clearFilter,
    togglePriority,
    clearPriorities,
  }
}