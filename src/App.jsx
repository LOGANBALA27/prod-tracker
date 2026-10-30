import { useEffect, useState } from 'react'
import { DataProvider, useAppData } from './data/DataContext'
import Layout from './components/Layout'
import { modules } from './modules'

function Shell() {
  const { data } = useAppData()
  const theme = data.settings?.theme ?? 'dark'

  const fromHash = () => {
    const id = window.location.hash.slice(1)
    return modules.some((m) => m.id === id) ? id : modules[0].id
  }
  const [active, setActive] = useState(fromHash)

  useEffect(() => {
    window.location.hash = active
  }, [active])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const Active = modules.find((m) => m.id === active).component

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Layout items={modules} active={active} onNavigate={setActive}>
        <Active />
      </Layout>
    </div>
  )
}

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}
