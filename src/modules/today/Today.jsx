import { Card, PageHeader, Textarea } from '../../components/ui'
import { todayKey } from '../../lib/utils'
import { MAX_TASKS } from './constants'
import { useTodayPlan } from './useTodayPlan'
import DaySummary from './components/DaySummary'
import TaskForm from './components/TaskForm'
import TaskItem from './components/TaskItem'

export default function Today() {
  const key = todayKey()
  const { tasks, note, actions } = useTodayPlan(key)

  const subtitle = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <>
      <PageHeader title="Today" subtitle={subtitle} />

      <Card className="mb-4">
        <h3 className="font-medium">Your plan</h3>
        <p className="mb-4 text-sm text-zinc-500">
          Up to {MAX_TASKS} tasks. Under each one, log what you did and for how long.
        </p>

        {tasks.length === 0 && (
          <p className="mb-4 text-sm text-zinc-500">Nothing planned yet. Add your first task below.</p>
        )}

        <ul className="mb-4 space-y-3">
          {tasks.map((t) => (
            <TaskItem key={t.id} task={t} actions={actions} />
          ))}
        </ul>

        {tasks.length < MAX_TASKS ? (
          <TaskForm onAdd={actions.addTask} />
        ) : (
          <p className="text-sm text-zinc-500">Task limit reached. Finish or move one to add more.</p>
        )}

        <DaySummary tasks={tasks} />
      </Card>

      <Card>
        <h3 className="font-medium">Evening check-in</h3>
        <p className="mb-3 text-sm text-zinc-500">One sentence: what got done, what didn’t, and why.</p>
        <Textarea value={note} onChange={(e) => actions.setNote(e.target.value)} placeholder="Today I…" />
      </Card>
    </>
  )
}