<template>
  <AppLayout>
    <div class="reports-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Expense Reports</h1>
          <p class="page-subtitle">Manage and export collections of approved receipts</p>
        </div>
        <button class="new-report-btn" @click="openCreateModal">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          New Report
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="reports.length === 0 && !loading" class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            stroke="#4A5A70"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        <p>No expense reports yet</p>
        <span>Approve a receipt and add it to a report to get started</span>
      </div>

      <div class="reports-grid" v-else>
        <div
          v-for="r in reports"
          :key="r._id"
          class="report-card"
          @click="$router.push('/expense-reports/' + r._id)"
        >
          <div class="report-card-header">
            <div class="report-name">{{ r.name }}</div>
            <span :class="['status-pill', r.status]">{{ r.status }}</span>
          </div>
          <div class="report-meta">
            <span v-if="r.month">{{ formatMonth(r.month) }}</span>
            <span v-if="r.client">· {{ r.client }}</span>
            <span v-if="r.project">· {{ r.project }}</span>
          </div>
          <div class="report-stats">
            <div class="stat">
              <span class="stat-num">{{ r.receiptCount }}</span>
              <span class="stat-label">receipts</span>
            </div>
          </div>
          <div class="report-footer">
            <span class="report-date">Created {{ formatDateShort(r.createdAt) }}</span>
            <button class="delete-report-btn" @click.stop="openDeleteModal(r)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <CreateExpenseReportModal
      v-model="showCreateModal"
      :loading="creating"
      :error="createError"
      @submit="submitCreate"
    />

    <ConfirmDeleteModal
      v-model="showDeleteModal"
      title="Delete report?"
      :description="deleteModalDescription"
      confirm-label="Delete"
      @confirm="confirmDelete"
    />
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from './AppLayout.vue'
import CreateExpenseReportModal from '@/components/CreateExpenseReportModal.vue'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import api from '@/services/api'
import { formatDateShort, formatMonth } from '@/utils/formatters'
import { useRouter } from 'vue-router'

const router = useRouter()
const reports = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const creating = ref(false)
const createError = ref('')
const reportToDelete = ref(null)
const error = ref('')

const deleteModalDescription = computed(() => {
  const name = reportToDelete.value?.name || ''
  return `This will permanently remove <strong>${name}</strong>. Receipts inside it will not be deleted.`
})

async function loadReports() {
  loading.value = true
  error.value = ''

  try {
    const res = await api.get('expense-reports')
    reports.value = res.data
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Unable to load expense reports.'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  createError.value = ''
  showCreateModal.value = true
}

async function submitCreate(payload) {
  if (!payload.name || !payload.name.trim()) {
    createError.value = 'Name is required.'
    return
  }
  
  if (payload.name.length > 200) {
    createError.value = 'Name cannot exceed 200 characters.'
    return
  }

  creating.value = true
  createError.value = ''
  try {
    const sanitizedPayload = {
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      month: payload.month || '',
      project: payload.project?.trim() || '',
      client: payload.client?.trim() || '',
      receiptId: payload.receiptId || null
    }

    const res = await api.post('expense-reports', sanitizedPayload)
    showCreateModal.value = false
    router.push('/expense-reports/' + res.data._id)
  } catch (err) {
    createError.value = err.response?.data?.message || 'Failed to create.'
  } finally {
    creating.value = false
  }
}

function openDeleteModal(r) {
  reportToDelete.value = r
  showDeleteModal.value = true
}

async function confirmDelete() {
  error.value = ''

  try {
    await api.delete(`expense-reports/${reportToDelete.value._id}`)

    reports.value = reports.value.filter((r) => r._id !== reportToDelete.value._id)

    showDeleteModal.value = false
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Failed to delete report.'
  }
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.reports-page {
  padding: 32px 36px;
  font-family: 'DM Sans', sans-serif;
  color: #e2e8f0;
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #f0f6ff;
  letter-spacing: -0.4px;
}
.page-subtitle {
  font-size: 13px;
  color: #7a8baa;
  margin-top: 2px;
}
.new-report-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.new-report-btn:hover {
  background: #1d4ed8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 80px 20px;
  text-align: center;
}
.empty-state p {
  font-size: 14px;
  font-weight: 500;
  color: #7a8baa;
}
.empty-state span {
  font-size: 13px;
  color: #4a5a70;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.report-card {
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 20px 22px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 12px;

  min-width: 0; 
  overflow: hidden;
}
.report-card:hover {
  border-color: rgba(74, 158, 255, 0.3);
  background: rgba(255, 255, 255, 0.01);
}
.report-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.report-name {
  font-size: 14px;
  font-weight: 600;
  color: #f0f6ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.status-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
  text-transform: capitalize;
  flex-shrink: 0;
}
.status-pill.draft {
  background: rgba(107, 114, 128, 0.15);
  color: #9ca3af;
}
.status-pill.completed {
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
}
.report-meta {
  font-size: 12px;
  color: #4a5a70;
  word-break: break-all; 
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
} 
.report-stats {
  display: flex;
  gap: 20px;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-num {
  font-size: 18px;
  font-weight: 700;
  color: #f0f6ff;
  letter-spacing: -0.3px;
}
.stat-label {
  font-size: 11px;
  color: #7a8baa;
}
.report-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.report-date {
  font-size: 11.5px;
  color: #4a5a70;
}
.delete-report-btn {
  background: transparent;
  border: none;
  color: #4a5a70;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.delete-report-btn:hover {
  color: #f87171;
}

.error-message {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 8px;
}
</style>
