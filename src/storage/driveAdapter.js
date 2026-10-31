import { config } from '../config'

const SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const CLIENT_ID = config.googleClientId
const FILE_NAME = config.driveFileName

let tokenClient = null
let token = null // { value, expires }
let fileId = null

// Call from a button click so the popup isn't blocked
export function signIn(silent = false) {
  if (!CLIENT_ID) return Promise.reject(new Error('Missing VITE_GOOGLE_CLIENT_ID'))
  if (typeof google === 'undefined') return Promise.reject(new Error('Google script not loaded'))
  return new Promise((resolve, reject) => {
    tokenClient ??= google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: () => {},
      error_callback: () => {},
    })
    tokenClient.callback = (res) => {
      if (res.error) return reject(new Error(res.error))
      token = {
        value: res.access_token,
        expires: Date.now() + (res.expires_in - 60) * 1000,
      }
      resolve()
    }
    tokenClient.error_callback = (err) => reject(new Error(err?.type || 'popup_error'))
    tokenClient.requestAccessToken({ prompt: silent ? 'none' : '' })
  })
}

async function api(url, options = {}) {
  if (!token || token.expires < Date.now()) await signIn()
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token.value}`, ...options.headers },
  })
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
    const res = await api(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media`
    )
    return res.json()
  },

  async save(data) {
    const id = await findFile()
    if (id) {
      await api(
        `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )
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