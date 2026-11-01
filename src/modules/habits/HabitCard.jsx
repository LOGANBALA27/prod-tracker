import { useState } from 'react'
import { Button, Input } from '../../components/ui'
import MonthCalendar from './MonthCalendar'
import RecentDays from './RecentDays'
import { currentStreak } from './streak'

const BOX = 'rounded-lg border border-zinc-200 bg-transparent p-3 dark:border-zinc-700'

export default function HabitCard({ habit, today, onMark, onEdit, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(habit.name)
  const [showCal, setShowCal] = useState(false)

  const log = habit.log ?? {}
  const streak = currentStreak(log, today)
  const status = log[today]
  const atRisk = streak > 0 && !status

  const labels = habit.quit
    ? { done: 'Stayed clean', missed: 'Slipped' }
    : { done: 'Done', missed: 'Missed' }

  const saveName = () => {
    const value = name.trim()
    if (value) onEdit({ name: value })
    setEditing(false)
  }

  return (
    <div className={BOX}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div
              className="flex gap-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName()
                if (e.key === 'Escape') setEditing(false)
              }}
            >
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label="Habit name" />
              <Button onClick={saveName}>Save</Button>
            </div>
          ) : (
            <p className="break-words font-medium">{habit.name}</p>
          )}
          <p className="mt-0.5 text-xs text-zinc-500">
            <span className={streak > 0 ? 'font-semibold text-orange-500' : ''}>
              🔥 {streak} {streak === 1 ? 'day' : 'days'}
            </span>
            {atRisk && <span className="text-amber-600 dark:text-amber-400"> · Mark today to keep it</span>}
          </p>
        </div>

        <Button
          variant="ghost"
          className="px-1.5 py-0.5"
          onClick={() => setShowCal((v) => !v)}
          aria-expanded={showCal}
          title={showCal ? 'Hide calendar' : 'Show calendar'}
          aria-label={showCal ? 'Hide calendar' : 'Show calendar'}
        >
          📅
        </Button>
        <Button
          variant="ghost"
          className="px-1.5 py-0.5"
          onClick={() => {
            setName(habit.name)
            setEditing(true)
          }}
          title="Rename"
          aria-label={`Rename "${habit.name}"`}
        >
          ✏️
        </Button>
        <Button
          variant="ghost"
          className="px-1.5 py-0.5 hover:text-red-500"
          onClick={() => {
            if (window.confirm(`Delete "${habit.name}" and its history?`)) onRemove()
          }}
          title="Delete"
          aria-label={`Delete "${habit.name}"`}
        >
          🗑️
        </Button>
      </div>

      <div className="mt-3">
        <RecentDays log={log} today={today} onMark={onMark} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant={status === 'done' ? 'primary' : 'ghost'}
          className="px-3 py-1"
          aria-pressed={status === 'done'}
          onClick={() => onMark(today, 'done')}
        >
          ✓ {labels.done}
        </Button>
        <Button
          variant={status === 'missed' ? 'danger' : 'ghost'}
          className="px-3 py-1"
          aria-pressed={status === 'missed'}
          onClick={() => onMark(today, 'missed')}
        >
          ✗ {labels.missed}
        </Button>
      </div>

      {showCal && <MonthCalendar log={log} today={today} onMark={onMark} />}
    </div>
  )
}