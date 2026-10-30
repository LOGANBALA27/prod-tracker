// Small reusable building blocks. Restyle here and the whole app changes.

export const Card = ({ className = '', ...props }) => (
  <section
    className={`rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    {...props}
  />
)

const buttonStyles = {
  primary: 'bg-accent text-white hover:opacity-90',
  ghost: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
  danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950',
}

export const Button = ({ variant = 'primary', className = '', ...props }) => (
  <button
    className={`rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 ${buttonStyles[variant]} ${className}`}
    {...props}
  />
)

const fieldStyles =
  'w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-accent focus:outline-none dark:border-zinc-700'

export const Input = ({ className = '', ...props }) => (
  <input className={`${fieldStyles} ${className}`} {...props} />
)

export const Textarea = ({ className = '', ...props }) => (
  <textarea rows={3} className={`${fieldStyles} ${className}`} {...props} />
)

export function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
    >
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export const PageHeader = ({ title, subtitle }) => (
  <header className="mb-6">
    <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
    {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
  </header>
)
