import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const TOOLS = [
  ['B', 'Bold', 'bold', (c) => c.toggleBold()],
  ['I', 'Italic', 'italic', (c) => c.toggleItalic()],
  ['•', 'Bullet list', 'bulletList', (c) => c.toggleBulletList()],
  ['1.', 'Numbered list', 'orderedList', (c) => c.toggleOrderedList()],
]

export default function RichEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'rich min-h-40 px-3 py-2 text-sm focus:outline-none',
        'aria-label': 'Description',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="rounded-lg border border-zinc-300 bg-white focus-within:outline-2 focus-within:outline-accent dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex gap-1 border-b border-zinc-200 p-1 dark:border-zinc-700">
        {TOOLS.map(([label, title, name, run]) => (
          <button
            key={name}
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={editor.isActive(name)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(editor.chain().focus()).run()}
            className={`rounded px-2.5 py-1 text-sm ${
              editor.isActive(name)
                ? 'bg-accent/10 font-semibold text-accent'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}