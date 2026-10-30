// ALL saving and loading goes through this file.
// To add Google Drive later, replace loadData() and saveData() only.

const KEY = 'prod-tracker:data'

export async function loadData() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return JSON.parse(saved)
  } catch (error) {
    console.error('Could not read saved data:', error)
  }
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data.json`)
    if (res.ok) return await res.json()
  } catch (error) {
    console.error('Could not read data.json:', error)
  }
  return {}
}

export async function saveData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Could not save data:', error)
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
