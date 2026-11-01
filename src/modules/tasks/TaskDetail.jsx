import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/ui'
import { COLUMNS, toggleId } from './constants'
import PrioritySelect from './PrioritySelect'
import RichEditor from './RichEditor'
import TagSelect from './TagSelect'

const FIELD =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 ' +
  'focus-visible:outline-2 focus-visible:outline-accent'

// Modal with the full details of one task.
export default function TaskDetail({ task, status, tags, onCreateTag, onSave, onClose }) {
  const [text, setText] = useState(task.text)
  const [due, setDue] = useState(task.due ?? '')
  const [tagIds, setTagIds] = useState(task.tagIds ?? [])
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState(task.priority ?? '')

  const dirty =
    text !== task.text ||
    (due || null) !== (task.due ?? null) ||
    description !== (task.description ?? '') ||
    priority !== (task.priority ?? '') ||
    JSON.stringify(tagIds) !== JSON.stringify(task.tagIds ?? [])

  const requestClose = () => {
    if (dirty && !window.confirm('Discard your changes?')) return
    onClose()
  }

  const submit = (e) => {
    e?.preventDefault()
    const value = text.trim()
    if (!value) return
    onSave({
      text: value,
      due: due || null,
      tagIds,
      description: description.trim(),
      priority: priority || undefined,
    })
  }

  // Stop the page behind the dialog from scrolling.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const column = COLUMNS.find((c) => c.id === status)

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && requestClose()}
      // Keep drag events inside the dialog from reaching the board
      onDragStart={(e) => e.stopPropagation()}
      onDragOver={(e) => e.stopPropagation()}
      onDrop={(e) => e.stopPropagation()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        onSubmit={submit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') requestClose()
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
        }}
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {column?.label}
          </span>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Task name"
          aria-label="Task name"
          className={`${FIELD} text-base font-semibold`}
        />

        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">Description</p>
          <RichEditor value={description} onChange={setDescription} />
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">Priority</p>
          <PrioritySelect value={priority} onChange={setPriority} />
        </div>

        <div>
          <label htmlFor="task-due" className="mb-1 block text-xs font-medium text-zinc-500">
            Due date
          </label>
          <input
            id="task-due"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className={FIELD}
          />
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">Tags</p>
          <TagSelect
            tags={tags}
            selected={tagIds}
            onToggle={(id) => setTagIds((prev) => toggleId(prev, id))}
            onCreate={onCreateTag}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={!text.trim()}>
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={requestClose}>
            Cancel
          </Button>
          <span className="ml-auto hidden text-xs text-zinc-400 sm:inline">Ctrl+Enter to save</span>
        </div>
      </form>
    </div>,
    document.body
  )
}