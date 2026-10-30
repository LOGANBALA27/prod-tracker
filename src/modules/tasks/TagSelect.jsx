import { useState } from 'react'
import { Button } from '../../components/ui'
import NewTagForm from './NewTagForm'
import TagChip from './TagChip'

// Pick tags for one task, or create a new one and select it straight away.
// Used both in the "Add a task" form and on each card.
export default function TagSelect({ tags, selected, onToggle, onCreate }) {
  const [creating, setCreating] = useState(false)

  const handleCreate = (name, color) => {
    const tag = onCreate(name, color)
    if (tag && !selected.includes(tag.id)) onToggle(tag.id)
    setCreating(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.length === 0 && !creating && (
          <p className="text-xs text-zinc-500">No tags yet. Create your first one.</p>
        )}
        {tags.map((t) => (
          <TagChip key={t.id} tag={t} active={selected.includes(t.id)} onClick={() => onToggle(t.id)} />
        ))}
        {!creating && (
          <Button type="button" variant="ghost" className="px-2 py-0.5 text-xs" onClick={() => setCreating(true)}>
            + New tag
          </Button>
        )}
      </div>
      {creating && <NewTagForm onCreate={handleCreate} onCancel={() => setCreating(false)} />}
    </div>
  )
}
