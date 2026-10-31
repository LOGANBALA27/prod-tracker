// src/config.js
export const config = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  driveFileName: import.meta.env.VITE_DRIVE_FILE_NAME || 'app-data.json',
  driveSaveDelay: Number(import.meta.env.VITE_DRIVE_SAVE_DELAY) || 1500,
  driveFlagKey: 'prod-tracker:drive',
}