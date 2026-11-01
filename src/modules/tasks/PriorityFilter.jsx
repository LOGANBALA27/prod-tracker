import { PRIORITIES } from './constants'

export default function PriorityFilter({ active, onToggle, onClear }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by priority">
      <span className="mr-1 text-xs text-zinc-500">Priority</span>
      {PRIORITIES.map((p) => {
        const on = active.includes(p.id)
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p.id)}
            aria-pressed={on}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition ${
              on
                ? 'border-accent bg-accent/10 font-semibold text-accent'
                : 'border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${p.dot}`} />
            {p.label}
          </button>
        )
      })}
      {active.length > 0 && (
        <button type="button" onClick={onClear} className="ml-1 text-xs text-zinc-500 underline">
          Clear
        </button>
      )}
    </div>
  )
}