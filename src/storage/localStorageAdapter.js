const KEY = 'prod-tracker:data'

// Every adapter has the same shape: { name, load(), save(data) }
// load() returns the saved data, or null if nothing is saved yet.
export const localAdapter = {
  name: 'local',

  async load() {
    const saved = localStorage.getItem(KEY)
    return saved ? JSON.parse(saved) : null
  },

  async save(data) {
    localStorage.setItem(KEY, JSON.stringify(data))
  },
}