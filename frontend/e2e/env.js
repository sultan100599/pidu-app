import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const E2E_API_PORT = 8002
export const E2E_WEB_PORT = 8011

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const backendDir = path.resolve(frontendDir, '..', 'backend')
export const e2eDatabase = path.join(backendDir, 'database', 'e2e.sqlite')

// Nilai di sini menang atas backend/.env (Laravel tidak menimpa variabel yang sudah ada).
export const e2eEnv = {
  ...process.env,
  DB_CONNECTION: 'sqlite',
  DB_DATABASE: e2eDatabase,
  MAIL_MAILER: 'array',
  AUTH_THROTTLE_PER_MINUTE: '1000',
  FRONTEND_URL: `http://localhost:${E2E_WEB_PORT}`,
  LOG_CHANNEL: 'null',
}
