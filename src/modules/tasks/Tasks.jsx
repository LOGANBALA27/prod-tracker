import { todayKey } from '../../lib/utils'
import { COLUMNS } from './constants'
import TagFilter from './TagFilter'
import TaskColumn from './TaskColumn'
import { useTasks } from './useTasks'
import { useState } from 'react'
import TaskList from './TaskList'

const VIEW_KEY = 'prod-tracker:tasks-view'

function initialView() {
  try {
    const saved = localStorage.getItem(VIEW_KEY)
    if (saved === 'list' || saved === 'board') return saved
  } catch {
    /* ignore */
  }
  // First visit: list on phones, board on larger screens
  return window.matchMedia('(max-width: 767px)').matches ? 'list' : 'board'
}

export default function Tasks() {
  const {
    items, tags, activeTags, openCount, shownCount, tasksIn,
    addTask, editTask, moveTask, removeTask,
    createTag, deleteTag,
    toggleFilter, clearFilter,
  } = useTasks()

  const [view, setView] = useState(initialView)
  const changeView = (next) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      /* ignore */
    }
  }

  const today = todayKey()
  const actions = { addTask, editTask, moveTask, removeTask, createTag }

  return (
    <>
      <div className="mb-3 flex items-baseline gap-3">
  <h2 className="text-lg font-semibold tracking-tight">Tasks</h2>
  <p className="text-sm text-zinc-500">{openCount} open</p>
  {activeTags.length > 0 && (
    <p className="text-sm text-zinc-500">
      Showing {shownCount} of {items.length}
    </p>
  )}
  <div className="ml-auto flex gap-1 self-center" role="group" aria-label="View">
    {[
      ['list', '☰ List'],
      ['board', '▦ Board'],
    ].map(([id, label]) => (
      <button
        key={id}
        type="button"
        onClick={() => changeView(id)}
        aria-pressed={view === id}
        className={`rounded-lg px-2.5 py-1 text-xs transition ${
          view === id
            ? 'bg-accent/10 font-semibold text-accent'
            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
</div>

      <TagFilter
        tags={tags}
        active={activeTags}
        onToggle={toggleFilter}
        onClear={clearFilter}
        onCreate={createTag}
        onDelete={deleteTag}
      />

      {view === 'list' ? (
  <TaskList tasksIn={tasksIn} tags={tags} today={today} actions={actions} />
) : (
  <div
    className="flex items-start gap-4 overflow-x-auto pb-4 md:grid md:items-stretch md:overflow-visible"
    style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(0, 1fr))` }}
  >
    {COLUMNS.map((col) => (
      <TaskColumn key={col.id} column={col} tasks={tasksIn(col.id)} tags={tags} today={today} actions={actions} />
    ))}
  </div>
)}
    </>
  )
}
