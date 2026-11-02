// Turns indented text into a nested tree: [{ text, due, children }]
export function parseOutline(raw) {
  const root = { children: [] }
  const stack = [{ depth: -1, node: root }]

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    const depth = line.match(/^[\t ]*/)[0].replace(/\t/g, '  ').length
    // strip bullets like "-", "*", "•" (the app numbers items itself)
    const text = line.trim().replace(/^[-*•]\s+/, '')
    if (!text) continue

    while (stack[stack.length - 1].depth >= depth) stack.pop()
    const node = { text, due: '', children: [] }
    stack[stack.length - 1].node.children.push(node)
    stack.push({ depth, node })
  }
  return root.children
}

export const countNodes = (nodes) =>
  nodes.reduce((n, x) => n + 1 + countNodes(x.children), 0)