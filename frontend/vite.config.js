import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'locales', test: /[\\/]i18n[\\/](messages|areas|files|icons|server)\.(js|json)$/ }],
        },
      },
    },
  },
  server: {
    port: 8010,
    strictPort: true,
    proxy: {
      '/api': {
        // Tes end-to-end memakai backend terpisah (PIDU_API_URL) supaya data asli tidak tersentuh.
        target: process.env.PIDU_API_URL ?? 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
})
