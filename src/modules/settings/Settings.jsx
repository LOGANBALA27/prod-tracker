import { useRef, useState } from 'react'
import { useAppData, useModuleData } from '../../data/DataContext'
import { Button, Card, PageHeader } from '../../components/ui'
import { exportData, importData } from '../../storage/storage'

const defaults = { theme: 'dark' }

export default function Settings() {
  const { data, setData, drive } = useAppData()
  const storageName = drive.connected ? 'Google Drive (and this device)' : 'This device'
  const [settings, update] = useModuleData('settings', defaults)
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setData(await importData(file))
      setMessage('Data imported.')
    } catch {
      setMessage('That file could not be read. Choose a JSON file exported from this app.')
    }
    e.target.value = ''
  }

  const reset = () => {
  const where = drive.connected ? 'this device and Google Drive' : 'this browser'
  if (window.confirm(`Delete all your data from ${where}? Export a backup first.`)) {
    setData({})
    setMessage('All data cleared.')
  }
}

  return (
    <>
      <PageHeader title="Settings" />

      <Card className="mb-4">
        <h3 className="mb-3 font-medium">Appearance</h3>
        <div className="flex gap-2">
          {['light', 'dark'].map((t) => (
            <Button
              key={t}
              variant={settings.theme === t ? 'primary' : 'ghost'}
              onClick={() => update((prev) => ({ ...prev, theme: t }))}
            >
              {t === 'light' ? 'Light' : 'Dark'}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-medium">Your data</h3>
        <p className="mb-3 text-sm text-zinc-500">
          Saved to: {storageName}. Export a backup now and then.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => exportData(data)}>Export backup</Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            Import backup
          </Button>
          <Button variant="danger" onClick={reset}>
            Clear all data
          </Button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
        </div>
        {message && <p className="mt-3 text-sm text-zinc-500" role="status">{message}</p>}
      </Card>
    </>
  )
}
