import { PRIORITIES } from './constants'

export default function PrioritySelect({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Priority">
      {PRIORITIES.map((p) => {
        const on = value === p.id
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? '' : p.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              on ? p.active : `${p.chip} opacity-70 hover:opacity-100`
            }`}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}