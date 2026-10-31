import { useState } from 'react'
import { COLUMNS, LAST } from './constants'
import AddTask from './AddTask'
import TaskCard from './TaskCard'

// Mobile-friendly view: one collapsible section per status, cards stacked vertically.
export default function TaskList({ tasksIn, tags, today, actions }) {
  // The last column (done) starts collapsed to keep the list short.
  const [closed, setClosed] = useState({ [LAST]: true })

  return (
    <div className="space-y-3 pb-4">
      {COLUMNS.map((col) => {
        const tasks = tasksIn(col.id)
        const isClosed = !!closed[col.id]
        return (
          <section
            key={col.id}
            aria-label={col.label}
            className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900/60"
          >
            <button
              type="button"
              aria-expanded={!isClosed}
              onClick={() => setClosed((prev) => ({ ...prev, [col.id]: !prev[col.id] }))}
              className="flex w-full items-center justify-between text-sm font-medium"
            >
              <span>
                {isClosed ? '▸' : '▾'} {col.label}
              </span>
              <span className="text-zinc-500">{tasks.length}</span>
            </button>

            {!isClosed && (
              <>
                <ul className="mt-3 space-y-2">
                  {tasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      status={col.id}
                      today={today}
                      tags={tags}
                      dropLine={null}
                      onMove={(status) => actions.moveTask(t.id, status)}
                      onEdit={(changes) => actions.editTask(t.id, changes)}
                      onRemove={() => actions.removeTask(t.id)}
                      onCreateTag={actions.createTag}
                    />
                  ))}
                  {tasks.length === 0 && (
                    <li className="py-2 text-center text-xs text-zinc-500">No tasks</li>
                  )}
                </ul>

                {col.canAdd && (
                  <div className="mt-3">
                    <AddTask
                      tags={tags}
                      onCreateTag={actions.createTag}
                      onAdd={(text, due, tagIds) => actions.addTask(col.id, text, due, tagIds)}
                    />
                  </div>
                )}
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}