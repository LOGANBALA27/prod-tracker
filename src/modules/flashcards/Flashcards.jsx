import { useEffect, useMemo, useRef, useState } from 'react'
import { fsrs, generatorParameters, Rating } from 'ts-fsrs'
import { useModuleData } from '../../data/DataContext'
import { newCard, toStored } from './cards'

// decks: [{ id, name, sourceNoteId? }]   cards: [{ id, deckId, topic, q, a, fsrs }]
// Cards live in their own flat list so each one syncs and deletes on its own.
const DEFAULTS = { decks: [], cards: [] } // keep stable, useModuleData depends on it
const scheduler = fsrs(generatorParameters({ enable_fuzz: true }))
const NONE = '__none' // filter key for cards without a topic

// ---------- helpers ----------

// Cards are saved as JSON, which turns Dates into text. Convert back for ts-fsrs.
const toCard = (s) => ({
  ...s,
  due: new Date(s.due),
  last_review: s.last_review ? new Date(s.last_review) : undefined,
})

const isDue = (c, now = Date.now()) => new Date(c.fsrs.due).getTime() <= now

function fmtInterval(due) {
  const ms = due.getTime() - Date.now()
  const min = Math.max(1, Math.round(ms / 60000))
  if (min < 60) return `${min}m`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d`
  return `${Math.round(d / 30)}mo`
}

const RATINGS = [
  { rating: Rating.Again, label: 'Again', key: '1', style: 'bg-red-500 hover:bg-red-600' },
  { rating: Rating.Hard, label: 'Hard', key: '2', style: 'bg-orange-500 hover:bg-orange-600' },
  { rating: Rating.Good, label: 'Good', key: '3', style: 'bg-green-600 hover:bg-green-700' },
  { rating: Rating.Easy, label: 'Easy', key: '4', style: 'bg-blue-600 hover:bg-blue-700' },
]

const btn =
  'rounded px-3 py-1.5 text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
const field =
  'w-full resize-none rounded border border-zinc-200 bg-transparent p-2 text-sm text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100'

// ---------- study screen ----------

// mode "due": ratings change the schedule. mode "all": practice only, nothing is saved.
// session.reverse (practice only): show the answer first, recall the question.
function Study({ cards, session, onRate, onExit }) {
  const [queue, setQueue] = useState(session.ids)
  const [shown, setShown] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const live = queue.filter((id) => cards.some((c) => c.id === id))
  const card = cards.find((c) => c.id === live[0])

  // Interval previews for the four buttons ("Good → 3d")
  const preview = useMemo(() => {
    if (!card || session.mode !== 'due') return null
    return scheduler.repeat(toCard(card.fsrs), new Date())
  }, [card, session.mode])

  const rate = (rating) => {
    if (!card) return
    let requeue = false
    if (session.mode === 'due') {
      const res = scheduler.next(toCard(card.fsrs), new Date(), rating)
      onRate(card.id, toStored(res.card))
      // Cards due again within 20 minutes come back later in this session
      requeue = res.card.due.getTime() - Date.now() < 20 * 60 * 1000
    } else {
      requeue = rating === Rating.Again
    }
    const rest = live.slice(1)
    setQueue(requeue ? [...rest, card.id] : rest)
    setReviewed((n) => n + 1)
    setShown(false)
  }

  // Keyboard: Space/Enter = reveal, 1-4 = rate
  const handlerRef = useRef()
  handlerRef.current = (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
    if (!shown && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault()
      setShown(true)
    } else if (shown && ['1', '2', '3', '4'].includes(e.key)) {
      rate([Rating.Again, Rating.Hard, Rating.Good, Rating.Easy][Number(e.key) - 1])
    }
  }
  useEffect(() => {
    const fn = (e) => handlerRef.current(e)
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  if (!card) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-4xl">🎉</span>
        <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100">Session complete</p>
        <p className="text-sm text-zinc-500">
          {reviewed} review{reviewed === 1 ? '' : 's'} done
        </p>
        <button onClick={onExit} className={btn}>
          Back to deck
        </button>
      </div>
    )
  }

  const front = session.reverse ? card.a : card.q
  const back = session.reverse ? card.q : card.a

  return (
    <div className="w-full space-y-4 py-2">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <button onClick={onExit} className="hover:underline">
          ← Exit
        </button>
        <span>
          {live.length} left
          {session.mode === 'all' ? ' · practice (not scheduled)' : ''}
          {session.reverse ? ' · reversed' : ''}
        </span>
      </div>

      {/* The whole card is clickable: click to reveal the answer */}
      <div
        onClick={() => !shown && setShown(true)}
        className={`flex min-h-[45vh] flex-col justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-6 sm:p-10 dark:border-zinc-700 dark:bg-zinc-800/50 ${
          shown ? '' : 'cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        {card.topic && (
          <span className="mb-3 w-fit rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {card.topic}
          </span>
        )}
        <p className="whitespace-pre-wrap text-xl font-medium text-zinc-800 sm:text-2xl dark:text-zinc-100">
          {front}
        </p>
        {shown ? (
          <>
            <hr className="my-6 border-zinc-200 dark:border-zinc-700" />
            <p className="whitespace-pre-wrap text-lg text-zinc-700 sm:text-xl dark:text-zinc-200">
              {back}
            </p>
          </>
        ) : (
          <p className="mt-6 text-sm text-zinc-400">Click the card to reveal the answer</p>
        )}
      </div>

      {shown && (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.label}
              onClick={() => rate(r.rating)}
              className={`rounded-lg py-3 text-sm font-medium text-white ${r.style}`}
            >
              {r.label}
              <span className="block text-xs font-normal opacity-80">
                {preview ? fmtInterval(preview[r.rating].card.due) : r.key}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- add / edit cards ----------

function CardsManager({ deck, cards, topics, defaultTopic, api }) {
  const [q, setQ] = useState('')
  const [a, setA] = useState('')
  const [topic, setTopic] = useState(defaultTopic)
  const [bulk, setBulk] = useState('')
  const [bulkTopic, setBulkTopic] = useState(defaultTopic)
  const [showBulk, setShowBulk] = useState(false)

  const addOne = () => {
    if (!q.trim() || !a.trim()) return
    api.addCards([newCard(q.trim(), a.trim(), deck.id, topic.trim())])
    setQ('')
    setA('')
  }

  // One card per line: "question | answer" or "question<TAB>answer" (e.g. pasted from a table)
  const addBulk = () => {
    const list = bulk
      .split('\n')
      .map((line) => {
        const i = line.includes('\t') ? line.indexOf('\t') : line.indexOf('|')
        if (i < 0) return null
        const cq = line.slice(0, i).trim()
        const ca = line.slice(i + 1).trim()
        return cq && ca ? newCard(cq, ca, deck.id, bulkTopic.trim()) : null
      })
      .filter(Boolean)
    if (!list.length) return
    api.addCards(list)
    setBulk('')
    setShowBulk(false)
  }

  return (
    <div className="space-y-6">
      <datalist id="topic-list">
        {topics.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <div className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
        <div className="grid gap-2 sm:grid-cols-2">
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Question"
            rows={2}
            className={field}
          />
          <textarea
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="Answer"
            rows={2}
            className={field}
          />
        </div>
        <input
          list="topic-list"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (optional)"
          className={field}
        />
        <div className="flex gap-2">
          <button onClick={addOne} className={btn}>
            Add card
          </button>
          <button onClick={() => setShowBulk((s) => !s)} className={btn}>
            {showBulk ? 'Cancel bulk add' : 'Bulk add'}
          </button>
        </div>
        {showBulk && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              One card per line: <code>question | answer</code>. Text copied from a table
              (tab-separated) works too. The topic below is applied to every card.
            </p>
            <textarea
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              rows={6}
              className={field}
              placeholder={'Capital of France | Paris\nH2O | Water'}
            />
            <input
              list="topic-list"
              value={bulkTopic}
              onChange={(e) => setBulkTopic(e.target.value)}
              placeholder="Topic for these cards (optional)"
              className={field}
            />
            <button onClick={addBulk} className={btn}>
              Add all
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {cards.length === 0 && (
          <p className="text-sm text-zinc-500">No cards here yet.</p>
        )}
        {cards.map((c) => (
          <div
            key={c.id}
            className="grid items-start gap-2 rounded-lg border border-zinc-200 p-2 sm:grid-cols-[1fr_1fr_10rem_auto] dark:border-zinc-700"
          >
            <textarea
              value={c.q}
              onChange={(e) => api.patchCard(c.id, { q: e.target.value })}
              rows={2}
              className={field}
            />
            <textarea
              value={c.a}
              onChange={(e) => api.patchCard(c.id, { a: e.target.value })}
              rows={2}
              className={field}
            />
            <input
              list="topic-list"
              value={c.topic ?? ''}
              onChange={(e) => api.patchCard(c.id, { topic: e.target.value })}
              placeholder="Topic"
              className={field}
            />
            <button
              onClick={() => window.confirm('Delete this card?') && api.removeCard(c.id)}
              title="Delete card"
              className="rounded px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- one deck ----------

function DeckView({ deck, cards, api, onBack }) {
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState('study')
  const [reverse, setReverse] = useState(false)
  const [selected, setSelected] = useState([]) // chosen topics; empty = all cards

  const topics = useMemo(
    () => [...new Set(cards.map((c) => c.topic).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [cards]
  )
  const hasUntopiced = cards.some((c) => !c.topic)

  // Ignore chosen topics that no longer exist (renamed or emptied)
  const active = selected.filter((s) => (s === NONE ? hasUntopiced : topics.includes(s)))
  const visible = active.length
    ? cards.filter((c) => active.includes(c.topic || NONE))
    : cards

  const toggleTopic = (key) =>
    setSelected((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]))

  const dueIds = visible.filter((c) => isDue(c)).map((c) => c.id)
  const newCount = visible.filter((c) => c.fsrs.reps === 0).length

  if (session) {
    return (
      <Study
        cards={visible}
        session={session}
        onRate={(id, stored) => api.patchCard(id, { fsrs: stored })}
        onExit={() => setSession(null)}
      />
    )
  }

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

  const chip = (key, label, count, due) => {
    const on = key === 'all' ? active.length === 0 : active.includes(key)
    return (
      <button
        key={key}
        onClick={() => (key === 'all' ? setSelected([]) : toggleTopic(key))}
        className={`rounded-full border px-3 py-1 text-xs ${
          on
            ? 'border-blue-600 bg-blue-600 text-white'
            : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
        }`}
      >
        {label} · {count}
        {due > 0 && <span className={on ? ' opacity-90' : ' text-blue-600 dark:text-blue-400'}> ({due} due)</span>}
      </button>
    )
  }

  const dueOf = (list) => list.filter((c) => isDue(c)).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className={btn}>
          ←
        </button>
        <input
          value={deck.name}
          onChange={(e) => api.patchDeck(deck.id, { name: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-2xl font-bold text-zinc-800 outline-none dark:text-zinc-100"
        />
        <button
          onClick={() => window.confirm('Delete this whole deck?') && api.removeDeck(deck.id)}
          className="text-sm text-zinc-400 hover:text-red-500"
        >
          Delete deck
        </button>
      </div>

      {/* Topic filter */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chip('all', 'All', cards.length, dueOf(cards))}
          {topics.map((t) => {
            const list = cards.filter((c) => c.topic === t)
            return chip(t, t, list.length, dueOf(list))
          })}
          {hasUntopiced &&
            chip(NONE, 'No topic', cards.filter((c) => !c.topic).length, dueOf(cards.filter((c) => !c.topic)))}
        </div>
      )}

      <p className="text-sm text-zinc-500">
        {dueIds.length} due · {newCount} new · {visible.length} total
        {active.length > 0 && ' (filtered)'}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={!dueIds.length}
          onClick={() => setSession({ mode: 'due', ids: dueIds })}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          Study due ({dueIds.length})
        </button>
        <button
          disabled={!visible.length}
          onClick={() =>
            setSession({ mode: 'all', reverse, ids: shuffle(visible.map((c) => c.id)) })
          }
          className={`${btn} disabled:opacity-40`}
        >
          Practice all (shuffled)
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={reverse}
            onChange={(e) => setReverse(e.target.checked)}
          />
          Reverse (show answer, recall the question)
        </label>
      </div>

      <div className="flex gap-4 border-b border-zinc-200 text-sm dark:border-zinc-700">
        {['study', 'cards'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-1 pb-2 ${
              tab === t
                ? 'border-zinc-800 text-zinc-900 dark:border-zinc-200 dark:text-zinc-100'
                : 'border-transparent text-zinc-500'
            }`}
          >
            {t === 'study' ? 'Overview' : `Cards (${visible.length})`}
          </button>
        ))}
      </div>

      {tab === 'study' ? (
        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            <b>Study due</b> shows only the cards scheduled for today. Rate each one honestly and
            the app spaces the next review for you.
          </p>
          <p>
            <b>Practice all</b> goes through every card in random order. It never changes your
            schedule, so use it for a full recall check before a test.
          </p>
          <p>
            <b>Reverse</b> applies to Practice all only. It shows the answer first so you recall
            the question. It is not scheduled, so it won't affect your due cards.
          </p>
          <p>
            <b>Topics:</b> tap one or more chips above to study just those topics. Tap All to
            clear the filter.
          </p>
          <p className="text-zinc-500">
            Click the card or press Space to show the answer, then press 1–4 to rate it.
          </p>
        </div>
      ) : (
        <CardsManager
          deck={deck}
          cards={visible}
          topics={topics}
          defaultTopic={active.length === 1 && active[0] !== NONE ? active[0] : ''}
          api={api}
        />
      )}
    </div>
  )
}

// ---------- module ----------

export default function Flashcards() {
  const [state, update] = useModuleData('flashcards', DEFAULTS)
  const [deckId, setDeckId] = useState(null)
  const decks = state.decks ?? []
  const allCards = state.cards ?? []
  const deck = decks.find((d) => d.id === deckId)

  // One-time conversion of older decks that stored their cards inside the deck
  useEffect(() => {
    if (!(state.decks ?? []).some((d) => Array.isArray(d.cards))) return
    update((p) => {
      const ds = p.decks ?? []
      const have = new Set((p.cards ?? []).map((c) => c.id))
      const moved = ds.flatMap((d) =>
        (d.cards ?? []).filter((c) => !have.has(c.id)).map((c) => ({ ...c, deckId: d.id }))
      )
      return {
        ...p,
        // eslint-disable-next-line no-unused-vars
        decks: ds.map(({ cards, ...rest }) => rest),
        cards: [...(p.cards ?? []), ...moved],
      }
    })
  }, [state.decks]) // eslint-disable-line react-hooks/exhaustive-deps

  const api = {
    patchDeck: (id, patch) =>
      update((p) => ({
        ...p,
        decks: (p.decks ?? []).map((d) => (d.id === id ? { ...d, ...patch } : d)),
      })),
    removeDeck: (id) => {
      update((p) => ({
        ...p,
        decks: (p.decks ?? []).filter((d) => d.id !== id),
        cards: (p.cards ?? []).filter((c) => c.deckId !== id),
      }))
      setDeckId(null)
    },
    addCards: (list) => update((p) => ({ ...p, cards: [...(p.cards ?? []), ...list] })),
    patchCard: (id, patch) =>
      update((p) => ({
        ...p,
        cards: (p.cards ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })),
    removeCard: (id) =>
      update((p) => ({ ...p, cards: (p.cards ?? []).filter((c) => c.id !== id) })),
  }

  const addDeck = () => {
    const id = crypto.randomUUID()
    update((p) => ({
      ...p,
      decks: [...(p.decks ?? []), { id, name: 'New deck' }],
    }))
    setDeckId(id)
  }

  return (
    <div className="min-h-[70vh] w-full rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {deck ? (
        <DeckView
          key={deck.id}
          deck={deck}
          cards={allCards.filter((c) => c.deckId === deck.id)}
          api={api}
          onBack={() => setDeckId(null)}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Flashcards</h2>
            <button onClick={addDeck} className={btn}>
              + New deck
            </button>
          </div>

          {decks.length === 0 && (
            <p className="py-10 text-center text-sm text-zinc-500">
              No decks yet. Create one to get started.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {decks.map((d) => {
              const mine = allCards.filter((c) => c.deckId === d.id)
              const due = mine.filter((c) => isDue(c)).length
              return (
                <button
                  key={d.id}
                  onClick={() => setDeckId(d.id)}
                  className="rounded-lg border border-zinc-200 p-4 text-left hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">
                    {d.name || 'Untitled'}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {due} due · {mine.length} cards
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}