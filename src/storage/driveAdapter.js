import { config } from '../config'

const SCOPE = 'https://www.googleapis.com/auth/drive.appdata email'
const HINT_KEY = 'prod-tracker:drive-email'
const SILENT_TIMEOUT = 8000 // ms before a silent (no popup) sign-in is given up on
const CLIENT_ID = config.googleClientId
const FILE_NAME = config.driveFileName

let tokenClient = null
let token = null // { value, expires }
let fileId = null

function getHint() {
  try {
    return localStorage.getItem(HINT_KEY) || undefined
  } catch {
    return undefined
  }
}

function rememberEmail(accessToken) {
  fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then((r) => r.json())
    .then((u) => {
      if (u.email) localStorage.setItem(HINT_KEY, u.email)
    })
    .catch(() => {})
}

// Popup sign-in. Call from a button click so the popup isn't blocked.
// With silent = true there is no popup; it fails (or times out) if Google
// needs the user to interact.
export function signIn(silent = false) {
  if (token && token.expires > Date.now()) return Promise.resolve()
  if (!CLIENT_ID) return Promise.reject(new Error('Missing VITE_GOOGLE_CLIENT_ID'))
  if (typeof google === 'undefined') return Promise.reject(new Error('Google script not loaded'))
  return new Promise((resolve, reject) => {
    let timeout = null
    const finish = (fn, arg) => {
      clearTimeout(timeout)
      fn(arg)
    }
    tokenClient ??= google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: () => {},
      error_callback: () => {},
    })
    tokenClient.callback = (res) => {
      if (res.error) return finish(reject, new Error(res.error))
      token = {
        value: res.access_token,
        expires: Date.now() + (res.expires_in - 60) * 1000,
      }
      rememberEmail(res.access_token)
      finish(resolve)
    }
    tokenClient.error_callback = (err) => finish(reject, new Error(err?.type || 'popup_error'))
    if (silent) timeout = setTimeout(() => reject(new Error('silent_sign_in_timeout')), SILENT_TIMEOUT)
    tokenClient.requestAccessToken({ prompt: silent ? 'none' : '', hint: getHint() })
  })
}

async function api(url, options = {}) {
  if (!token || token.expires < Date.now()) await signIn(true)
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token.value}`, ...options.headers },
  })
  if (res.status === 401) token = null // token was revoked or expired: next call signs in again
  if (!res.ok) throw new Error(`Drive error ${res.status}`)
  return res
}

async function findFile() {
  if (fileId) return fileId
  const q = encodeURIComponent(`name='${FILE_NAME}'`)
  const res = await api(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`
  )
  const { files } = await res.json()
  fileId = files[0]?.id ?? null
  return fileId
}

export const driveAdapter = {
  name: 'drive',

  async load() {
    const id = await findFile()
    if (!id) return null
    const res = await api(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`)
    return res.json()
  },

  async save(data) {
    const id = await findFile()
    if (id) {
      await api(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return
    }
    const boundary = 'b' + Math.random().toString(36).slice(2)
    const meta = { name: FILE_NAME, parents: ['appDataFolder'] }
    const body =
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(meta)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(data)}\r\n` +
      `--${boundary}--`
    const res = await api(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      }
    )
    fileId = (await res.json()).id
  },
}