<template>
  <AppLayout>
    <div class="report-detail-page">
      <button class="back-btn" @click="$router.push('/expense-reports')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 12H5M12 5l-7 7 7 7"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Back to reports
      </button>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="report" class="report-layout">
        <div class="report-header-card">
          <div class="report-header-left">
            <div class="report-title-row">
              <h1 class="report-title">{{ report.name }}</h1>
              <span :class="['status-pill', report.status]">{{ report.status }}</span>
            </div>
            <p v-if="report.description" class="report-description">{{ report.description }}</p>
            <div class="report-meta-row">
              <span v-if="report.month">📅 {{ formatMonth(report.month) }}</span>
              <span v-if="report.project">📁 {{ report.project }}</span>
              <span v-if="report.client">👤 {{ report.client }}</span>
              <span>{{ report.receiptCount }} receipts</span>
            </div>
          </div>
          <div class="report-header-actions">
            <button class="action-outline-btn" @click="exportXlsx" :disabled="exporting">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              <span v-if="exporting">Exporting...</span>
              <span v-else>Export Excel</span>
            </button>
            <button
              v-if="report.status === 'draft'"
              class="action-complete-btn"
              @click="markCompleted"
            >
              Mark as Completed
            </button>
          </div>
        </div>

        <div class="table-toolbar">
          <div class="search-wrap">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M20 20l-3-3"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <input
              v-model="search"
              type="text"
              class="search-input"
              placeholder="Search receipts..."
            />
          </div>
          <button
            v-if="report.status === 'draft'"
            class="add-receipt-btn"
            @click="openAddReceiptModal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            Add Receipt
          </button>
        </div>

        <div class="table-card">
          <table class="receipts-table">
            <thead>
              <tr>
                <th>Merchant</th>
                <th>Date</th>
                <th>Total</th>
                <th>Tax</th>
                <th>Currency</th>
                <th>Approved</th>
                <th v-if="report.status === 'draft'">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in filteredReceipts" :key="r._id" class="table-row">
                <td>
                  <div class="merchant-cell">
                    <div class="receipt-thumb">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
                          stroke="#7A8BAA"
                          stroke-width="1.5"
                        />
                      </svg>
                    </div>
                    <div>
                      <div class="merchant-name">
                        {{ r.extractedData?.sellerName || r.name || '—' }}
                      </div>
                      <div class="receipt-name-sub">{{ r.name }}</div>
                    </div>
                  </div>
                </td>
                <td class="td-muted">{{ r.extractedData?.date || '—' }}</td>
                <td class="td-amount">{{ r.extractedData?.totalAmount ?? '—' }}</td>
                <td class="td-muted">{{ r.extractedData?.taxAmount ?? '—' }}</td>
                <td class="td-muted">{{ r.extractedData?.currency || '—' }}</td>
                <td class="td-muted">{{ r.approvedAt ? formatDateShort(r.approvedAt) : '—' }}</td>
                <td v-if="report.status === 'draft'">
                  <button
                    class="remove-btn"
                    @click="removeReceipt(r._id)"
                    title="Remove from report"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredReceipts.length === 0">
                <td :colspan="report.status === 'draft' ? 7 : 6">
                  <div class="empty-table">No receipts in this report yet.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <Transition name="modal">
      <div
        v-if="showAddReceiptModal"
        class="modal-overlay"
        @click.self="showAddReceiptModal = false"
      >
        <div class="modal-box">
          <h3 class="modal-title">Add Approved Receipt</h3>
          <div class="search-wrap" style="margin-bottom: 14px">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5" />
              <path
                d="M20 20l-3-3"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <input
              v-model="addReceiptSearch"
              type="text"
              class="search-input"
              placeholder="Search approved receipts..."
            />
          </div>
          <div class="receipt-pick-list">
            <button
              v-for="r in filteredApproved"
              :key="r._id"
              class="receipt-pick-btn"
              @click="addReceipt(r._id)"
            >
              <div class="receipt-pick-name">
                {{ r.extractedData?.sellerName || r.name || '—' }}
              </div>
              <div class="receipt-pick-meta">
                {{ r.extractedData?.date || '' }} · {{ r.extractedData?.totalAmount ?? '' }}
                {{ r.extractedData?.currency || '' }}
              </div>
            </button>
            <div v-if="filteredApproved.length === 0" class="empty-table">
              No approved receipts available.
            </div>
          </div>
          <p v-if="addError" class="feedback-error">{{ addError }}</p>
          <div class="modal-actions">
            <button class="modal-btn secondary" @click="showAddReceiptModal = false">Close</button>
          </div>
        </div>
      </div>
    </Transition>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from './AppLayout.vue'
import api from '@/services/api'
import { formatDateShort, formatMonth } from '@/utils/formatters'
import { useRoute } from 'vue-router'

const route = useRoute()
const reportId = route.params.id
const report = ref(null)
const search = ref('')
const exporting = ref(false)
const showAddReceiptModal = ref(false)
const approvedReceipts = ref([])
const addReceiptSearch = ref('')
const addError = ref('')
const error = ref('')

async function loadReport() {
  error.value = ''

  try {
    const res = await api.get(`expense-reports/${reportId}`)
    report.value = res.data
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Unable to load the expense report.'
  }
}

const filteredReceipts = computed(() => {
  const q = search.value.toLowerCase()
  if (!q || !report.value) return report.value?.receipts || []
  return (report.value?.receipts || []).filter(
    (r) =>
      (r.extractedData?.sellerName || '').toLowerCase().includes(q) ||
      (r.name || '').toLowerCase().includes(q),
  )
})

