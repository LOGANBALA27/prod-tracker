import { useState } from 'react'
import { Button, Input } from '../../components/ui'
import { PRIORITIES, toggleId } from './constants'
import TagSelect from './TagSelect'
import PrioritySelect from './PrioritySelect'

export default function AddTask({ tags, onCreateTag, onAdd }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [due, setDue] = useState('')
  const [tagIds, setTagIds] = useState([])
  const [priority, setPriority] = useState('')

  const reset = () => {
    setText('')
    setDue('')
    setTagIds([])
    setPriority('')
  }

  const close = () => {
    setOpen(false)
    reset()
  }

  const toggleTag = (id) => setTagIds((prev) => toggleId(prev, id))

  const submit = (e) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onAdd(value, due || null, tagIds, priority || undefined)
    reset()
  }

  if (!open) {
    return (
      <Button variant="ghost" className="w-full text-left" onClick={() => setOpen(true)}>
        + Add a task
      </Button>
    )
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      className="space-y-2"
    >
      <Input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Task name"
      />
      <Input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        aria-label="Due date (optional)"
      />
      <PrioritySelect value={priority} onChange={setPriority} />
<TagSelect tags={tags} selected={tagIds} onToggle={toggleTag} onCreate={onCreateTag} />
<div className="flex gap-2">
  <Button type="submit" disabled={!text.trim()}>
    Add task
  </Button>
  <Button type="button" variant="ghost" onClick={close}>
    Cancel
  </Button>
</div>
    </form>
  )
}