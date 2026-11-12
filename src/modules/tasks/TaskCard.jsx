import { useState } from 'react'
import { Button } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { COLUMNS, FIRST, LAST, PRIORITIES } from './constants'
import TagChip from './TagChip'
import TaskDetail from './TaskDetail'

// Thin accent line showing where a dragged card will land.
// It is drawn with a pseudo-element so the cards never shift while dragging.
const DROP_LINE = {
  before: 'before:pointer-events-none before:absolute before:inset-x-0 before:-top-[5px] before:h-0.5 before:rounded-full before:bg-accent',
  after: 'after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-[5px] after:h-0.5 after:rounded-full after:bg-accent',
}

// Small move / remove buttons. On phones they sit at the right of the row;
// on larger screens they float over the card's corner on hover or keyboard focus.
const ACTIONS =
  'flex shrink-0 items-center ' +
  'md:absolute md:right-1.5 md:top-1.5 md:rounded-md md:bg-white md:opacity-0 md:shadow-sm ' +
  'md:group-hover:opacity-100 md:group-focus-within:opacity-100 dark:md:bg-zinc-800'

const plain = (html) =>
  new DOMParser()
    .parseFromString(html.replace(/<\/(p|li|h\d)>/g, ' '), 'text/html')
    .body.textContent.trim()

export default function TaskCard({ task, status, today, tags, dropLine, onMove, onEdit, onRemove, onCreateTag }) {
  const [open, setOpen] = useState(false)
  const [dragging, setDragging] = useState(false)

  const index = COLUMNS.findIndex((c) => c.id === status)
  const isDone = status === LAST
  const overdue = task.due && task.due < today && !isDone
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
        className={`group relative flex cursor-grab items-start gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 transition-opacity active:cursor-grabbing dark:border-transparent dark:bg-zinc-800 ${
          dragging ? 'opacity-40' : ''
        } ${dropLine ? DROP_LINE[dropLine] : ''}`}
      >
        {/* One-tap complete circle */}
        {/* <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onMove(isDone ? FIRST : LAST)
          }}
          aria-label={isDone ? `Mark "${task.text}" as not done` : `Mark "${task.text}" as done`}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] leading-none transition ${
            isDone
              ? 'border-accent bg-accent text-white'
              : 'border-zinc-400 hover:border-accent dark:border-zinc-500'
          }`}
        >
          {isDone && '✓'}
        </button> */}

        <div className="min-w-0 flex-1">
          {(priority || taskTags.length > 0) && (
            <div className="mb-1 flex flex-wrap items-center gap-1">
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

<p className={`break-words text-[13px] leading-snug ${isDone ? 'text-zinc-400 line-through' : ''}`}>
  {task.text}
</p>

          {task.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{plain(task.description)}</p>
          )}

          {task.due && (
            <p className={`mt-0.5 text-xs ${overdue ? 'text-red-500' : 'text-zinc-500'}`}>
              {overdue ? 'Overdue: ' : 'Due '}
              {formatDate(`${task.due}T00:00:00`, { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>

        {/* stopPropagation so tapping a button doesn't also open the details */}
        <div className={ACTIONS} onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            className="px-1 py-0.5 text-sm text-zinc-400"
            disabled={index === 0}
            onClick={() => onMove(COLUMNS[index - 1].id)}
            aria-label={`Move "${task.text}" to ${COLUMNS[index - 1]?.label}`}
          >
            ‹
          </Button>
          <Button
            variant="ghost"
            className="px-1 py-0.5 text-sm text-zinc-400"
            disabled={index === COLUMNS.length - 1}
            onClick={() => onMove(COLUMNS[index + 1].id)}
            aria-label={`Move "${task.text}" to ${COLUMNS[index + 1]?.label}`}
          >
            ›
          </Button>
          <Button
            variant="ghost"
            className="px-1 py-0.5 text-sm"
            onClick={onRemove}
            title="Remove task"
            aria-label={`Remove "${task.text}"`}
          >
            🗑️
          </Button>
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