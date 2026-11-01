import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '../../components/ui'
import TagChip from '../tasks/TagChip'
import ReminderForm from './ReminderForm'

// Read-only view of the description. Tiptap drops anything its schema doesn't allow,
// so nothing is rendered as raw HTML.
function RichView({ value }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: false,
    editorProps: { attributes: { class: 'rich text-sm' } },
  })
  if (!editor) return null
  return <EditorContent editor={editor} />
}

// Dialog that first shows the reminder, then switches to the edit form on "Edit".
export default function ReminderDetail({
  reminder,
  tags,
  onEdit,
  onPin,
  onRemove,
  onCreateTag,
  onClose,
}) {
  const [mode, setMode] = useState('view') // 'view' | 'edit'

  // Stop the page behind the dialog from scrolling.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const selected = reminder.tagIds ?? []
  const reminderTags = tags.filter((t) => selected.includes(t.id))

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && mode === 'view' && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reminder"
        onKeyDown={(e) => e.key === 'Escape' && mode === 'view' && onClose()}
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl dark:bg-zinc-900"
      >
        {mode === 'edit' ? (
          <ReminderForm
            initial={reminder}
            tags={tags}
            onCreateTag={onCreateTag}
            onCancel={() => setMode('view')}
            onSubmit={(changes) => {
              onEdit(changes)
              setMode('view')
            }}
          />
        ) : (
          <>
            <div className="flex items-start gap-2">
              <h2 className="min-w-0 flex-1 break-words text-lg font-semibold tracking-tight">
                {reminder.pinned && <span aria-label="Pinned">📌 </span>}
                {reminder.text}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {reminderTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {reminderTags.map((t) => (
                  <TagChip key={t.id} tag={t} />
                ))}
              </div>
            )}

            {reminder.description ? (
              <RichView value={reminder.description} />
            ) : (
              <p className="text-sm text-zinc-500">No description.</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button autoFocus onClick={() => setMode('edit')}>
                Edit
              </Button>
              <Button variant="ghost" onClick={onPin}>
                {reminder.pinned ? 'Unpin' : 'Pin'}
              </Button>
              <Button
                variant="ghost"
                className="ml-auto hover:text-red-500"
                onClick={() => {
                  onRemove()
                  onClose()
                }}
              >
                Delete
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}