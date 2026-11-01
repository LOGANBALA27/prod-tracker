// Pure date and streak helpers. A habit's log looks like { '2026-11-01': 'done', '2026-11-02': 'missed' }.

// Adds (or subtracts) days from a 'YYYY-MM-DD' key, in local time.
export function addDays(key, n) {
  const d = new Date(`${key}T00:00:00`)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}

// The last `count` day keys, ending today (oldest first).
export const lastDays = (today, count) =>
  Array.from({ length: count }, (_, i) => addDays(today, i - (count - 1)))

// Consecutive 'done' days counting back from today.
// If today isn't marked yet, the streak is still alive (counted from yesterday).
// A 'missed' today, or any unmarked or missed earlier day, ends it.
export function currentStreak(log, today) {
  if (log[today] === 'missed') return 0
  let day = log[today] === 'done' ? today : addDays(today, -1)
  let count = 0
  while (log[day] === 'done') {
    count++
    day = addDays(day, -1)
  }
  return count
}

// Tap order for a day: not marked -> done -> missed -> not marked.
export const nextStatus = (status) => ({ done: 'missed', missed: null })[status] ?? 'done'