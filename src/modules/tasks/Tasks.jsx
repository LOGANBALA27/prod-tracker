import { todayKey } from '../../lib/utils'
import { COLUMNS } from './constants'
import TagFilter from './TagFilter'
import TaskColumn from './TaskColumn'
import { useTasks } from './useTasks'

export default function Tasks() {
  const {
    items, tags, activeTags, openCount, shownCount, tasksIn,
    addTask, editTask, moveTask, removeTask,
    createTag, deleteTag,
    toggleFilter, clearFilter,
  } = useTasks()

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
      </div>

      <TagFilter
        tags={tags}
        active={activeTags}
        onToggle={toggleFilter}
        onClear={clearFilter}
        onCreate={createTag}
        onDelete={deleteTag}
      />

      <div
        className="flex items-start gap-4 overflow-x-auto pb-4 md:grid md:items-stretch md:overflow-visible"
        style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(0, 1fr))` }}
      >
        {COLUMNS.map((col) => (
          <TaskColumn key={col.id} column={col} tasks={tasksIn(col.id)} tags={tags} today={today} actions={actions} />
        ))}
      </div>
    </>
  )
}
