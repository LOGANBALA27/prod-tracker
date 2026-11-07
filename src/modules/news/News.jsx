import { useState, useEffect, useCallback, useRef } from 'react'
import Filters from './Filters'
import { DEFAULT_FILTERS, SCOPES } from './options'

const KEY_STORAGE = 'prod-tracker:newsdata-key'
const PREFS_STORAGE = 'prod-tracker:news-prefs'
const DEFAULT_QUERY = '' // '' = latest news of any topic. Try 'binance' if you prefer.
const DEFAULT_SCOPE = 'qInTitle'

// Only these fields support "exclude" in the newsdata API
const EXCLUDABLE = ['country', 'language', 'category']

const readKey = () => {
  try {
    return localStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

// Last search, scope and applied filters (never contains the API key)
function readPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_STORAGE) || '{}')
    return {
      query: typeof p.query === 'string' ? p.query : DEFAULT_QUERY,
      scope: SCOPES.some(([v]) => v === p.scope) ? p.scope : DEFAULT_SCOPE,
      applied: { ...DEFAULT_FILTERS, ...(p.applied || {}) },
    }
  } catch {
    return { query: DEFAULT_QUERY, scope: DEFAULT_SCOPE, applied: DEFAULT_FILTERS }
  }
}

// newsdata returns "2026-11-07 01:30:23" in UTC with no zone marker
function timeAgo(pubDate) {
  if (!pubDate) return ''
  const d = new Date(pubDate.replace(' ', 'T') + 'Z')
  if (Number.isNaN(d.getTime())) return ''
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000))
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return d.toLocaleDateString()
}

function applyFilters(url, f) {
  for (const key of ['country', 'language', 'category', 'tag', 'datatype']) {
    const { values, exclude } = f[key]
    if (!values.length) continue
    const name = exclude && EXCLUDABLE.includes(key) ? `exclude${key}` : key
    url.searchParams.set(name, values.join(','))
  }
  if (f.timezone) url.searchParams.set('timezone', f.timezone)
  if (f.prioritydomain) url.searchParams.set('prioritydomain', f.prioritydomain)
  if (f.domainurl.trim()) url.searchParams.set('domainurl', f.domainurl.trim())
  if (f.image) url.searchParams.set('image', '1')
  if (f.video) url.searchParams.set('video', '1')
  if (f.removeduplicate) url.searchParams.set('removeduplicate', '1')
}

async function fetchNews({ query, scope, page, apiKey, filters }) {
  const url = new URL('https://newsdata.io/api/1/latest')
  url.searchParams.set('apikey', apiKey)
  if (query) url.searchParams.set(scope, query) // scope is q, qInTitle or qInMeta
  applyFilters(url, filters)
  if (page) url.searchParams.set('page', page)

  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'success') {
    throw new Error(data.results?.message || 'Failed to load news')
  }
  return data
}

