const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#ec4899']

// Bursts confetti from a point on the screen (x, y in viewport pixels).
export function burst(x, y, count = 28) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span')
    const size = 6 + Math.random() * 6
    Object.assign(el.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size * 0.6}px`,
      background: COLORS[i % COLORS.length],
      borderRadius: '1px',
      pointerEvents: 'none',
      zIndex: '9999',
    })
    document.body.appendChild(el)

    const angle = Math.random() * Math.PI * 2
    const dist = 60 + Math.random() * 140
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist - 40

    const anim = el.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy + 140}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.3,1)' },
    )
    anim.onfinish = () => el.remove()
  }
}