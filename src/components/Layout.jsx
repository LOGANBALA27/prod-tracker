import { useState } from 'react'
import Header from './Header'
import { useAppData } from '../data/DataContext'

const STORAGE_KEY = 'prod-tracker:sidebar-collapsed'

function NavButton({ item, active, onClick, mobile, collapsed }) {
  const shape = mobile
    ? 'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs'
    : `flex w-full items-center rounded-lg py-2 text-sm ${
        collapsed ? 'justify-center' : 'gap-3 px-3 text-left'
      }`
  const state = active
    ? 'bg-accent/10 font-semibold text-accent'
    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
  return (
    <button
      onClick={onClick}
      title={!mobile && collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`${shape} ${state} transition focus-visible:outline-2 focus-visible:outline-accent`}
    >
      <span aria-hidden="true">{item.icon}</span>
      <span className={!mobile && collapsed ? 'sr-only' : ''}>{item.label}</span>
    </button>
  )
}

export default function Layout({ items, active, onNavigate, wide, children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const { drive, connectDrive, disconnectDrive } = useAppData()

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  const top = items.filter((i) => !i.bottom)
  const bottom = items.filter((i) => i.bottom)

    return (
    <div className="min-h-screen md:flex">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-zinc-200 p-3 transition-[width] duration-200 md:flex dark:border-zinc-800 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className={`mb-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between px-3'}`}>
          {!collapsed && <h1 className="text-lg font-semibold tracking-tight">Prod tracker</h1>}
          <button
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-accent dark:hover:bg-zinc-800"
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {top.map((i) => (
            <NavButton key={i.id} item={i} collapsed={collapsed} active={i.id === active} onClick={() => onNavigate(i.id)} />
          ))}
          <div className="mt-auto flex flex-col gap-1">
            {bottom.map((i) => (
              <NavButton key={i.id} item={i} collapsed={collapsed} active={i.id === active} onClick={() => onNavigate(i.id)} />
            ))}
          </div>
        </nav>

        {/* Google Drive button: new block */}
        <div className="border-t border-zinc-200 pt-3 text-xs dark:border-zinc-800">
          {drive.connected ? (
            <button
              onClick={disconnectDrive}
              title="Drive synced. Click to disconnect"
              className={`w-full rounded-lg py-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                collapsed ? 'text-center' : 'px-3 text-left'
              }`}
            >
              {collapsed ? '☁️' : '☁️ Drive synced · Disconnect'}
            </button>
          ) : (
            <button
              onClick={connectDrive}
              title={drive.wasConnected ? 'Reconnect Google Drive' : 'Connect Google Drive'}
              className={`w-full rounded-lg py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                collapsed ? 'text-center' : 'px-3 text-left'
              }`}
            >
              {collapsed ? '☁️' : drive.wasConnected ? '☁️ Reconnect Google Drive' : '☁️ Connect Google Drive'}
            </button>
          )}
          {drive.error && !collapsed && <p className="mt-1 px-3 text-red-500">{drive.error}</p>}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className={`w-full flex-1 p-4 pb-28 md:px-10 md:py-4 ${wide ? 'md:px-10 md:py-4' : 'md:p-10'}`}>{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-zinc-800 dark:bg-zinc-900">
        {items.map((i) => (
          <NavButton key={i.id} item={i} mobile active={i.id === active} onClick={() => onNavigate(i.id)} />
        ))}
      </nav>
    </div>
  )
}