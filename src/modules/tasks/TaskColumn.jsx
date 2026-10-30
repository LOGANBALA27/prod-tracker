import { useEffect, useRef, useState } from 'react'
import AddTask from './AddTask'
import TaskCard from './TaskCard'

// One board column. Handles dropping cards, including where in the column they land.
export default function TaskColumn({ column, tasks, tags, today, actions }) {
  const listRef = useRef(null)

  // Where a dragged card would land, as an index into `tasks`
  // (tasks.length means "at the end"). null means nothing is being dragged over.
  const [dropIndex, setDropIndex] = useState(null)
  const isOver = dropIndex !== null

  // If a drag is cancelled (e.g. Escape), clear the highlight.
  useEffect(() => {
    const reset = () => setDropIndex(null)
    window.addEventListener('dragend', reset)
    return () => window.removeEventListener('dragend', reset)
  }, [])

  // Finds the first card whose middle is below the pointer.
  const indexAt = (clientY) => {
    const cards = listRef.current.querySelectorAll('[data-task-id]')
    for (let i = 0; i < cards.length; i++) {
      const box = cards[i].getBoundingClientRect()
      if (clientY < box.top + box.height / 2) return i
    }
    return cards.length
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDropIndex(indexAt(e.clientY))
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDropIndex(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      // Skip the dragged card itself, so dropping it back in place changes nothing.
      const before = tasks.slice(indexAt(e.clientY)).find((t) => t.id !== id)
      actions.moveTask(id, column.id, before?.id ?? null)
    }
    setDropIndex(null)
  }

  const dropLineFor = (i) => {
    if (dropIndex === i) return 'before'
    if (dropIndex === tasks.length && i === tasks.length - 1) return 'after'
    return null
  }

  return (
    <section
      aria-label={column.label}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-40 w-[85vw] max-w-80 shrink-0 rounded-xl p-3 transition md:w-auto md:max-w-none ${
        isOver
          ? 'bg-accent/10 outline-2 outline-dashed outline-accent'
          : 'bg-zinc-100 dark:bg-zinc-900/60'
      }`}
    >
      <h3 className="mb-3 flex items-center justify-between text-sm font-medium">
        {column.label}
        <span className="text-zinc-500">{tasks.length}</span>
      </h3>

      <ul ref={listRef} className="space-y-2">
        {tasks.map((t, i) => (
          <TaskCard
            key={t.id}
            task={t}
            status={column.id}
            today={today}
            tags={tags}
            dropLine={dropLineFor(i)}
            onMove={(status) => actions.moveTask(t.id, status)}
            onEdit={(changes) => actions.editTask(t.id, changes)}
            onRemove={() => actions.removeTask(t.id)}
            onCreateTag={actions.createTag}
          />
        ))}
        {tasks.length === 0 && (
          <li
            className={`rounded-lg border border-dashed p-4 text-center text-xs ${
              isOver ? 'border-accent text-accent' : 'border-zinc-300 text-zinc-500 dark:border-zinc-700'
            }`}
          >
            Drop tasks here
          </li>
        )}
      </ul>

      {column.canAdd && (
        <div className="mt-3">
          <AddTask
            tags={tags}
            onCreateTag={actions.createTag}
            onAdd={(text, due, tagIds) => actions.addTask(column.id, text, due, tagIds)}
          />
        </div>
      )}
    </section>
  )
}
