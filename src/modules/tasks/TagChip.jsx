import { colorOf } from './constants'

// A small coloured pill. Pass onClick to make it a toggle button,
// and onRemove to show a delete (×) button beside it.
export default function TagChip({ tag, active, onClick, onRemove }) {
  const base = `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorOf(tag.color).chip}`

  return (
    <span className="inline-flex items-center">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={active}
          className={`${base} cursor-pointer ${active ? 'ring-2 ring-accent' : ''}`}
        >
          {tag.name}
        </button>
      ) : (
        <span className={base}>{tag.name}</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Delete tag "${tag.name}"`}
          className="ml-0.5 rounded-full px-1 text-xs text-zinc-500 hover:text-red-500"
        >
          ×
        </button>
      )}
    </span>
  )
}
