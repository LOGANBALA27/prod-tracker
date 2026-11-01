// Turns editor HTML into plain text. Nothing is ever rendered as HTML.
// separator ' ' gives a one-line preview; '\n' keeps paragraphs and list items on separate lines.
export function plainText(html = '', separator = ' ') {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(
    html.replace(/<\/(p|li|h\d)>/g, `$&${separator}`),
    'text/html'
  )
  return doc.body.textContent.trim()
}