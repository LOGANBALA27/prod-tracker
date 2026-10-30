import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { loadData, saveData } from '../storage/storage'

const DataContext = createContext(null)

// Holds ALL app data in one object. Each module owns one key, e.g. data.goals
export function DataProvider({ children }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    loadData().then(setData)
  }, [])

  useEffect(() => {
    if (data) saveData(data)
  }, [data])

  if (!data) return <p className="p-6 text-sm text-zinc-500">Loading…</p>
  return <DataContext.Provider value={{ data, setData }}>{children}</DataContext.Provider>
}

export const useAppData = () => useContext(DataContext)

// Each module reads and writes only its own slice of the data.
// Usage: const [state, update] = useModuleData('goals', { items: [] })
//        update(prev => ({ ...prev, items: [...] }))
export function useModuleData(id, defaults) {
  const { data, setData } = useAppData()
  const update = useCallback(
    (next) =>
      setData((prev) => {
        const current = prev[id] ?? defaults
        return { ...prev, [id]: typeof next === 'function' ? next(current) : next }
      }),
    [id, defaults, setData]
  )
  return [data[id] ?? defaults, update]
}
