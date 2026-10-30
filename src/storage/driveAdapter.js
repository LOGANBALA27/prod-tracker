// Google Drive adapter: NOT IMPLEMENTED YET.
// When it's ready, it must match localAdapter: { name, load(), save(data) }.
//
// Plan:
//  1. Google Cloud: enable the Drive API and create a Web OAuth Client ID.
//     Put the ID in .env.production as VITE_GOOGLE_CLIENT_ID (it isn't a secret).
//  2. Load Google Identity Services and request the scope
//     https://www.googleapis.com/auth/drive.file
//  3. load(): look for the file "prod-tracker-data.json" via the Drive files API,
//     download it, and return its JSON. Return null if the file doesn't exist.
//  4. save(data): create the file if missing, otherwise update it.
//  5. IMPORTANT: if load() fails (for example, not signed in), block saving.
//     Otherwise the sample data could overwrite your real data in Drive.
//
// export const driveAdapter = {
//   name: 'drive',
//   async load() { /* ... */ },
//   async save(data) { /* ... */ },
// }

export const driveAdapter = null // replace with the object above when ready