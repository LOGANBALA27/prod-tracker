import { STATUS } from '../constants'
import { formatDuration, totalMinutes } from '../model'

export default function DaySummary({ tasks }) {
  if (tasks.length === 0) return null

  const done = tasks.filter((t) => t.status === STATUS.DONE).length
  const skipped = tasks.filter((t) => t.status === STATUS.SKIPPED).length
  const minutes = totalMinutes(tasks.flatMap((t) => t.logs))

  return (
    <p className="mt-4 text-sm text-zinc-500">
      {done} of {tasks.length} done
      {skipped > 0 && ` · ${skipped} not done`}
      {minutes > 0 && ` · ${formatDuration(minutes)} logged`}
    </p>
  )
}