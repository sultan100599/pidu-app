import { defineConfig, devices } from '@playwright/test'
import { E2E_API_PORT, E2E_WEB_PORT, backendDir, e2eEnv } from './e2e/env.js'

// Tes end-to-end: backend (port 8002, database e2e.sqlite) dan frontend (port 8011) terpisah
// dari server harian (8001/8010), jadi data asli tidak pernah tersentuh.
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  globalSetup: './e2e/global-setup.js',
  use: {
    baseURL: `http://localhost:${E2E_WEB_PORT}`,
    channel: 'chrome',
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    colorScheme: 'light',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1366, height: 768 } }, testIgnore: /mobile\.spec/ },
    { name: 'hp', use: { ...devices['Pixel 7'], channel: 'chrome' }, testMatch: /mobile\.spec/ },
  ],
  webServer: [
    {
      // php -S langsung (bukan artisan serve) supaya variabel environment tes tidak dibuang.
      command: `php -S 127.0.0.1:${E2E_API_PORT} ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php`,
      cwd: `${backendDir}/public`,
      url: `http://127.0.0.1:${E2E_API_PORT}/up`,
      env: e2eEnv,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${E2E_WEB_PORT} --strictPort`,
      url: `http://localhost:${E2E_WEB_PORT}`,
      env: { ...process.env, PIDU_API_URL: `http://127.0.0.1:${E2E_API_PORT}` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
