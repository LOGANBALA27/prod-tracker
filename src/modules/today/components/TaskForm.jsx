import { useState } from 'react'
import { Button, Input } from '../../../components/ui'

export default function TaskForm({ onAdd }) {
  const [text, setText] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="What will you do?" />
      <Button type="submit" disabled={!text.trim()}>
        Add task
      </Button>
    </form>
  )
}