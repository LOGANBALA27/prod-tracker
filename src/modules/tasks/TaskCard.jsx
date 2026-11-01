import { useState } from 'react'
import { Button } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { COLUMNS, LAST, PRIORITIES } from './constants'
import TagChip from './TagChip'
import TaskDetail from './TaskDetail'

// Thin accent line showing where a dragged card will land.
// It is drawn with a pseudo-element so the cards never shift while dragging.
const DROP_LINE = {
  before: 'before:pointer-events-none before:absolute before:inset-x-0 before:-top-[5px] before:h-0.5 before:rounded-full before:bg-accent',
  after: 'after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-[5px] after:h-0.5 after:rounded-full after:bg-accent',
}

// Move / remove buttons. Always visible on small screens;
// on larger screens they float over the card's corner on hover or keyboard focus.
const ACTIONS =
  'mt-2 flex items-center justify-between gap-1 transition-opacity ' +
  'md:absolute md:right-2 md:top-2 md:mt-0 md:opacity-0 ' +
  'md:group-hover:opacity-100 md:group-focus-within:opacity-100'

const plain = (html) =>
  new DOMParser()
    .parseFromString(html.replace(/<\/(p|li|h\d)>/g, ' '), 'text/html')
    .body.textContent.trim()

export default function TaskCard({ task, status, today, tags, dropLine, onMove, onEdit, onRemove, onCreateTag }) {
  const [open, setOpen] = useState(false)
  const [dragging, setDragging] = useState(false)

  const index = COLUMNS.findIndex((c) => c.id === status)
  const overdue = task.due && task.due < today && status !== LAST
  const selectedIds = task.tagIds ?? []
  const taskTags = tags.filter((t) => selectedIds.includes(t.id))
  const priority = PRIORITIES.find((p) => p.id === task.priority)

  return (
    <>
      <li
        data-task-id={task.id}
        draggable
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.target === e.currentTarget && e.key === 'Enter' && setOpen(true)}
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
        {(priority || taskTags.length > 0) && (
          <div className="mb-1.5 flex flex-wrap items-center gap-1">
            {priority && (
  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.chip}`}>
    {priority.label}
  </span>
)}
            {taskTags.map((t) => (
              <TagChip key={t.id} tag={t} />
            ))}
          </div>
        )}

        <p
          role="button"
          tabIndex={0}
          title="Click to open"
          onClick={() => setOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
          className={`break-words ${status === LAST ? 'text-zinc-400 line-through' : ''}`}
        >
          {task.text}
        </p>

        {task.description && (
          <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-zinc-500">
            {plain(task.description)}
          </p>
        )}

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
            <Button
              variant="ghost"
              className="px-2 py-1"
              onClick={onRemove}
              title="Remove task"
              aria-label={`Remove "${task.text}"`}
            >
              🗑️
            </Button>
          </div>
        </div>
      </li>

      {open && (
        <TaskDetail
          task={task}
          status={status}
          tags={tags}
          onCreateTag={onCreateTag}
          onClose={() => setOpen(false)}
          onSave={(changes) => {
            onEdit(changes)
            setOpen(false)
          }}
        />
      )}
    </>
  )
}