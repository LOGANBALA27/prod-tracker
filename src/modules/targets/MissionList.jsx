import { useState } from 'react'
import { Button, Input } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { hasKids, isDone, leaves } from './missionTree'

const INDENT = 24 // pixels added per level

// One mission and, underneath it, its children (this component calls itself).
// `number` is the outline number, e.g. "1", "1.1", "1.1.1".
function MissionItem({ mission, number, today, onAdd, onToggle, onRemove }) {
  const [expanded, setExpanded] = useState(true)
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')

  const parent = hasKids(mission)
  const done = isDone(mission)
  const overdue = mission.due && mission.due < today && !done
  const steps = parent ? leaves(mission.children) : []
  const stepsDone = steps.filter((s) => s.done).length

  const submit = (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onAdd(value, '', mission.id)
    setText('')
    setExpanded(true)
  }

  const remove = () => {
    if (parent && !window.confirm(`Delete "${mission.text}" and its ${steps.length} sub-missions?`)) return
    onRemove(mission.id)
  }

  return (
    <li>
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
        {parent ? (
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            className="w-4 shrink-0 text-xs text-zinc-500"
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <input
          type="checkbox"
          checked={done}
          disabled={parent}
          title={parent ? 'Finish all sub-missions to complete this' : undefined}
          onChange={(e) => onToggle(mission.id, e)}
          aria-label={`Mark "${mission.text}" as done`}
        />

        <div className="min-w-0 flex-1">
          <p className={`break-words text-sm ${done ? 'text-zinc-400 line-through' : ''}`}>
            <span className="mr-1.5 font-mono text-xs text-zinc-400">{number}</span>
            {mission.text}
            {parent && (
              <span className="ml-2 text-xs text-zinc-500">
                {stepsDone}/{steps.length}
              </span>
            )}
          </p>
          {mission.due && (
            <p className={`text-xs ${overdue ? 'text-red-500' : 'text-zinc-500'}`}>
              {overdue ? 'Overdue: ' : 'Due '}
              {formatDate(`${mission.due}T00:00:00`, { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          aria-label={`Add a sub-mission to "${mission.text}"`}
          title="Add sub-mission"
          className="rounded px-1.5 text-sm text-zinc-400 hover:text-accent"
        >
          ＋
        </button>
        <button
          type="button"
          onClick={remove}
          aria-label={`Remove "${mission.text}"`}
          className="rounded px-1.5 text-zinc-400 hover:text-red-500"
        >
          ✕
        </button>
      </div>

      {adding && (
        <form
          onSubmit={submit}
          onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
          className="mt-1.5 flex gap-2"
          style={{ marginLeft: INDENT }}
        >
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Sub-mission of "${mission.text}"`}
            className="min-w-0 flex-1"
          />
          <Button type="submit" disabled={!text.trim()}>Add</Button>
        </form>
      )}

      {parent && expanded && (
        <ul
          className="mt-1.5 space-y-1.5 border-l-2 border-zinc-200 dark:border-zinc-700"
          style={{ marginLeft: 10, paddingLeft: INDENT - 10 }}
        >
          {mission.children.map((c, i) => (
            <MissionItem
              key={c.id}
              mission={c}
              number={`${number}.${i + 1}`}
              today={today}
              onAdd={onAdd}
              onToggle={onToggle}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function MissionList({ target, today, onAdd, onToggle, onRemove }) {
  const [text, setText] = useState('')
  const [due, setDue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onAdd(value, due, null)
    setText('')
    setDue('')
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {target.missions.map((m, i) => (
          <MissionItem
            key={m.id}
            mission={m}
            number={String(i + 1)}
            today={today}
            onAdd={onAdd}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}
        {target.missions.length === 0 && (
          <li className="text-xs text-zinc-500">No missions yet. Add the first small step below.</li>
        )}
      </ul>

      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a mission"
          className="min-w-40 flex-1"
        />
        <Input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Mission due date (optional)"
        />
        <Button type="submit" disabled={!text.trim()}>Add</Button>
      </form>
    </div>
  )
}