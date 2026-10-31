import { localAdapter } from './localStorageAdapter'
import { driveAdapter, signIn } from './driveAdapter'

const DRIVE_FLAG = 'prod-tracker:drive'
const DRIVE_DELAY = 1500 // ms to wait after the last change before uploading

let driveOn = false
let timer = null

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

export async function saveData(data) {
  try {
    await localAdapter.save(data) // instant, always
  } catch (error) {
    console.error('Could not save to local storage:', error)
  }

  if (!driveOn) return
  clearTimeout(timer)
  timer = setTimeout(async () => {
    try {
      await driveAdapter.save(data)
    } catch (error) {
      console.error('Could not save to Drive:', error)
    }
  }, DRIVE_DELAY)
}

// Must be called from a click. Returns the data the app should use.
export async function connectDrive(currentData) {
  await signIn()
  const remote = await driveAdapter.load()
  driveOn = true
  setFlag(true)
  if (remote) return remote // Drive already has data: use it
  await driveAdapter.save(currentData) // first time: upload local data
  return currentData
}

export function disconnectDrive() {
  clearTimeout(timer)
  driveOn = false
  setFlag(false)
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