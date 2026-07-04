import { defineStore } from 'pinia'

const STORAGE_KEY = 'auth_token'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem(STORAGE_KEY) || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },

  actions: {
    setAccessToken(token) {
      this.accessToken = token

      if (token) {
        localStorage.setItem(STORAGE_KEY, token)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    },

    logout() {
      this.setAccessToken(null)
      localStorage.removeItem('accessToken')
    },
  },
})