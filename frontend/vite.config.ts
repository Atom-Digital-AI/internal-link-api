import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sitemap': 'http://localhost:8000',
      '/analyze': 'http://localhost:8000',
      '/bulk-analyze': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/config': 'http://localhost:8000',
      '/fetch-target': 'http://localhost:8000',
    },
  },
})