const SENTIMENT_STYLE = {
  positive: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  neutral: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

function Chip({ children, className = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] leading-tight ${className}`}>{children}</span>
  )
}

function ArticleCard({ a }) {
  const categories = (a.category || []).slice(0, 2)
  const author = Array.isArray(a.creator) ? a.creator[0] : a.creator

  return (
    <a
      href={a.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full gap-3 rounded-lg border border-zinc-200 p-3 transition hover:bg-zinc-50 md:flex-col dark:border-zinc-800 dark:hover:bg-zinc-800/50"
    >
      {a.image_url && (
        <img
          src={a.image_url}
          alt=""
          loading="lazy"
          onError={(e) => (e.currentTarget.style.display = 'none')}
          className="h-20 w-20 shrink-0 rounded-md object-cover md:h-40 md:w-full"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex flex-wrap gap-1">
          {a.sentiment && <Chip className={SENTIMENT_STYLE[a.sentiment] || SENTIMENT_STYLE.neutral}>{a.sentiment}</Chip>}
          {categories.map((c) => <Chip key={c}>{c}</Chip>)}
          {a.datatype && a.datatype !== 'news' && <Chip>{a.datatype}</Chip>}
          {a.video_url && <Chip>▶ video</Chip>}
        </div>

        <p className="line-clamp-3 break-words text-sm font-semibold">{a.title}</p>
        {a.description && (
          <p className="mt-1 line-clamp-2 break-words text-xs text-zinc-500 md:line-clamp-3">
            {a.description}
          </p>
        )}

        <div className="mt-auto pt-2 text-xs text-zinc-400">
          {author && <p className="mb-1 truncate">By {author}</p>}
          <p className="flex min-w-0 items-center gap-1.5">
            {a.source_icon && (
              <img
                src={a.source_icon}
                alt=""
                loading="lazy"
                onError={(e) => (e.currentTarget.style.display = 'none')}
                className="h-4 w-4 shrink-0 rounded-sm"
              />
            )}
            <span className="truncate">{a.source_name}</span>
            <span className="shrink-0">· {timeAgo(a.pubDate)}</span>
          </p>
        </div>
      </div>
    </a>
  )
}

// text-base (16px) on phones stops iPhones from zooming in when an input is tapped
const inputClass =
  'rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-base md:text-sm dark:border-zinc-700'

export default function News() {
  const [initial] = useState(readPrefs)

  const [apiKey, setApiKey] = useState(readKey)
  const [keyInput, setKeyInput] = useState('')

  const [input, setInput] = useState(initial.query)
  const [query, setQuery] = useState(initial.query)
  const [scope, setScope] = useState(initial.scope)
  const [filters, setFilters] = useState(initial.applied)
  const [applied, setApplied] = useState(initial.applied)

  const [articles, setArticles] = useState([])
  const [total, setTotal] = useState(null)
  const [nextPage, setNextPage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [error, setError] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)

  const reqId = useRef(0) // lets us ignore responses from outdated requests

  const saveKey = () => {
    const k = keyInput.trim()
    if (!k) return
    try {
      localStorage.setItem(KEY_STORAGE, k)
    } catch {
      /* ignore: key just won't persist */
    }
    setApiKey(k)
    setKeyInput('')
  }

  const clearKey = () => {
    try {
      localStorage.removeItem(KEY_STORAGE)
    } catch {
      /* ignore */
    }
    reqId.current++
    setApiKey('')
    setArticles([])
    setTotal(null)
    setNextPage(null)
    setError('')
  }

  const load = useCallback(
    async (q, s, page, f) => {
      const id = ++reqId.current
      setLoading(true)
      setError('')
      try {
        const data = await fetchNews({ query: q, scope: s, page, apiKey, filters: f })
        if (id !== reqId.current) return
        setArticles((prev) => {
          const merged = page ? [...prev, ...data.results] : data.results
          const seen = new Set()
          return merged.filter((a) => !seen.has(a.article_id) && seen.add(a.article_id))
        })
        setTotal(data.totalResults ?? null)
        setNextPage(data.nextPage || null)
      } catch (e) {
        if (id === reqId.current) setError(e.message)
      } finally {
        if (id === reqId.current) setLoading(false)
      }
    },
    [apiKey]
  )

  // Fresh load whenever the search, scope, applied filters, key or refresh button changes
  useEffect(() => {
    if (apiKey) load(query, scope, null, applied)
  }, [query, scope, applied, apiKey, refreshTick, load])

  // Remember the last search and filters
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE, JSON.stringify({ query, scope, applied }))
    } catch {
      /* ignore */
    }
  }, [query, scope, applied])

const submit = (e) => {
  e.preventDefault()
  setQuery(input.trim())
  setFiltersOpen(false)
}

const apply = () => {
  setApplied(filters)
  setFiltersOpen(false)
}

const reset = () => {
  setFilters(DEFAULT_FILTERS)
  setApplied(DEFAULT_FILTERS)
  setFiltersOpen(false)
}

  // No key yet: show the key form
  if (!apiKey) {
    return (
      <div className="w-full max-w-md">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">News</h2>
        <p className="mb-2 text-sm">
          Paste your newsdata.io API key. It's stored only in this browser.
        </p>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="API key"
          className={`w-full ${inputClass}`}
        />
        <button
          onClick={saveKey}
          className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-accent"
        >
          Save key
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">News</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setRefreshTick((t) => t + 1)}
            disabled={loading}
            className="py-1 text-xs text-zinc-500 hover:underline disabled:opacity-50"
          >
            Refresh
          </button>
          <button onClick={clearKey} className="py-1 text-xs text-zinc-500 hover:underline">
            Change key
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="mb-2 flex flex-wrap gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={512}
          placeholder="Search news… (leave empty for latest)"
          className={`min-w-0 basis-full sm:flex-1 sm:basis-0 ${inputClass}`}
        />
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          aria-label="Search in"
          className={`min-w-0 flex-1 sm:flex-none ${inputClass} dark:bg-zinc-900`}
        >
          {SCOPES.map(([v, name]) => (
            <option key={v} value={v}>{name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Search
        </button>
      </form>

      <details className="mb-4 text-xs text-zinc-500">
        <summary className="cursor-pointer py-1">Search tips</summary>
        <ul className="mt-1 space-y-1 pl-4">
          <li>Exact phrase: <code>"social pizza"</code></li>
          <li>Both words: <code>bitcoin AND ethereum</code></li>
          <li>Either word: <code>bitcoin OR ethereum</code></li>
          <li>Leave a word out: <code>bitcoin NOT scam</code></li>
          <li>Combine: <code>(bitcoin OR ethereum) NOT scam</code></li>
          <li>AND, OR and NOT must be in capitals.</li>
        </ul>
      </details>

<Filters
  filters={filters}
  onChange={setFilters}
  onApply={apply}
  onReset={reset}
  open={filtersOpen}
  onToggle={setFiltersOpen}
/>

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      {total !== null && articles.length > 0 && (
        <p className="mb-3 text-xs text-zinc-500">
          Showing {articles.length.toLocaleString()} of {total.toLocaleString()} articles
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {articles.map((a) => (
          <li key={a.article_id} className="min-w-0">
            <ArticleCard a={a} />
          </li>
        ))}
      </ul>

      {loading && <p className="py-4 text-center text-sm text-zinc-500">Loading…</p>}

      {!loading && !error && articles.length === 0 && (
        <p className="py-4 text-center text-sm text-zinc-500">No articles found.</p>
      )}

      {!loading && nextPage && (
        <button
          onClick={() => load(query, scope, nextPage, applied)}
          className="mt-4 w-full rounded-lg border border-zinc-200 py-2 text-sm hover:bg-zinc-100 sm:mx-auto sm:block sm:w-64 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Load more
        </button>
      )}
    </div>
  )
}