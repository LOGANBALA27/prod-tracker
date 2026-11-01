import { todayKey } from '../../lib/utils'
import NewTargetForm from './NewTargetForm'
import TargetCard from './TargetCard'
import { useTargets } from './useTargets'

export default function Targets() {
  const { items, addTarget, removeTarget, addMission, toggleMission, removeMission } = useTargets()
  const today = todayKey()
  const actions = { removeTarget, addMission, toggleMission, removeMission }

  return (
    <>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Targets</h2>
        <p className="text-sm text-zinc-500">{items.length} active</p>
      </div>

      <div className="mb-4">
        <NewTargetForm onAdd={addTarget} />
      </div>

      <div className="space-y-4">
        {items.map((t) => (
          <TargetCard key={t.id} target={t} today={today} actions={actions} />
        ))}
        {items.length === 0 && (
          <p className="text-sm text-zinc-500">
            No targets yet. Create one, then break it into small missions.
          </p>
        )}
      </div>
    </>
  )
}