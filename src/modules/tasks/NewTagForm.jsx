import { useState } from 'react'
import { Button, Input } from '../../components/ui'
import { TAG_COLORS } from './constants'

// Name + colour picker. Not a <form>, so it can sit inside the
// "Add a task" form without nesting forms.
export default function NewTagForm({ onCreate, onCancel }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(TAG_COLORS[0].id)

  const submit = () => {
    const value = name.trim()
    if (!value) return
    onCreate(value, color)
    setName('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
    if (e.key === 'Escape') {
      e.stopPropagation()
      onCancel()
    }
  }

  return (
    <div
      className="space-y-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-700"
      onKeyDown={handleKeyDown}
    >
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tag name"
        aria-label="Tag name"
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2">
        <Button type="button" disabled={!name.trim()} onClick={submit}>
          Create tag
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Tag colour">
      {TAG_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.id}
          aria-label={c.id}
          onClick={() => onChange(c.id)}
          className={`h-5 w-5 rounded-full ${c.swatch} ${
            value === c.id ? 'ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-800' : ''
          }`}
        />
      ))}
    </div>
  )
}
