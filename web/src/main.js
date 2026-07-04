import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'

import { useAuthStore } from '@/stores/auth'
import router from '@/router'

import './styles/style.css'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(router)

const authStore = useAuthStore(pinia)

const storedToken = localStorage.getItem('auth_token')

if (storedToken) {
  authStore.setAccessToken(storedToken)
}

app.mount('#app')