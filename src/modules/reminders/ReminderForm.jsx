import { useState } from 'react'
import { Button, Input } from '../../components/ui'
import { toggleId } from '../tasks/constants'
import TagSelect from '../tasks/TagSelect'
import RichEditor from '../tasks/RichEditor'

const EMPTY = { text: '', description: '', tagIds: [] }

// One form for both adding and editing a reminder.
export default function ReminderForm({
  initial = EMPTY,
  tags,
  onCreateTag,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}) {
  const [text, setText] = useState(initial.text ?? '')
  const [description, setDescription] = useState(initial.description ?? '')
  const [tagIds, setTagIds] = useState(initial.tagIds ?? [])

  const submit = (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onSubmit({ text: value, description: description.trim(), tagIds })
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      className="space-y-3"
    >
      <Input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Reminder"
        aria-label="Reminder"
      />

      <div>
        <p className="mb-1 text-xs font-medium text-zinc-500">Description</p>
        <RichEditor value={description} onChange={setDescription} />
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-zinc-500">Tags</p>
        <TagSelect
          tags={tags}
          selected={tagIds}
          onToggle={(id) => setTagIds((prev) => toggleId(prev, id))}
          onCreate={onCreateTag}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={!text.trim()}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}