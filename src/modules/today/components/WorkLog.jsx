import { useState } from 'react'
import { Button, Input } from '../../../components/ui'
import { formatDuration, parseDuration, totalMinutes } from '../model'

// "What I did" + "how long" entries under a task.
export default function WorkLog({ task, onAdd, onRemove }) {
  const [text, setText] = useState('')
  const [duration, setDuration] = useState('')

  const minutes = parseDuration(duration)
  const canAdd = text.trim() && minutes

  const submit = (e) => {
    e.preventDefault()
    if (!canAdd) return
    onAdd({ text, minutes })
    setText('')
    setDuration('')
  }

  return (
    <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
      {task.logs.length > 0 && (
        <>
          <ul className="mb-2 space-y-1">
            {task.logs.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{l.text}</span>
                <span className="text-zinc-500">{formatDuration(l.minutes)}</span>
                <Button variant="ghost" onClick={() => onRemove(l.id)} aria-label={`Remove log "${l.text}"`}>
                  ✕
                </Button>
              </li>
            ))}
          </ul>
          <p className="mb-3 text-sm font-medium">Total: {formatDuration(totalMinutes(task.logs))}</p>
        </>
      )}

      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <div className="min-w-[10rem] flex-1">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you do?" />
        </div>
        <div className="w-36">
          <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="How long?" />
        </div>
        <Button type="submit" disabled={!canAdd}>
          Log
        </Button>
      </form>
      <p className="mt-1 text-xs text-zinc-500">
        {duration && minutes
          ? `Logging ${formatDuration(minutes)}`
          : 'Duration examples: 45, 45m, 1h 30m, 1:30'}
      </p>
    </div>
  )
}