import { useState } from 'react'
import { useModuleData } from '../../data/DataContext'
import { Button, Card, PageHeader, Textarea } from '../../components/ui'
import { formatDate, todayKey, uid } from '../../lib/utils'

// Add, remove or reword a question here and the form and history update automatically.
const PROMPTS = [
  { key: 'wasted', label: 'What wasted my time this week?' },
  { key: 'good', label: 'What went well?' },
  { key: 'change', label: 'What will I change next week?' },
]

const defaults = { entries: [] }
const blank = Object.fromEntries(PROMPTS.map((p) => [p.key, '']))

export default function Reflect() {
  const [data, update] = useModuleData('reflect', defaults)
  const [answers, setAnswers] = useState(blank)
  const hasContent = Object.values(answers).some((v) => v.trim())

  const save = (e) => {
    e.preventDefault()
    if (!hasContent) return
    update((prev) => ({
      ...prev,
      entries: [{ id: uid(), date: todayKey(), answers }, ...prev.entries],
    }))
    setAnswers(blank)
  }

  const remove = (id) => update((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }))

  return (
    <>
      <PageHeader title="Weekly reflection" subtitle="Five minutes, once a week." />

      <Card className="mb-6">
        <form onSubmit={save} className="space-y-4">
          {PROMPTS.map((p) => (
            <label key={p.key} className="block">
              <span className="mb-1 block text-sm font-medium">{p.label}</span>
              <Textarea
                value={answers[p.key]}
                onChange={(e) => setAnswers({ ...answers, [p.key]: e.target.value })}
              />
            </label>
          ))}
          <Button type="submit" disabled={!hasContent}>
            Save reflection
          </Button>
        </form>
      </Card>

      <h3 className="mb-3 font-medium">Past reflections</h3>
      {data.entries.length === 0 && (
        <p className="text-sm text-zinc-500">Nothing saved yet. Your first reflection will show up here.</p>
      )}
      <div className="space-y-4">
        {data.entries.map((entry) => (
          <Card key={entry.id}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">{formatDate(entry.date)}</p>
              <Button variant="danger" onClick={() => window.confirm('Delete this reflection?') && remove(entry.id)}>
                Delete
              </Button>
            </div>
            {PROMPTS.filter((p) => entry.answers[p.key]?.trim()).map((p) => (
              <div key={p.key} className="mt-2">
                <p className="text-sm text-zinc-500">{p.label}</p>
                <p className="whitespace-pre-wrap">{entry.answers[p.key]}</p>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </>
  )
}
