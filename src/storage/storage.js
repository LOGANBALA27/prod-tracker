import { localAdapter } from './localStorageAdapter'
import { driveAdapter } from './driveAdapter'

// Register adapters here. To add another one later, add one line.
const adapters = {
  local: localAdapter,
  drive: driveAdapter,
}

// Chosen by VITE_STORAGE in the .env files. Falls back to local if unavailable.
function pickAdapter() {
  const wanted = import.meta.env.VITE_STORAGE || 'local'
  const adapter = adapters[wanted]
  if (!adapter) {
    console.warn(`Storage "${wanted}" is not available yet. Using local storage.`)
    return localAdapter
  }
  return adapter
}

const adapter = pickAdapter()
export const storageName = adapter.name

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

export async function loadData() {
  try {
    const saved = await adapter.load()
    if (saved) return saved
  } catch (error) {
    console.error(`Could not load from ${adapter.name}:`, error)
  }
  return loadSample()
}

export async function saveData(data) {
  try {
    await adapter.save(data)
  } catch (error) {
    console.error(`Could not save to ${adapter.name}:`, error)
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