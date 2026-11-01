import { useModuleData } from '../../data/DataContext'
import { uid } from '../../lib/utils'
import { removeIn, updateIn } from './missionTree'

const defaults = { items: [] }

// All target and mission logic lives here, so the components only draw things.
export function useTargets() {
  const [state, update] = useModuleData('targets', defaults)
  const items = state.items ?? []
  const setItems = (fn) => update((prev) => ({ ...prev, items: fn(prev.items ?? []) }))

  const addTarget = ({ title, deadline }) =>
    setItems((list) => [
      ...list,
      { id: uid(), title, deadline: deadline || null, missions: [], createdAt: Date.now() },
    ])

  const editTarget = (id, changes) =>
    setItems((list) => list.map((t) => (t.id === id ? { ...t, ...changes } : t)))

  const removeTarget = (id) => setItems((list) => list.filter((t) => t.id !== id))

  const mapMissions = (targetId, fn) =>
    setItems((list) =>
      list.map((t) => (t.id === targetId ? { ...t, missions: fn(t.missions ?? []) } : t)),
    )

  // parentId = null adds a top-level mission; otherwise adds a child of that mission.
  const addMission = (targetId, text, due, parentId = null) =>
    mapMissions(targetId, (ms) => {
      const fresh = { id: uid(), text, due: due || null, done: false, children: [] }
      if (!parentId) return [...ms, fresh]
      return updateIn(ms, parentId, (p) => ({
        ...p,
        done: false, // a parent with new work inside is no longer done
        children: [...(p.children ?? []), fresh],
      }))
    })

  // Only missions without children are toggled directly.
  const toggleMission = (targetId, missionId) =>
    mapMissions(targetId, (ms) =>
      updateIn(ms, missionId, (m) => ({
        ...m,
        done: !m.done,
        doneAt: !m.done ? Date.now() : null,
      })),
    )

  const removeMission = (targetId, missionId) =>
    mapMissions(targetId, (ms) => removeIn(ms, missionId))

  return {
    items,
    addTarget,
    editTarget,
    removeTarget,
    addMission,
    toggleMission,
    removeMission,
  }
}