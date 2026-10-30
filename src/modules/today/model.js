// Pure functions only (no React).
import { STATUS } from './constants'
import { uid } from '../../lib/utils'

const pad = (n) => String(n).padStart(2, '0')

/* ---------- dates ---------- */

// Assumes your todayKey() returns 'YYYY-MM-DD'. Adjust here if it doesn't.
export const shiftDateKey = (key, days) => {
  const [y, m, d] = key.split('-').map(Number)
  const next = new Date(y, m - 1, d + days)
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
}

/* ---------- duration ---------- */

// "45", "45m", "1h", "1.5h", "1h 30m", "1h30", "1:30"  ->  minutes (or null if invalid)
export const parseDuration = (input) => {
  const s = String(input ?? '').trim().toLowerCase()
  if (!s) return null

  let total = null
  let m = s.match(/^(\d+):(\d{1,2})$/)
  if (m) {
    total = Number(m[1]) * 60 + Number(m[2])
  } else if (/^\d+$/.test(s)) {
    total = Number(s)
  } else {
    m = s.match(/^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+)\s*(?:m(?:ins?|inutes?)?)?)?$/)
    if (!m) return null
    total = Math.round(Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0))
  }
  return total > 0 && total <= 24 * 60 ? total : null
}

export const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export const totalMinutes = (logs) => logs.reduce((sum, l) => sum + l.minutes, 0)

/* ---------- tasks & logs ---------- */

// Also cleans up tasks saved by earlier versions (old time fields are ignored,
// old "unexpected event" blocks are dropped).
export const normalizeTask = (t) => ({
  id: t.id,
  text: t.text,
  status: t.status ?? (t.done ? STATUS.DONE : STATUS.PENDING),
  reason: t.reason ?? '',
  logs: t.logs ?? [],
})

export const normalizeDay = (d) => ({
  tasks: (d?.tasks ?? []).filter((t) => t.kind !== 'event').map(normalizeTask),
  note: d?.note ?? '',
})

export const createTask = (text) => ({
  id: uid(),
  text: text.trim(),
  status: STATUS.PENDING,
  reason: '',
  logs: [],
})

// A log entry = "what I did" + "how long".
export const createLog = ({ text, minutes }) => ({
  id: uid(),
  text: text.trim(),
  minutes,
})