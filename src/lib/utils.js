export const uid = () => crypto.randomUUID()

// Local date as YYYY-MM-DD (used as the key for each day)
export const todayKey = () => new Date().toLocaleDateString('en-CA')

export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(value).toLocaleDateString(undefined, options)
