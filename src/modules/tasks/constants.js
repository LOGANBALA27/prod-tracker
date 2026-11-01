// Add, rename or reorder columns here. The board updates by itself.
// canAdd: true shows the "+ Add a task" button in that column.
export const COLUMNS = [
  { id: 'todo', label: 'To do', canAdd: true },
  { id: 'doing', label: 'In progress' },
  { id: 'done', label: 'Done' },
]
export const FIRST = COLUMNS[0].id
export const LAST = COLUMNS[COLUMNS.length - 1].id

// Tag colours. Full class names are written out so Tailwind can see them.
export const TAG_COLORS = [
  { id: 'blue', swatch: 'bg-blue-500', chip: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' },
  { id: 'green', swatch: 'bg-green-500', chip: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' },
  { id: 'amber', swatch: 'bg-amber-500', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
  { id: 'red', swatch: 'bg-red-500', chip: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
  { id: 'purple', swatch: 'bg-purple-500', chip: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300' },
  { id: 'pink', swatch: 'bg-pink-500', chip: 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-300' },
]

export const PRIORITIES = [
  {
    id: 'high',
    label: 'High',
    dot: 'bg-red-500',
    chip: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    active: 'bg-red-500 text-white',
  },
  {
    id: 'medium',
    label: 'Medium',
    dot: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    active: 'bg-amber-500 text-white',
  },
  {
    id: 'low',
    label: 'Low',
    dot: 'bg-sky-500',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    active: 'bg-sky-500 text-white',
  },
]

export const colorOf = (id) => TAG_COLORS.find((c) => c.id === id) ?? TAG_COLORS[0]

// Older tasks used done: true/false, and tasks in a removed column
// fall back to the first one, so nothing disappears.
export const statusOf = (t) => {
  const s = t.status ?? (t.done ? LAST : FIRST)
  return COLUMNS.some((c) => c.id === s) ? s : FIRST
}

// Adds the id to the list, or removes it if it is already there.
export const toggleId = (ids, id) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
