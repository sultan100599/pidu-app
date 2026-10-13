import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { backendDir, e2eDatabase, e2eEnv } from './env.js'

// Database tes dibuat ulang setiap kali tes dijalankan (berisi data demo dari seeder).
export default function globalSetup() {
  writeFileSync(e2eDatabase, '')
  execFileSync('php', ['artisan', 'migrate:fresh', '--seed', '--force'], { cwd: backendDir, env: e2eEnv, stdio: 'pipe' })
}
