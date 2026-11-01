import { useState } from 'react'
import { Button } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { burst } from './confetti'
import MissionList from './MissionList'
import { ancestors, findIn, isDone, leaves } from './missionTree'
import ProgressRing from './ProgressRing'

const WEEK = 7 * 24 * 60 * 60 * 1000

const daysBetween = (from, to) =>
  Math.ceil((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000)

const cheer = (percent, total, complete) => {
  if (total === 0) return 'Add your first mission to get started.'
  if (complete) return 'Target achieved. You did it!'
  if (percent >= 75) return 'Almost there. Finish strong!'
  if (percent >= 50) return 'Past halfway. Keep the momentum!'
  if (percent >= 25) return 'Good progress. One mission at a time.'
  if (percent > 0) return 'Nice start. The first step is the hardest.'
  return 'Ready when you are. Pick off the first mission.'
}

export default function TargetCard({ target, today, actions }) {
  const [open, setOpen] = useState(false)

  const missions = target.missions
  // Progress counts only the smallest missions (the ones with no children).
  const steps = leaves(missions)
  const total = steps.length
  const doneCount = steps.filter((m) => m.done).length
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100)
  const complete = total > 0 && doneCount === total
  const next = steps.find((m) => !m.done)
  const nextPath = next ? ancestors(missions, next.id) ?? [] : []
  const thisWeek = steps.filter((m) => m.doneAt && Date.now() - m.doneAt < WEEK).length
  const nextTop = missions.find((m) => !isDone(m))

  let deadlineText = null
  let late = false
  if (target.deadline) {
    const left = daysBetween(today, target.deadline)
    late = left < 0 && !complete
    deadlineText = late
      ? `${-left} day${left === -1 ? '' : 's'} overdue`
      : left === 0
        ? 'Due today'
        : `${left} day${left === 1 ? '' : 's'} left`
  }

  // Finishing a mission fires confetti from the clicked control;
  // finishing the very last one fires a much bigger burst.
  const toggle = (missionId, e) => {
    const m = findIn(missions, missionId)
    if (m && !m.done) {
      const box = e.currentTarget.getBoundingClientRect()
      burst(box.left + box.width / 2, box.top + box.height / 2, doneCount === total - 1 ? 140 : 28)
    }
    actions.toggleMission(target.id, missionId)
  }

  const remove = () => {
    if (window.confirm(`Delete "${target.title}" and all its missions?`)) {
      actions.removeTarget(target.id)
    }
  }

  return (
    <section
      className={`space-y-4 rounded-xl border p-4 transition ${
        complete
          ? 'border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-500/10'
          : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <ProgressRing percent={percent} complete={complete} />
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-semibold">{target.title}</h3>
          <p className="text-xs text-zinc-500">
            {doneCount} of {total} missions done
            {target.deadline && (
              <span className={late ? 'text-red-500' : ''}>
                {' · '}
                {formatDate(`${target.deadline}T00:00:00`, { day: 'numeric', month: 'short' })}
                {' · '}
                {deadlineText}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs font-medium text-accent">{cheer(percent, total, complete)}</p>
        </div>
        <Button variant="ghost" className="px-2 py-1" onClick={remove} aria-label={`Delete "${target.title}"`}>
          🗑️
        </Button>
      </div>

      {missions.length > 0 && missions.length <= 15 && (
        <ol className="flex items-center" aria-label="Mission journey">
          {missions.map((m) => (
            <li key={m.id} className="flex flex-1 items-center">
              <span
                title={m.text}
                className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 transition ${
                  isDone(m)
                    ? 'border-accent bg-accent'
                    : m.id === nextTop?.id
                      ? 'animate-pulse border-accent'
                      : 'border-zinc-300 dark:border-zinc-600'
                }`}
              />
              <span
                className={`h-0.5 flex-1 transition ${
                  isDone(m) ? 'bg-accent' : 'bg-zinc-200 dark:bg-zinc-700'
                }`}
              />
            </li>
          ))}
          <li className={`text-lg leading-none ${complete ? '' : 'opacity-40 grayscale'}`} aria-hidden="true">
            🏆
          </li>
        </ol>
      )}

      {thisWeek > 0 && (
        <p className="text-xs text-zinc-500">
          🔥 {thisWeek} mission{thisWeek === 1 ? '' : 's'} done this week
        </p>
      )}

      {next && (
        <div className="rounded-lg bg-accent/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Next mission</p>
          {nextPath.length > 0 && (
            <p className="mt-1 break-words text-xs text-zinc-500">{nextPath.join(' › ')}</p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <p className="flex-1 break-words text-sm">{next.text}</p>
            <Button className="px-2 py-1 text-xs" onClick={(e) => toggle(next.id, e)}>
              Done ✓
            </Button>
          </div>
        </div>
      )}

      <Button variant="ghost" className="text-xs" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? '▾ Hide missions' : '▸ Show missions'}
      </Button>

      {open && (
        <MissionList
          target={target}
          today={today}
          onAdd={(text, due, parentId) => actions.addMission(target.id, text, due, parentId)}
          onToggle={toggle}
          onRemove={(id) => actions.removeMission(target.id, id)}
        />
      )}
    </section>
  )
}