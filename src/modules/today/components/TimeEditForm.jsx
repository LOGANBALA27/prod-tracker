import { useState } from 'react'
import { Button } from '../../../components/ui'
import { validateTimes } from '../model'
import TimeRangeFields from './TimeRangeFields'

// Inline form to move a single task to a new time.
export default function TimeEditForm({ task, onSave, onCancel }) {
  const [times, setTimes] = useState({ start: task.start, end: task.end })
  const error = validateTimes(times.start, times.end)

  return (
    <div className="mt-3 space-y-2">
      <TimeRangeFields {...times} onChange={setTimes} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={() => onSave(times)} disabled={!!error}>
          Save time
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
