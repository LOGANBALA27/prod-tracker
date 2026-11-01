import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  loadData,
  saveData,
  connectDrive as connect,
  disconnectDrive as disconnect,
  driveWasConnected,
} from '../storage/storage'

const DataContext = createContext(null)

// Holds ALL app data in one object. Each module owns one key, e.g. data.goals
export function DataProvider({ children }) {
  const [data, setData] = useState(null)
  const [drive, setDrive] = useState({ connected: false, error: null })
  const dataRef = useRef(null)

  const connectDrive = useCallback(async (silent = false) => {
    try {
      const next = await connect(dataRef.current, silent === true)
      setData(next)
      setDrive({ connected: true, error: null })
    } catch (error) {
      console.error(error)
      if (silent !== true) {
        setDrive({ connected: false, error: 'Could not connect to Google Drive.' })
      }
    }
  }, [])

  const disconnectDrive = useCallback(() => {
    disconnect()
    setDrive({ connected: false, error: null })
  }, [])

  useEffect(() => {
    loadData().then((d) => {
      setData(d)
      dataRef.current = d
      if (driveWasConnected() && window.matchMedia('(pointer: fine)').matches) connectDrive(true)
    })
  }, [connectDrive])

  useEffect(() => {
    dataRef.current = data
    if (data) saveData(data)
  }, [data])

  if (!data) return <p className="p-6 text-sm text-zinc-500">Loading…</p>
  return (
    <DataContext.Provider
      value={{
        data,
        setData,
        drive: { ...drive, wasConnected: driveWasConnected() },
        connectDrive,
        disconnectDrive,
      }}
    >
      {children}
    </DataContext.Provider>
  )
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