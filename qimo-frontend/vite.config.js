import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import projectConfig from './qimo.config.json'

const root = dirname(fileURLToPath(import.meta.url))
const legacyDirectories = ['app', 'config', 'css', 'html', 'image', 'js']

function preserveLegacyPages() {
  return {
    name: 'preserve-legacy-pages',
    apply: 'build',
    closeBundle() {
      const output = resolve(root, 'dist')
      mkdirSync(output, { recursive: true })
      for (const directory of legacyDirectories) {
        const source = resolve(root, directory)
        if (existsSync(source)) cpSync(source, resolve(output, directory), { recursive: true })
      }
      cpSync(resolve(root, 'main.html'), resolve(output, 'main.html'))
    }
  }
}

const backend = projectConfig.apiBase?.trim() || 'http://localhost:8080'

export default defineConfig({
  plugins: [vue(), preserveLegacyPages()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: { '/api': { target: backend, changeOrigin: true } }
  }
})
