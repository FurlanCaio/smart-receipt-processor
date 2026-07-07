<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#4A9EFF" stroke-width="2" />
            <path
              d="M7 8h10M7 12h10M7 16h6"
              stroke="#4A9EFF"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <span class="logo-text"><strong>Receipt</strong> AI</span>
      </div>

      <h1 class="auth-title">Welcome back</h1>
      <p class="auth-subtitle">Sign in to your account to continue</p>

      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="input-with-icon">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <button type="button" class="icon-btn" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <span v-else>Sign in</span>
        </button>
      </form>

      <p class="auth-footer-text">
        Don't have an account?
        <router-link to="/register" class="link">Sign up</router-link>
      </p>

      <p class="message-error" v-if="err">
        {{ err }}
      </p>

      <p class="copyright">© 2026 Receipt AI. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const showPassword = ref(false)
const loading = ref(false)
const authStore = useAuthStore()
const err = ref('')

const form = reactive({
  email: '',
  password: '',
})

async function handleLogin() {
  loading.value = true
  err.value = ''

  try {
    authStore.logout()

    const { data } = await api.post('auth/login', {
      email: form.email,
      password: form.password,
    })

    authStore.setAccessToken(data.data.accessToken)

    await router.push('/dashboard')
  } catch (error) {
    const errorCode = error.response?.data?.code
    const errorMessage = error.response?.data?.message

    if (!error.response) {
      err.value = 'Connection error. Please check your internet connection.'
      return
    }

    switch (errorCode) {
      case 'ACCOUNT_DELETED':
        err.value =
          'This account has been deleted. Please contact support if you believe this is a mistake.'
        break

      case 'INVALID_PASSWORD':
        err.value = 'Invalid email or password.'
        break

      case 'USER_NOT_FOUND':
        err.value = 'Invalid email or password.'
        break

      case 'MISSING_CREDENTIALS':
        err.value = 'Please enter both your email and password.'
        break

      case 'INVALID_EMAIL':
        err.value = 'Please enter a valid email address.'
        break

      case 'PASSWORD_TOO_SHORT':
        err.value = 'Password must be at least 8 characters long.'
        break

      case 'EMAIL_ALREADY_EXISTS':
        err.value = 'This email is already registered.'
        break

      case 'MISSING_SECRETS':
        err.value = 'A server configuration error occurred.'
        break

      default:
        if (errorMessage) {
          err.value = errorMessage
        } else {
          err.value = 'Unable to sign in. Please try again.'
        }
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.auth-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #071223 0%, #0d1e38 50%, #071223 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Sans', sans-serif;
  color: #e2e8f0;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.auth-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: rgba(74, 158, 255, 0.12);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 17px;
  color: #e2e8f0;
}

.auth-title {
  font-size: 26px;
  font-weight: 700;
  color: #f0f6ff;
  margin-bottom: 6px;
  text-align: center;
  letter-spacing: -0.5px;
}

.auth-subtitle {
  font-size: 14px;
  color: #7a8baa;
  margin-bottom: 32px;
  text-align: center;
}

.auth-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  font-weight: 500;
  color: #c8d5e8;
}

input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s ease;
}

input::placeholder {
  color: #4a5a70;
}

input:focus {
  border-color: #4a9eff;
  background: rgba(74, 158, 255, 0.06);
}

.input-with-icon {
  position: relative;
}

.input-with-icon input {
  padding-right: 40px;
}

.icon-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #7a8baa;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.icon-btn:hover {
  color: #c8d5e8;
}

.btn-primary {
  width: 100%;
  padding: 11px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-footer-text {
  font-size: 13.5px;
  color: #7a8baa;
  margin-bottom: 40px;
}

.link {
  color: #4a9eff;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.copyright {
  font-size: 12px;
  color: #3a4a60;
}
</style>
