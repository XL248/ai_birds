import { defineStore } from 'pinia'
import { api } from '../api.js'

export const useSessionStore = defineStore('session', {
  state: () => ({ user: null, ready: false, authOpen: false, authMode: 'login', busy: false }),
  actions: {
    openAuth(mode = 'login') {
      this.authMode = mode
      this.authOpen = true
    },
    async refresh() {
      try {
        const result = await api.get('/api/auth/me')
        this.user = result.loggedIn ? { username: result.username } : null
      } catch {
        this.user = null
      } finally {
        this.ready = true
      }
    },
    async login(username, password) {
      this.busy = true
      try {
        const result = await api.post('/api/auth/login', { username, password })
        await this.refresh()
        this.authOpen = false
        return result
      } finally {
        this.busy = false
      }
    },
    async register(username, password) {
      this.busy = true
      try {
        return await api.post('/api/auth/register', { username, password })
      } finally {
        this.busy = false
      }
    },
    async logout() {
      await api.post('/api/auth/logout', {})
      this.user = null
    }
  }
})