const filteredApproved = computed(() => {
  const existing = new Set((report.value?.receiptIds || []).map((id) => id.toString()))
  const q = addReceiptSearch.value.toLowerCase()
  return approvedReceipts.value.filter((r) => {
    if (existing.has(r._id.toString())) return false
    if (!q) return true
    return (
      (r.extractedData?.sellerName || '').toLowerCase().includes(q) ||
      (r.name || '').toLowerCase().includes(q)
    )
  })
})

async function removeReceipt(receiptId) {
  error.value = ''

  try {
    await api.delete(`expense-reports/${reportId}/receipts/${receiptId}`)

    report.value.receipts = report.value.receipts.filter((r) => r._id !== receiptId)

    report.value.receiptIds = report.value.receiptIds.filter(
      (id) => id.toString() !== receiptId.toString(),
    )

    report.value.receiptCount = report.value.receipts.length
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Failed to remove receipt.'
  }
}

async function openAddReceiptModal() {
  addReceiptSearch.value = ''
  addError.value = ''

  try {
    const res = await api.get('expense-reports/approved-receipts')
    approvedReceipts.value = res.data
  } catch (err) {
    approvedReceipts.value = []
    addError.value = err.response?.data?.message ?? 'Unable to load approved receipts.'
  }

  showAddReceiptModal.value = true
}

async function addReceipt(receiptId) {
  addError.value = ''
  try {
    await api.post(`expense-reports/${reportId}/receipts`, { receiptId })
    showAddReceiptModal.value = false
    await loadReport()
  } catch (err) {
    addError.value = err.response?.data?.message || 'Failed to add.'
  }
}

async function exportXlsx() {
  exporting.value = true
  error.value = ''

  try {
    const res = await api.get(`expense-reports/${reportId}/export/xlsx`, { responseType: 'blob' })

    const url = URL.createObjectURL(
      new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    )

    const a = document.createElement('a')
    a.href = url
    a.download = `${report.value.name}.xlsx`
    a.click()

    URL.revokeObjectURL(url)
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Failed to export report.'
  } finally {
    exporting.value = false
  }
}

async function markCompleted() {
  error.value = ''

  try {
    const res = await api.put(`expense-reports/${reportId}`, { status: 'completed' })

    report.value.status = res.data.status
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Failed to update report status.'
  }
}

onMounted(() => {
  loadReport()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.report-detail-page {
  padding: 28px 36px;
  font-family: 'DM Sans', sans-serif;
  color: #e2e8f0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: none;
  color: #7a8baa;
  font-size: 13.5px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  padding: 0;
  margin-bottom: 24px;
  transition: color 0.15s;
}

.back-btn:hover {
  color: #c8d5e8;
}

.error-message {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 8px;
}

.report-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.report-header-card {
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 22px 26px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.report-header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.report-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.report-title {
  font-size: 20px;
  font-weight: 700;
  color: #f0f6ff;
  letter-spacing: -0.3px;
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

.report-description {
  font-size: 13px;
  color: #7a8baa;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.report-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12.5px;
  color: #7a8baa;
  min-width: 0;
  width: 100%;
}

.report-meta-row span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.report-header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.action-outline-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #c8d5e8;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.action-outline-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
}

.action-outline-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-complete-btn {
  padding: 9px 16px;
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.25);
  color: #34d399;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.action-complete-btn:hover {
  background: rgba(52, 211, 153, 0.2);
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.search-wrap {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #4a5a70;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 9px 14px 9px 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13.5px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s;
}

.search-input::placeholder {
  color: #4a5a70;
}

.search-input:focus {
  border-color: #4a9eff;
}

.add-receipt-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.add-receipt-btn:hover {
  background: #1d4ed8;
}

.table-card {
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  overflow: hidden;
}

.receipts-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.receipts-table th {
  font-size: 11.5px;
  font-weight: 500;
  color: #7a8baa;
  text-align: left;
  padding: 13px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.02);
  white-space: nowrap;
}

.receipts-table th:nth-child(1),
.receipts-table td:nth-child(1) {
  width: 38%;
}

.receipts-table th:not(:nth-child(1)) {
  width: auto;
}

.receipts-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 13px;
  vertical-align: middle;
}

.table-row:last-child td {
  border-bottom: none;
}

.table-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.merchant-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.merchant-cell > div:last-child {
  min-width: 0;
  flex: 1;
}

.receipt-thumb {
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.merchant-name {
  font-size: 13px;
  font-weight: 500;
  color: #d1dcf0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.receipt-name-sub {
  font-size: 11px;
  color: #4a5a70;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.td-muted {
  color: #7a8baa;
}

.td-amount {
  color: #d1dcf0;
  font-weight: 600;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #4a5a70;
  cursor: pointer;
  padding: 5px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.remove-btn:hover {
  color: #f87171;
}

.empty-table {
  text-align: center;
  padding: 40px;
  font-size: 13.5px;
  color: #4a5a70;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-box {
  width: 480px;
  max-width: calc(100vw - 32px);
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #f0f6ff;
  margin-bottom: 16px;
}

.receipt-pick-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.receipt-pick-btn {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
  min-width: 0;
  overflow: hidden;
}

.receipt-pick-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.receipt-pick-name {
  font-size: 13.5px;
  font-weight: 500;
  color: #d1dcf0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.receipt-pick-meta {
  font-size: 12px;
  color: #7a8baa;
}

.feedback-error {
  font-size: 12.5px;
  color: #f87171;
  margin-bottom: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-btn {
  border: none;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 8px;
  transition: all 0.15s;
}

.modal-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #c8d5e8;
}

.modal-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.08);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>