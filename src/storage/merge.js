const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const isItems = (a) => Array.isArray(a) && a.every((x) => x && typeof x === 'object' && x.id)

// Stamps items that changed between prev and next, and records deletions.
export function stamp(prev, next, now = Date.now()) {
  const out = { ...next }
  for (const key of Object.keys(next)) {
    const mod = next[key]
    if (key === 'updatedAt' || !isObj(mod)) continue
    const before = prev?.[key] ?? {}
    const result = { ...mod }
    const deleted = { ...(mod.deleted ?? {}) }

    for (const field of Object.keys(mod)) {
      const list = mod[field]
      if (!isItems(list)) continue
      const old = Array.isArray(before[field]) ? before[field] : []
      const oldById = new Map(old.map((x) => [x.id, x]))
      const ids = new Set(list.map((x) => x.id))

      result[field] = list.map((x) => (oldById.get(x.id) === x ? x : { ...x, updatedAt: now }))
      for (const o of old) if (!ids.has(o.id)) deleted[o.id] = now
    }
    if (Object.keys(deleted).length) result.deleted = deleted
    out[key] = result
  }
  return out
}

const alive = (item, deleted) => {
  const d = deleted[item.id]
  return !(d !== undefined && d >= (item.updatedAt ?? 0))
}

function mergeItems(a, b, deleted) {
  const byId = new Map(b.map((x) => [x.id, x]))
  const seen = new Set()
  const out = []
  for (const x of a) {
    const y = byId.get(x.id)
    const pick = y && (y.updatedAt ?? 0) > (x.updatedAt ?? 0) ? y : x
    seen.add(x.id)
    if (alive(pick, deleted)) out.push(pick)
  }
  for (const y of b) if (!seen.has(y.id) && alive(y, deleted)) out.push(y)
  return out
}

function mergeModule(local, remote, localIsNewer) {
  const deleted = { ...(remote.deleted ?? {}) }
  for (const [id, t] of Object.entries(local.deleted ?? {})) {
    deleted[id] = Math.max(deleted[id] ?? 0, t)
  }
  const out = localIsNewer ? { ...remote, ...local } : { ...local, ...remote }
  for (const field of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    if (isItems(local[field]) && isItems(remote[field])) {
      out[field] = mergeItems(local[field], remote[field], deleted)
    }
  }
  if (Object.keys(deleted).length) out.deleted = deleted
  return out
}

// Combines two full copies of the app data. Items are matched by id
// and the most recently edited version wins.
export function merge(local, remote) {
  if (!remote) return local
  if (!local) return remote
  const localIsNewer = (local.updatedAt ?? 0) >= (remote.updatedAt ?? 0)
  const out = localIsNewer ? { ...remote, ...local } : { ...local, ...remote }
  out.updatedAt = Math.max(local.updatedAt ?? 0, remote.updatedAt ?? 0)
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    if (isObj(local[key]) && isObj(remote[key])) {
      out[key] = mergeModule(local[key], remote[key], localIsNewer)
    }
  }
  return out
}