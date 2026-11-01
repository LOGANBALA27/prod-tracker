import { useState } from 'react'
import { Button, Input } from '../../components/ui'

export default function NewTargetForm({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')

  const close = () => {
    setOpen(false)
    setTitle('')
    setDeadline('')
  }

  const submit = (e) => {
    e.preventDefault()
    const value = title.trim()
    if (!value) return
    onAdd({ title: value, deadline })
    close()
  }

  if (!open) return <Button onClick={() => setOpen(true)}>+ New target</Button>

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
    >
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Big target, e.g. Pass CEH exam"
      />
      <Input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        aria-label="Deadline (optional)"
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={!title.trim()}>Create</Button>
        <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
      </div>
    </form>
  )
}