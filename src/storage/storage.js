import { localAdapter } from './localStorageAdapter'
import { driveAdapter, signIn } from './driveAdapter'
import { merge } from './merge'

const DRIVE_FLAG = 'prod-tracker:drive'
const DRIVE_DELAY = 1500 // ms to wait after the last change before syncing
const MIN_PULL_GAP = 5000 // ms between focus pulls, so quick tab switches don't spam Drive

let driveOn = false
let timer = null
let lastPull = 0

// DataContext registers these. getData returns the latest app data,
// onMerged applies a merged result to the screen.
let handlers = { getData: () => null, onMerged: () => {} }

export function configureSync(next) {
  handlers = { ...handlers, ...next }
}

export const driveWasConnected = () => {
  try {
    return localStorage.getItem(DRIVE_FLAG) === '1'
  } catch {
    return false
  }
}

function setFlag(on) {
  try {
    if (on) localStorage.setItem(DRIVE_FLAG, '1')
    else localStorage.removeItem(DRIVE_FLAG)
  } catch {
    /* ignore */
  }
}

// ---------- helpers ----------

// Runs one sync at a time, so a focus pull and a delayed upload can't race.
let lock = Promise.resolve()
function exclusive(task) {
  const run = lock.then(task)
  lock = run.catch(() => {})
  return run
}

// Stable text form of the data: key order is ignored, and so is the order of
// item lists (items with an id). Used to tell whether two copies really differ.
function canon(v) {
  if (Array.isArray(v)) {
    const list = v.map(canon)
    const byId = v.every((x) => x && typeof x === 'object' && !Array.isArray(x) && x.id !== undefined)
    if (byId) list.sort()
    return `[${list.join(',')}]`
  }
  if (v && typeof v === 'object') {
    const keys = Object.keys(v)
      .filter((k) => v[k] !== undefined)
      .sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`
  }
  return JSON.stringify(v) ?? 'null'
}
const same = (a, b) => canon(a) === canon(b)

// ---------- local ----------

// First run only: start from the sample data in public/data.json
async function loadSample() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data.json`)
    if (res.ok) return await res.json()
  } catch (error) {
    console.error('Could not read data.json:', error)
  }
  return {}
}

// Always starts from local data (no popup needed)
export async function loadData() {
  try {
    const saved = await localAdapter.load()
    if (saved) return saved
  } catch (error) {
    console.error('Could not load from local storage:', error)
  }
  return loadSample()
}

// ---------- Drive sync ----------

// Download the Drive copy, merge it with the latest local data, upload the
// result if Drive is missing something, and show it on screen if this device
// was missing something. Must run inside exclusive().
async function syncCore() {
  const remote = await driveAdapter.load()
  const local = handlers.getData() // read after the download, so edits made meanwhile are kept
  if (!local) return null

  const merged = merge(local, remote)
  if (!remote || !same(merged, remote)) await driveAdapter.save(merged)
  if (!same(merged, local)) handlers.onMerged(merged)
  return merged
}

// Background sync: never opens a popup, never throws.
function syncQuietly() {
  return exclusive(async () => {
    try {
      await signIn(true)
      return await syncCore()
    } catch (error) {
      console.warn('Drive sync skipped:', error)
      return null
    }
  })
}

export async function saveData(data) {
  try {
    await localAdapter.save(data) // instant, always
  } catch (error) {
    console.error('Could not save to local storage:', error)
  }

  if (!driveOn) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    syncQuietly()
  }, DRIVE_DELAY)
}

// Must be called from a click.
export async function connectDrive() {
  await signIn() // first thing, so the popup is allowed
  return exclusive(async () => {
    const merged = await syncCore()
    driveOn = true
    setFlag(true)
    return merged
  })
}

// On app start: if Drive was connected before, try to reconnect silently
// (no popup). Returns true on success.
export async function resumeDrive() {
  if (!driveWasConnected()) return false
  try {
    await signIn(true)
    await exclusive(syncCore)
    driveOn = true
    return true
  } catch (error) {
    console.warn('Could not reconnect to Drive silently:', error)
    return false
  }
}

// Called when you return to the tab. Quietly skipped if Drive isn't connected,
// the token needs a popup, or a pull just happened.
export function pullAndMerge() {
  if (!driveOn) return Promise.resolve(null)
  if (Date.now() - lastPull < MIN_PULL_GAP) return Promise.resolve(null)
  lastPull = Date.now()
  return syncQuietly()
}

// Called when the tab is hidden: don't wait for the delay if an upload is pending.
export function flushDrive() {
  if (!driveOn || !timer) return
  clearTimeout(timer)
  timer = null
  syncQuietly()
}

export function disconnectDrive() {
  clearTimeout(timer)
  timer = null
  driveOn = false
  lastPull = 0
  setFlag(false)
  try {
    localStorage.removeItem('prod-tracker:drive-email')
  } catch {
    /* ignore */
  }
}

export function exportData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `prod-tracker-${new Date().toLocaleDateString('en-CA')}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

export async function importData(file) {
  return JSON.parse(await file.text())
}