import { useState } from 'react'
import { Button } from '../../components/ui'
import { countNodes, parseOutline } from './outline'

export default function BulkAdd({ onImport }) {
  const [open, setOpen] = useState(false)
  const [raw, setRaw] = useState('')
  const tree = parseOutline(raw)

  const close = () => {
    setOpen(false)
    setRaw('')
  }

  const submit = () => {
    if (!tree.length) return
    onImport(tree)
    close()
  }

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Import outline
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        autoFocus
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && close()}
        rows={8}
        placeholder={'One mission per line.\nIndent with 2 spaces or Tab for sub-missions.'}
        className="w-full rounded-lg border border-zinc-200 p-2 font-mono text-sm dark:border-zinc-700 dark:bg-transparent"
      />
      <div className="flex items-center gap-2">
        <Button onClick={submit} disabled={!tree.length}>
          Add {countNodes(tree)} missions
        </Button>
        <Button variant="ghost" onClick={close}>Cancel</Button>
      </div>
    </div>
  )
}