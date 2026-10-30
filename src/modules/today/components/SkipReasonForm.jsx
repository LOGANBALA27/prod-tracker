import { useState } from 'react'
import { Button, Input } from '../../../components/ui'
import { SKIP_REASONS } from '../constants'

const OTHER = 'Other'

// Pick a preset reason, or write your own when "Other" is chosen.
export default function SkipReasonForm({ onSubmit, onCancel }) {
  const [choice, setChoice] = useState('')
  const [custom, setCustom] = useState('')
  const reason = choice === OTHER ? custom.trim() : choice

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-zinc-500">What got in the way?</p>
      <div className="flex flex-wrap gap-2">
        {SKIP_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setChoice(r)}
            aria-pressed={choice === r}
            className={`rounded-full border px-3 py-1 text-sm ${
              choice === r
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                : 'border-zinc-300 dark:border-zinc-700'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      {choice === OTHER && (
        <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Write your reason" />
      )}
      <div className="flex gap-2">
        <Button onClick={() => onSubmit(reason)} disabled={!reason}>
          Save reason
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
