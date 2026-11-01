const kids = (m) => m.children ?? []

export const hasKids = (m) => kids(m).length > 0

// A parent is done when all its children are done. A mission with no children uses its own flag.
export const isDone = (m) => (hasKids(m) ? kids(m).every(isDone) : !!m.done)

// Every mission with no children, in order. These are the real "steps".
export const leaves = (list) => list.flatMap((m) => (hasKids(m) ? leaves(kids(m)) : [m]))

export const findIn = (list, id) => {
  for (const m of list) {
    if (m.id === id) return m
    const found = findIn(kids(m), id)
    if (found) return found
  }
  return null
}

// Texts of the parents above a mission, e.g. ['Study modules', 'Module 1'].
export const ancestors = (list, id, trail = []) => {
  for (const m of list) {
    if (m.id === id) return trail
    const found = ancestors(kids(m), id, [...trail, m.text])
    if (found) return found
  }
  return null
}

export const updateIn = (list, id, fn) =>
  list.map((m) => {
    if (m.id === id) return fn(m)
    return hasKids(m) ? { ...m, children: updateIn(kids(m), id, fn) } : m
  })

export const removeIn = (list, id) =>
  list
    .filter((m) => m.id !== id)
    .map((m) => (hasKids(m) ? { ...m, children: removeIn(kids(m), id) } : m))