import { useMemo, useState } from 'react'
import { Button, Input } from '../../../components/ui'
import { formatRange, nowHHMM, planInterruption, toHHMM, toMinutes, validateTimes } from '../model'
import TimeRangeFields from './TimeRangeFields'

// "Something came up" — block out time, and see which tasks get pushed back before confirming.
export default function InterruptionPanel({ tasks, onApply }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ text: '', start: '', end: '' })

  const error = validateTimes(form.start, form.end, { requireBoth: true })
  const valid = !!form.text.trim() && !error
  const shifts = useMemo(() => (valid ? planInterruption(tasks, form) : []), [tasks, form, valid])

  const openPanel = () => {
    const now = nowHHMM()
    setForm({ text: '', start: now, end: toHHMM(toMinutes(now) + 60) })
    setOpen(true)
  }

  const apply = () => {
    onApply({ ...form, text: form.text.trim() })
    setOpen(false)
  }

  if (!open) {
    return (
      <Button variant="ghost" onClick={openPanel}>
        Something came up?
      </Button>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="font-medium">Block out unexpected time</p>
      <Input
        value={form.text}
        onChange={(e) => setForm({ ...form, text: e.target.value })}
        placeholder="e.g. Have to go out"
      />
      <TimeRangeFields start={form.start} end={form.end} onChange={(t) => setForm({ ...form, ...t })} />
      {error && <p className="text-sm text-red-500">{error}</p>}

      {valid && (
        <div className="text-sm">
          {shifts.length === 0 ? (
            <p className="text-zinc-500">No tasks are affected.</p>
          ) : (
            <>
              <p className="mb-1 text-zinc-500">These tasks will move:</p>
              <ul className="space-y-1">
                {shifts.map((s) => (
                  <li key={s.id}>
                    {s.text}: {formatRange(s.from)} →{' '}
                    {s.overflow ? 'no time (past midnight)' : formatRange(s.to)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={apply} disabled={!valid}>
          Add and reschedule
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
