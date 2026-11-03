import { useEffect, useRef, useState } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useModuleData } from '../../data/DataContext'

const DEFAULTS = { notes: [] } // keep stable, useModuleData depends on it

const parse = (s) => {
  try {
    const blocks = JSON.parse(s)
    return Array.isArray(blocks) && blocks.length ? blocks : undefined
  } catch {
    return undefined
  }
}

// Follows the page's dark mode (a "dark" class on <html>, or the system setting)
const isDark = () =>
  document.documentElement.classList.contains('dark') ||
  window.matchMedia?.('(prefers-color-scheme: dark)').matches

// Makes the editor blend into the page instead of sitting in a box
const EDITOR_CSS = `
  .notes-editor .bn-container[data-color-scheme] {
    --bn-colors-editor-background: transparent;
  }
`

// full = true: use the whole width (page list is hidden)
function NoteEditor({ note, onPatch, full }) {
  const editor = useCreateBlockNote({ initialContent: parse(note.content) })
  const lastSaved = useRef(note.content)
  const timer = useRef(null)
  const patchRef = useRef(onPatch)
  patchRef.current = onPatch

  const flush = () => {
    timer.current = null
    const content = JSON.stringify(editor.document)
    if (content === lastSaved.current) return
    lastSaved.current = content
    patchRef.current({ content })
  }

  const handleChange = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, 400)
  }

  // Save any pending edit when switching notes / leaving the module
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current)
        flush()
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Pick up changes that arrived from Drive while this note is open
  useEffect(() => {
    if (note.content === lastSaved.current) return
    lastSaved.current = note.content
    const blocks = parse(note.content)
    if (blocks) editor.replaceBlocks(editor.document, blocks)
  }, [note.content, editor])

  return (
    <div
      className={`notes-editor mx-auto w-full px-4 pb-32 pt-10 sm:px-12 ${
        full ? 'max-w-none' : 'max-w-3xl'
      }`}
    >
      <style>{EDITOR_CSS}</style>
      <input
        value={note.title}
        onChange={(e) => onPatch({ title: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            editor.focus()
          }
        }}
        placeholder="Untitled"
        className="mb-4 w-full bg-transparent px-[54px] text-4xl font-bold text-zinc-800 outline-none placeholder:text-zinc-300 dark:text-zinc-100 dark:placeholder:text-zinc-600"
      />
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme={isDark() ? 'dark' : 'light'}
      />
    </div>
  )
}

export default function Notes() {
  const [state, update] = useModuleData('notes', DEFAULTS)
  const [activeId, setActiveId] = useState(null)

  // Is the page list visible? Remembered on this device only (not synced).
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem('notes:sidebar') !== '0'
    } catch {
      return true
    }
  })
  const toggle = (value) => {
    setOpen(value)
    try {
      localStorage.setItem('notes:sidebar', value ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  const notes = state.notes ?? []
  const active = notes.find((n) => n.id === activeId) ?? notes[0]

  const addNote = () => {
    const id = crypto.randomUUID()
    update((p) => ({
      ...p,
      notes: [{ id, title: '', content: '[]' }, ...(p.notes ?? [])],
    }))
    setActiveId(id)
  }

  const patchNote = (id, patch) =>
    update((p) => ({
      ...p,
      notes: p.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }))

  const removeNote = (id) => {
    if (!window.confirm('Delete this page?')) return
    update((p) => ({ ...p, notes: p.notes.filter((n) => n.id !== id) }))
    setActiveId(null)
  }

  return (
    <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white md:flex-row dark:border-zinc-800 dark:bg-zinc-900">
      {/* Sidebar (hidden when collapsed) */}
      {open && (
        <aside className="shrink-0 border-b border-zinc-200 bg-zinc-50 p-2 md:w-60 md:border-b-0 md:border-r dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Pages
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={addNote}
                title="New page"
                className="rounded px-1.5 text-lg leading-none text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                +
              </button>
              <button
                onClick={() => toggle(false)}
                title="Hide pages"
                className="rounded px-1.5 text-lg leading-none text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                «
              </button>
            </div>
          </div>

          <div className="max-h-48 space-y-0.5 overflow-y-auto md:max-h-none">
            {notes.map((n) => (
              <div
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={`group flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm ${
                  n.id === active?.id
                    ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
                }`}
              >
                <span>📄</span>
                <span className="min-w-0 flex-1 truncate">{n.title || 'Untitled'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeNote(n.id)
                  }}
                  title="Delete page"
                  className="hidden rounded px-1 text-zinc-400 hover:bg-zinc-300 hover:text-red-500 group-hover:block dark:hover:bg-zinc-700"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addNote}
            className="mt-1 flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <span>＋</span> New page
          </button>
        </aside>
      )}

      {/* Page */}
      <section className="relative min-w-0 flex-1 overflow-y-auto">
        {/* Show-pages button, only visible while the list is collapsed */}
        {!open && (
          <button
            onClick={() => toggle(true)}
            title="Show pages"
            className="absolute left-2 top-2 z-10 rounded px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            » Pages
          </button>
        )}

        {active ? (
          // key remounts the editor when you switch pages
          <NoteEditor
            key={active.id}
            note={active}
            full={!open}
            onPatch={(p) => patchNote(active.id, p)}
          />
        ) : (
          <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-400">
            <span className="text-4xl">📓</span>
            <p className="text-sm">No pages yet</p>
            <button
              onClick={addNote}
              className="rounded bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Create your first page
            </button>
          </div>
        )}
      </section>
    </div>
  )
}