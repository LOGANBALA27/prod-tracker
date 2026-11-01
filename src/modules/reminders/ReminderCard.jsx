import { useState } from 'react'
import { Button } from '../../components/ui'
import { plainText } from '../../lib/text'
import TagChip from '../tasks/TagChip'
import ReminderDetail from './ReminderDetail'

const BOX = 'rounded-lg border bg-white p-2.5 dark:bg-zinc-800'

// Compact card. Clicking it opens the detail dialog (view first, edit from there).
export default function ReminderCard({ reminder, tags, onEdit, onPin, onRemove, onCreateTag }) {
  const [open, setOpen] = useState(false)

  const selected = reminder.tagIds ?? []
  const reminderTags = tags.filter((t) => selected.includes(t.id))
  const preview = plainText(reminder.description, ' ')

  return (
    <>
      <div
        className={`${BOX} ${
          reminder.pinned ? 'border-accent' : 'border-zinc-200 dark:border-zinc-700'
        }`}
      >
        <div className="flex items-start gap-2">
          <div
            role="button"
            tabIndex={0}
            title="Click to open"
            onClick={() => setOpen(true)}
            onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
            className="min-w-0 flex-1 cursor-pointer"
          >
            {reminderTags.length > 0 && (
              <div className="mb-1 flex flex-wrap gap-1">
                {reminderTags.map((t) => (
                  <TagChip key={t.id} tag={t} />
                ))}
              </div>
            )}
            <p className="break-words font-medium">{reminder.text}</p>
            {preview && <p className="mt-0.5 line-clamp-2 break-words text-sm text-zinc-500">{preview}</p>}
          </div>

          <Button
            variant="ghost"
            className="px-1.5 py-0.5"
            onClick={onPin}
            title={reminder.pinned ? 'Unpin' : 'Pin to top'}
            aria-label={reminder.pinned ? 'Unpin reminder' : 'Pin reminder'}
          >
            {reminder.pinned ? '📌' : '📍'}
          </Button>
          <Button
            variant="ghost"
            className="px-1.5 py-0.5 hover:text-red-500"
            onClick={onRemove}
            title="Delete"
            aria-label={`Delete "${reminder.text}"`}
          >
            🗑️
          </Button>
        </div>
      </div>

      {open && (
        <ReminderDetail
          reminder={reminder}
          tags={tags}
          onEdit={onEdit}
          onPin={onPin}
          onRemove={onRemove}
          onCreateTag={onCreateTag}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}