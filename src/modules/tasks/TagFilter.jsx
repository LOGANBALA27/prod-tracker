import { useState } from 'react'
import { Button } from '../../components/ui'
import NewTagForm from './NewTagForm'
import TagChip from './TagChip'

// The row above the board: click tags to filter, create tags, delete tags.
export default function TagFilter({ tags, active, onToggle, onClear, onCreate, onDelete }) {
  const [creating, setCreating] = useState(false)
  const [managing, setManaging] = useState(false)

  const confirmDelete = (tag) => {
    if (window.confirm(`Delete the tag "${tag.name}"? It will be removed from all tasks.`)) {
      onDelete(tag.id)
    }
  }

  const handleCreate = (name, color) => {
    onCreate(name, color)
    setCreating(false)
  }

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {/* <span className="mr-1 text-sm text-zinc-500">Filter by tag</span> */}

        {tags.map((t) => (
          <TagChip
            key={t.id}
            tag={t}
            active={active.includes(t.id)}
            onClick={() => onToggle(t.id)}
            onRemove={managing ? () => confirmDelete(t) : undefined}
          />
        ))}

        {active.length > 0 && (
          <Button variant="ghost" className="px-2 py-0.5 text-xs" onClick={onClear}>
            Clear filter
          </Button>
        )}
        <Button variant="ghost" className="px-2 py-0.5 text-xs" onClick={() => setCreating((v) => !v)}>
          + New tag
        </Button>
        {tags.length > 0 && (
          <Button variant="ghost" className="px-2 py-0.5 text-xs" onClick={() => setManaging((v) => !v)}>
            {managing ? 'Done' : 'Delete tags'}
          </Button>
        )}
      </div>

      {creating && (
        <div className="max-w-xs">
          <NewTagForm onCreate={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}
    </div>
  )
}
