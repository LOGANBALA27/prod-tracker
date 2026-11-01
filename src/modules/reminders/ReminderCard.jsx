import { useState } from 'react'
import { Button, Card } from '../../components/ui'
import { plainText } from '../../lib/text'
import TagChip from '../tasks/TagChip'
import ReminderForm from './ReminderForm'

export default function ReminderCard({ reminder, tags, onEdit, onPin, onRemove, onCreateTag }) {
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (editing) {
    return (
      <Card className="border-accent">
        <ReminderForm
          initial={reminder}
          tags={tags}
          onCreateTag={onCreateTag}
          onCancel={() => setEditing(false)}
          onSubmit={(changes) => {
            onEdit(changes)
            setEditing(false)
          }}
        />
      </Card>
    )
  }

  const selected = reminder.tagIds ?? []
  const reminderTags = tags.filter((t) => selected.includes(t.id))
  const description = plainText(reminder.description, '\n')

  return (
    <Card className={reminder.pinned ? 'border-accent' : ''}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {reminderTags.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-1">
              {reminderTags.map((t) => (
                <TagChip key={t.id} tag={t} />
              ))}
            </div>
          )}

          <p
            role="button"
            tabIndex={0}
            title="Click to edit"
            onClick={() => setEditing(true)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
            className="cursor-text break-words font-medium"
          >
            {reminder.text}
          </p>

          {description && (
            <p
              role="button"
              tabIndex={0}
              title={expanded ? 'Show less' : 'Show more'}
              onClick={() => setExpanded((v) => !v)}
              onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
              className={`mt-1 cursor-pointer whitespace-pre-line break-words text-sm text-zinc-500 ${
                expanded ? '' : 'line-clamp-3'
              }`}
            >
              {description}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          className="px-2 py-1"
          onClick={onPin}
          title={reminder.pinned ? 'Unpin' : 'Pin to top'}
          aria-label={reminder.pinned ? 'Unpin reminder' : 'Pin reminder'}
        >
          {reminder.pinned ? '📌' : '📍'}
        </Button>
        <Button
          variant="ghost"
          className="px-2 py-1 hover:text-red-500"
          onClick={onRemove}
          title="Delete"
          aria-label={`Delete "${reminder.text}"`}
        >
          🗑️
        </Button>
      </div>
    </Card>
  )
}