import { createEmptyCard } from 'ts-fsrs'

// Cards are saved as JSON, so Dates are stored as text
export const toStored = (c) => ({
  ...c,
  due: c.due.toISOString(),
  last_review: c.last_review ? c.last_review.toISOString() : null,
})

export const newCard = (q, a, deckId, topic = '') => ({
  id: crypto.randomUUID(),
  deckId,
  topic,
  q,
  a,
  fsrs: toStored(createEmptyCard()),
})

// Plain text from a table cell or heading (handles older and newer BlockNote shapes)
function inlineText(x) {
  if (x == null) return ''
  if (typeof x === 'string') return x
  if (Array.isArray(x)) return x.map(inlineText).join('')
  if (x.type === 'text') return x.text ?? ''
  if (x.content) return inlineText(x.content)
  return ''
}

// Finds every table on the page (including nested ones) and returns [{ q, a, topic }].
// The topic is the nearest heading above the table.
export function tablesToCards(blocks) {
  const out = []
  let topic = ''

  const walk = (list) => {
    for (const b of list ?? []) {
      if (b.type === 'heading') topic = inlineText(b.content).trim()

      if (b.type === 'table' && b.content?.type === 'tableContent') {
        const rows = (b.content.rows ?? []).map((r) =>
          (r.cells ?? []).map((c) => inlineText(c).trim())
        )
        const header = rows[0] ?? []
        for (const row of rows.slice(1)) {
          const q = row[0]
          const rest = row.slice(1)
          let a = ''
          if (header.length <= 2) {
            a = rest[0] ?? ''
          } else {
            a = rest
              .map((v, i) => (v ? `${header[i + 1] || `Column ${i + 2}`}: ${v}` : ''))
              .filter(Boolean)
              .join('\n')
          }
          if (q && a) out.push({ q, a, topic })
        }
      }
      walk(b.children)
    }
  }

  walk(blocks)
  return out
}