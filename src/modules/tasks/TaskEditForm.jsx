import { useState } from 'react'
import { Button, Input } from '../../components/ui'
import { toggleId } from './constants'
import TagSelect from './TagSelect'

// Replaces a card while it is being edited.
export default function TaskEditForm({ task, tags, onCreateTag, onSave, onCancel }) {
  const [text, setText] = useState(task.text)
  const [due, setDue] = useState(task.due ?? '')
  const [tagIds, setTagIds] = useState(task.tagIds ?? [])

  const submit = (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onSave({ text: value, due: due || null, tagIds })
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      className="space-y-2"
    >
      <Input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Task name"
        aria-label="Task name"
      />
      <Input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        aria-label="Due date (optional)"
      />
      <TagSelect
        tags={tags}
        selected={tagIds}
        onToggle={(id) => setTagIds((prev) => toggleId(prev, id))}
        onCreate={onCreateTag}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={!text.trim()}>
          Save
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
