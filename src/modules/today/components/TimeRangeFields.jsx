import { Input } from '../../../components/ui'

// Reusable start–end time pair. Used by the add form, edit form and interruption panel.
export default function TimeRangeFields({ start, end, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Input type="time" value={start} onChange={(e) => onChange({ start: e.target.value, end })} aria-label="Start time" />
      <span className="text-zinc-400">to</span>
      <Input type="time" value={end} onChange={(e) => onChange({ start, end: e.target.value })} aria-label="End time" />
    </div>
  )
}
