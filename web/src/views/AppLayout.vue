<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#4A9EFF" stroke-width="2"/>
            <path d="M7 8h10M7 12h10M7 16h6" stroke="#4A9EFF" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="logo-text"><strong>Receipt</strong> AI</span>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" opacity="0.7"/>
            <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" opacity="0.7"/>
            <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.7"/>
            <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.7"/>
          </svg>
          <span>Dashboard</span>
        </router-link>

        <router-link to="/receipts" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>Receipts</span>
        </router-link>

        <router-link to="/upload" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 16l4-4 4 4 4-8 4 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Upload</span>
        </router-link>

        <router-link to="/expense-reports" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 17H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2h-2M9 17l3 3 3-3M12 17V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Reports</span>
        </router-link>

        <router-link to="/settings" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>Settings</span>
        </router-link>

        <router-link to="/api-keys" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>API Keys</span>
        </router-link>

      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from "../stores/auth"
import { useRouter } from "vue-router"
import api from "../services/api"

const authStore = useAuthStore()
const Router = useRouter()

async function handleLogout() {
  try {
    await api.post("auth/logout")
    authStore.logout()
    Router.push("/login")
  } catch {
    authStore.logout()
    Router.push("/login")
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.app-layout {
  display: flex;
  min-height: 100vh;
  background: #0B1120;
  font-family: 'DM Sans', sans-serif;
  color: #E2E8F0;
}

.sidebar {
  width: 220px;
  min-height: 100vh;
  background: #0D1628;
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  flex-shrink: 0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 28px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 20px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: rgba(74, 158, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 15px;
  color: #E2E8F0;
  letter-spacing: -0.2px;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  color: #7A8BAA;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.nav-item:hover {
  color: #C8D5E8;
  background: rgba(255,255,255,0.04);
}

.nav-item.active {
  background: #1E3A6E;
  color: #4A9EFF;
}

.sidebar-footer {
  padding: 16px 10px 0;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  color: #7A8BAA;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  width: 100%;
  transition: all 0.15s ease;
}

.logout-btn:hover {
  color: #C8D5E8;
  background: rgba(255,255,255,0.04);
}

.main-content {
  flex: 1;
  overflow-y: auto;
}
</style>
