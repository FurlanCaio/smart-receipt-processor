<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#4A9EFF" stroke-width="2"/>
            <path d="M7 8h10M7 12h10M7 16h6" stroke="#4A9EFF" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="logo-text"><strong>Receipt</strong> AI</span>
      </div>

      <h1 class="auth-title">Create your account</h1>
      <p class="auth-subtitle">Start processing receipts with AI</p>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label>Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="input-with-icon">
            <input
              v-model="form.password"
              required
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="new-password"
            />
            <button type="button" class="icon-btn" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <span v-else>Create account</span>
        </button>
      </form>

      <p class="auth-footer-text">
        Already have an account?
        <router-link to="/login" class="link">Sign in</router-link>
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

const router = useRouter()
const showPassword = ref(false)
const loading = ref(false)
const err = ref('')
const form = reactive({
  email: '',
  password: ''
})

async function handleRegister() {
  loading.value = true
  err.value = ''
  
  try {
    if (form.password.length < 8) {
      err.value = "The password must be at least 8 characters long."
      loading.value = false
      return
    }

    await api.post('auth/register', {
      email: form.email,
      password: form.password
    })
    
    router.push('/login')
  } catch (error) {
    err.value = error.response?.data?.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.auth-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #071223 0%, #0D1E38 50%, #071223 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Sans', sans-serif;
  color: #E2E8F0;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  color: #E2E8F0;
}

.auth-title {
  font-size: 26px;
  font-weight: 700;
  color: #F0F6FF;
  margin-bottom: 6px;
  text-align: center;
  letter-spacing: -0.5px;
}

.auth-subtitle {
  font-size: 14px;
  color: #7A8BAA;
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
  color: #C8D5E8;
}

input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #E2E8F0;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s ease;
}

input::placeholder { color: #4A5A70; }

input:focus {
  border-color: #4A9EFF;
  background: rgba(74, 158, 255, 0.06);
}

.input-with-icon {
  position: relative;
}

.input-with-icon input { padding-right: 40px; }

.icon-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #7A8BAA;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.icon-btn:hover { color: #C8D5E8; }

.btn-primary {
  width: 100%;
  padding: 11px;
  background: #2563EB;
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

.btn-primary:hover:not(:disabled) { background: #1D4ED8; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.auth-footer-text {
  font-size: 13.5px;
  color: #7A8BAA;
  margin-bottom: 24px;
}

.link {
  color: #4A9EFF;
  text-decoration: none;
  font-weight: 500;
}

.link:hover { text-decoration: underline; }

.message-error {
  font-size: 13px;
  color: #EF4444;
  text-align: center;
  margin-bottom: 24px;
}

.copyright {
  font-size: 12px;
  color: #3A4A60;
}
</style>