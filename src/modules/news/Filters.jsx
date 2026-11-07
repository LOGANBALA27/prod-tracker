import {
  COUNTRIES, LANGUAGES, CATEGORIES, TAGS, DATATYPES,
  TIMEZONES, PRIORITIES,
} from './options'

// text-base (16px) on phones stops iPhones from zooming in when a field is tapped
const box =
  'rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-base md:text-sm dark:border-zinc-700'

function MultiSelect({ label, options, field, onChange, canExclude = true }) {
  const { values, exclude } = field
  const toggle = (v) =>
    onChange({ ...field, values: values.includes(v) ? values.filter((x) => x !== v) : [...values, v] })

  return (
    <details className={box}>
      <summary className="cursor-pointer">
        {label}
        {values.length > 0 && (
          <span className="text-zinc-500"> · {exclude ? 'not ' : ''}{values.length}</span>
        )}
      </summary>
      {canExclude && (
        <label className="mt-2 flex items-center gap-2 py-1 text-sm text-zinc-500">
          <input
            type="checkbox"
            checked={exclude}
            onChange={(e) => onChange({ ...field, exclude: e.target.checked })}
          />
          Exclude instead
        </label>
      )}
      <div className="mt-2 max-h-48 overflow-y-auto">
        {options.map(([value, name]) => (
          <label key={value} className="flex items-center gap-2 py-2 text-sm">
            <input type="checkbox" checked={values.includes(value)} onChange={() => toggle(value)} />
            {name}
          </label>
        ))}
      </div>
    </details>
  )
}

function Select({ label, options, value, onChange }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${box} text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100`}
      >
        {options.map(([v, name]) => (
          <option key={v} value={v}>{name}</option>
        ))}
      </select>
    </label>
  )
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 py-1 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export default function Filters({ filters, onChange, onApply, onReset, open, onToggle }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <details
      open={open}
      onToggle={(e) => onToggle(e.currentTarget.open)}
      className="mb-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <summary className="cursor-pointer text-sm font-semibold">Filters</summary>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <MultiSelect label="Country" options={COUNTRIES} field={filters.country} onChange={(v) => set('country', v)} />
        <MultiSelect label="Language" options={LANGUAGES} field={filters.language} onChange={(v) => set('language', v)} />
        <MultiSelect label="Category" options={CATEGORIES} field={filters.category} onChange={(v) => set('category', v)} />
        <MultiSelect label="Article type" options={DATATYPES} field={filters.datatype} onChange={(v) => set('datatype', v)} canExclude={false} />
        <MultiSelect label="Tag (paid plans)" options={TAGS} field={filters.tag} onChange={(v) => set('tag', v)} canExclude={false} />
        <Select label="Timezone" options={TIMEZONES} value={filters.timezone} onChange={(v) => set('timezone', v)} />
        <Select label="Source priority" options={PRIORITIES} value={filters.prioritydomain} onChange={(v) => set('prioritydomain', v)} />
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Only this website (e.g. bbc.com)
          <input
            value={filters.domainurl}
            onChange={(e) => set('domainurl', e.target.value)}
            placeholder="bbc.com"
            className={`${box} text-zinc-900 dark:text-zinc-100`}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <Check label="Has image" checked={filters.image} onChange={(v) => set('image', v)} />
        <Check label="Has video" checked={filters.video} onChange={(v) => set('video', v)} />
        <Check label="Remove duplicates" checked={filters.removeduplicate} onChange={(v) => set('removeduplicate', v)} />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onApply}
          className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-accent sm:flex-none"
        >
          Apply filters
        </button>
        <button
          onClick={onReset}
          className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-100 sm:flex-none dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Reset
        </button>
      </div>
    </details>
  )
}