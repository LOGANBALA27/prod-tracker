import { useState } from 'react'
import { Button, Input, PageHeader } from '../../components/ui'
import TagFilter from '../tasks/TagFilter'
import ReminderCard from './ReminderCard'
import ReminderForm from './ReminderForm'
import { useReminders } from './useReminders'
import { plainText } from '../../lib/text'

export default function Reminders() {
  const {
    items, shown, query, setQuery, tags, activeTags,
    createTag, deleteTag, toggleFilter, clearFilter,
    addReminder, editReminder, togglePin, removeReminder,
  } = useReminders()

  const [adding, setAdding] = useState(false)

  return (
    <>
      <PageHeader title="Reminders" />

      <div className="relative mb-3">
  <Input
    type="search"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search reminders…"
    aria-label="Search reminders"
  />
  {query && (
    <button
      type="button"
      onClick={() => setQuery('')}
      aria-label="Clear search"
      className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      ✕
    </button>
  )}
</div>

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
        <p className="text-sm text-zinc-500">No reminders match your search or tags.</p>
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