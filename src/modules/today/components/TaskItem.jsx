import { useState } from 'react'
import { Button } from '../../../components/ui'
import { STATUS } from '../constants'
import SkipReasonForm from './SkipReasonForm'
import WorkLog from './WorkLog'

export default function TaskItem({ task, actions }) {
  const [skipping, setSkipping] = useState(false)

  const isDone = task.status === STATUS.DONE
  const isSkipped = task.status === STATUS.SKIPPED

  return (
    <li className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isDone}
          disabled={isSkipped}
          onChange={() => (isDone ? actions.reopen(task.id) : actions.markDone(task.id))}
          className="mt-0.5 size-5 accent-[var(--color-accent)]"
          aria-label={`Mark "${task.text}" as done`}
        />
        <div className="min-w-0 flex-1">
          <p className={isDone || isSkipped ? 'text-zinc-400 line-through' : ''}>{task.text}</p>
          {isSkipped && <p className="text-sm text-red-500">Not done: {task.reason || 'no reason given'}</p>}
        </div>
      </div>

      {!skipping && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.status === STATUS.PENDING && (
            <Button variant="ghost" onClick={() => setSkipping(true)}>Didn’t do it</Button>
          )}
          {isSkipped && <Button variant="ghost" onClick={() => actions.reopen(task.id)}>Undo</Button>}
          {!isDone && (
            <Button variant="ghost" onClick={() => actions.moveToTomorrow(task.id)}>Move to tomorrow</Button>
          )}
          <Button variant="ghost" onClick={() => actions.remove(task.id)} aria-label={`Remove "${task.text}"`}>
            Remove
          </Button>
        </div>
      )}

      {skipping && (
        <SkipReasonForm
          onCancel={() => setSkipping(false)}
          onSubmit={(reason) => {
            actions.markSkipped(task.id, reason)
            setSkipping(false)
          }}
        />
      )}

      <WorkLog
        task={task}
        onAdd={(entry) => actions.addLog(task.id, entry)}
        onRemove={(logId) => actions.removeLog(task.id, logId)}
      />
    </li>
  )
}