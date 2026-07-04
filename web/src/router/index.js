import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import DashboardView from '@/views/DashboardView.vue'
import UploadView from '@/views/UploadView.vue'
import ApiSettingsView from '@/views/ApiSettingsView.vue'
import ReceiptDetailView from '@/views/ReceiptDetailView.vue'
import ReceiptsView from '@/views/ReceiptsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import ExpenseReportsView from '@/views/ExpenseReportsView.vue'
import ExpenseReportDetailView from '@/views/ExpenseReportDetailView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginView, meta: { guessOnly: true } },
  { path: '/register',  name: 'Register', component: RegisterView, meta: { guessOnly: true } },
  { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/upload', name: 'Upload', component: UploadView, meta: { requiresAuth: true } },
  { path: '/api-keys', name: 'ApiSettings', component: ApiSettingsView, meta: { requiresAuth: true } },
  { path: '/receipts/:id', name: 'ReceiptDetail', component: ReceiptDetailView, meta: { requiresAuth: true } },
  { path: '/receipts', name: 'Receipts', component: ReceiptsView, meta: { requiresAuth: true } },
  { path: '/settings', name: 'Settings', component: SettingsView, meta: { requiresAuth: true } },
  { path: '/expense-reports', name: 'ExpenseReports', component: ExpenseReportsView, meta: { requiresAuth: true } },
  { path: '/expense-reports/:id', name: 'ExpenseReportDetail', component: ExpenseReportDetailView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  const isAuth = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuth) {
    return { name: 'Login' }
  }

  if (to.meta.guessOnly && isAuth) {
    return { name: 'Dashboard' }
  }
})

export default router
