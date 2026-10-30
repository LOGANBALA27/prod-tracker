import { useState } from 'react'
import { useModuleData } from '../../data/DataContext'
import { Button, Card, Input, PageHeader, ProgressBar } from '../../components/ui'
import { uid } from '../../lib/utils'

const defaults = { items: [] }

function GoalCard({ goal, onAdd, onRemove }) {
  const [amount, setAmount] = useState('')
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0

  const submit = (e) => {
    e.preventDefault()
    const n = Number(amount)
    if (!n) return
    onAdd(n)
    setAmount('')
  }

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{goal.title}</h3>
          <p className="text-sm text-zinc-500">
            {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit} · {pct}%
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => window.confirm(`Remove "${goal.title}"?`) && onRemove()}
        >
          Remove
        </Button>
      </div>
      <ProgressBar value={goal.current} max={goal.target} />
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <Input
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Add progress (use a minus to subtract)"
        />
        <Button type="submit" disabled={!Number(amount)}>
          Add
        </Button>
      </form>
    </Card>
  )
}

export default function Goals() {
  const [data, update] = useModuleData('goals', defaults)
  const [form, setForm] = useState({ title: '', target: '', unit: '' })

  const addGoal = (e) => {
    e.preventDefault()
    const target = Number(form.target)
    if (!form.title.trim() || !(target > 0)) return
    update((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: uid(), title: form.title.trim(), target, current: 0, unit: form.unit.trim() },
      ],
    }))
    setForm({ title: '', target: '', unit: '' })
  }

  const addProgress = (id, amount) =>
    update((prev) => ({
      ...prev,
      items: prev.items.map((g) => (g.id === id ? { ...g, current: g.current + amount } : g)),
    }))

  const removeGoal = (id) => update((prev) => ({ ...prev, items: prev.items.filter((g) => g.id !== id) }))

  return (
    <>
      <PageHeader title="Goals" subtitle="Savings, habits, anything with a number to reach." />

      <div className="mb-6 space-y-4">
        {data.items.length === 0 && (
          <p className="text-sm text-zinc-500">No goals yet. Add one below to start tracking.</p>
        )}
        {data.items.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onAdd={(n) => addProgress(g.id, n)}
            onRemove={() => removeGoal(g.id)}
          />
        ))}
      </div>

      <Card>
        <h3 className="mb-3 font-medium">New goal</h3>
        <form onSubmit={addGoal} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Goal name"
          />
          <Input
            type="number"
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            placeholder="Target"
          />
          <Input
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="Unit (RM, km…)"
          />
          <Button type="submit">Add goal</Button>
        </form>
      </Card>
    </>
  )
}
