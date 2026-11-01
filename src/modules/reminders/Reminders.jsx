import { useState } from 'react'
import { Button, PageHeader } from '../../components/ui'
import TagFilter from '../tasks/TagFilter'
import ReminderCard from './ReminderCard'
import ReminderForm from './ReminderForm'
import { useReminders } from './useReminders'

export default function Reminders() {
  const {
    items, shown, tags, activeTags,
    createTag, deleteTag, toggleFilter, clearFilter,
    addReminder, editReminder, togglePin, removeReminder,
  } = useReminders()

  const [adding, setAdding] = useState(false)

  return (
    <>
      <PageHeader title="Reminders" />

      <TagFilter
        tags={tags}
        active={activeTags}
        onToggle={toggleFilter}
        onClear={clearFilter}
        onCreate={createTag}
        onDelete={deleteTag}
      />

      <div className="mb-4">
        {adding ? (
          <ReminderForm
            tags={tags}
            onCreateTag={createTag}
            submitLabel="Add reminder"
            onCancel={() => setAdding(false)}
            onSubmit={(values) => {
              addReminder(values)
              setAdding(false)
            }}
          />
        ) : (
          <Button variant="ghost" className="w-full text-left" onClick={() => setAdding(true)}>
            + Add a reminder
          </Button>
        )}
      </div>

      {items.length === 0 && (
        <p className="text-sm text-zinc-500">No reminders yet. Add things you want to see often.</p>
      )}
      {items.length > 0 && shown.length === 0 && (
        <p className="text-sm text-zinc-500">No reminders with these tags.</p>
      )}

      <ul className="space-y-2">
        {shown.map((r) => (
          <li key={r.id}>
            <ReminderCard
              reminder={r}
              tags={tags}
              onCreateTag={createTag}
              onEdit={(changes) => editReminder(r.id, changes)}
              onPin={() => togglePin(r.id)}
              onRemove={() => removeReminder(r.id)}
            />
          </li>
        ))}
      </ul>
    </>
  )
}