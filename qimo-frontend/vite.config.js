import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import projectConfig from './qimo.config.json'

const backend = projectConfig.apiBase?.trim() || 'http://localhost:8080'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: { '/api': { target: backend, changeOrigin: true } }
  }
})
