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
  const [data, setRawData] = useState(null)
  const [drive, setDrive] = useState({ connected: false, error: null })
  const dataRef = useRef(null)

  // Every change made by the user is stamped, so Drive and this device
  // can tell which copy is newer.
  const setData = useCallback((next) => {
    setRawData((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      return { ...value, updatedAt: Date.now() }
    })
  }, [])

  const warned = useRef(false)
  const startStamp = useRef(undefined)

  useEffect(() => {
    if (!data) return
    if (startStamp.current === undefined) {
      startStamp.current = data.updatedAt ?? 0 // first render: remember what was loaded
      return
    }
    if (warned.current || drive.connected || !driveWasConnected()) return
    if ((data.updatedAt ?? 0) !== startStamp.current) {
      warned.current = true
      setDrive((d) => ({ ...d, error: 'Not synced to Google Drive. Tap Reconnect Drive.' }))
    }
  }, [data, drive.connected])

  const connectDrive = useCallback(async () => {
    try {
      const next = await connect(() => dataRef.current)
      setRawData(next) // not stamped: this is a sync, not a user edit
      setDrive({ connected: true, error: null })
    } catch (error) {
      console.error(error)
      setDrive({ connected: false, error: 'Could not connect to Google Drive.' })
    }
  }, [])

  const disconnectDrive = useCallback(() => {
    disconnect()
    setDrive({ connected: false, error: null })
  }, [])

  useEffect(() => {
    loadData().then((d) => {
      dataRef.current = d
      setRawData(d)
    })
  }, [])

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