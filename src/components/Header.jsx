import { useModuleData } from '../data/DataContext'
import { storageName } from '../storage/storage'

const themeDefaults = { theme: 'dark' }

export default function Header() {
  const [settings, update] = useModuleData('settings', themeDefaults)
  const dark = settings.theme === 'dark'

  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-zinc-200 bg-zinc-50/90 px-4 backdrop-blur md:px-10 dark:border-zinc-800 dark:bg-zinc-950/90">
      <p className="font-semibold tracking-tight md:hidden">Prod tracker</p>
      <p className="hidden text-sm text-zinc-500 md:block">{date}</p>

      {/* Right side: add future items here (sync status, avatar, etc.) */}
      <div className="flex items-center gap-2">
        <span
          className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-700"
          title="Where your data is saved"
        >
          Saved: {storageName}
        </span>
        <button
          onClick={() => update((prev) => ({ ...prev, theme: dark ? 'light' : 'dark' }))}
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="rounded-lg px-2 py-1 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-accent dark:hover:bg-zinc-800"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}