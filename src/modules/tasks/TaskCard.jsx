import { useState } from 'react'
import { Button } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { COLUMNS, LAST } from './constants'
import TagChip from './TagChip'
import TaskEditForm from './TaskEditForm'

// Thin accent line showing where a dragged card will land.
// It is drawn with a pseudo-element so the cards never shift while dragging.
const DROP_LINE = {
  before: 'before:pointer-events-none before:absolute before:inset-x-0 before:-top-[5px] before:h-0.5 before:rounded-full before:bg-accent',
  after: 'after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-[5px] after:h-0.5 after:rounded-full after:bg-accent',
}

// Move / edit / remove buttons. Always visible on small screens;
// on larger screens they float over the card's corner on hover or keyboard focus.
const ACTIONS =
  'mt-2 flex items-center justify-between gap-1 transition-opacity ' +
  'md:absolute md:right-2 md:top-2 md:mt-0 md:rounded-md md:border md:border-zinc-200 md:bg-white md:p-0.5 md:shadow-sm md:opacity-0 ' +
  'md:group-hover:opacity-100 md:group-focus-within:opacity-100 ' +
  'dark:md:border-zinc-700 dark:md:bg-zinc-800'

export default function TaskCard({ task, status, today, tags, dropLine, onMove, onEdit, onRemove, onCreateTag }) {
  const [editing, setEditing] = useState(false)
  const [dragging, setDragging] = useState(false)

  if (editing) {
    return (
      <li data-task-id={task.id} className="rounded-lg border border-accent bg-white p-3 dark:bg-zinc-800">
        <TaskEditForm
          task={task}
          tags={tags}
          onCreateTag={onCreateTag}
          onCancel={() => setEditing(false)}
          onSave={(changes) => {
            onEdit(changes)
            setEditing(false)
          }}
        />
      </li>
    )
  }

  const index = COLUMNS.findIndex((c) => c.id === status)
  const overdue = task.due && task.due < today && status !== LAST
  const selectedIds = task.tagIds ?? []
  const taskTags = tags.filter((t) => selectedIds.includes(t.id))

  return (
    <li
      data-task-id={task.id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
        setDragging(true)
      }}
      onDragEnd={() => setDragging(false)}
      className={`group relative cursor-grab rounded-lg border border-zinc-200 bg-white p-3 transition-opacity active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-800 ${
        dragging ? 'opacity-40' : ''
      } ${dropLine ? DROP_LINE[dropLine] : ''}`}
    >
      {taskTags.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {taskTags.map((t) => (
            <TagChip key={t.id} tag={t} />
          ))}
        </div>
      )}

      <p
        role="button"
        tabIndex={0}
        title="Click to edit"
        onClick={() => setEditing(true)}
        onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
        className={`break-words ${status === LAST ? 'text-zinc-400 line-through' : ''}`}
      >
        {task.text}
      </p>

      {task.due && (
        <p className={`mt-1 text-xs ${overdue ? 'text-red-500' : 'text-zinc-500'}`}>
          {overdue ? 'Overdue: ' : 'Due '}
          {formatDate(`${task.due}T00:00:00`, { day: 'numeric', month: 'short' })}
        </p>
      )}

      <div className={ACTIONS}>
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
        <div className="flex gap-1">
          <Button variant="ghost" className="px-2 py-1" onClick={() => setEditing(true)} aria-label={`Edit "${task.text}"`}>
            Edit
          </Button>
          <Button variant="danger" className="px-2 py-1" onClick={onRemove} aria-label={`Remove "${task.text}"`}>
            Remove
          </Button>
        </div>
      </div>
    </li>
  )
}
