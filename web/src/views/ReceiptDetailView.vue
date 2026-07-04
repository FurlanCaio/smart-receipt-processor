<template>
  <AppLayout>
    <div class="detail-page">
      <button class="back-btn" @click="$router.back()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 12H5M12 5l-7 7 7 7"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Back to receipts
      </button>

      <div class="detail-layout">
        <div class="receipt-preview" :style="{ width: imgWidth + 'px' }">
          <div class="zoom-controls">
            <button class="zoom-btn" @click="shrink" :disabled="imgWidth <= WIDTH_MIN">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
            <span class="zoom-label">{{ imgWidth }}px</span>
            <button class="zoom-btn" @click="expand" :disabled="imgWidth >= WIDTH_MAX">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
          <img :src="extracted.imageUrl" class="receipt-image" />
        </div>

        <div class="data-panel">
          <div class="panel-header">
            <h2 class="panel-title">Extracted Data</h2>
            <StatusBadge :status="extracted.status" />
          </div>

          <div v-if="extracted.status === 'approved'" class="approved-notice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#34D399"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            Approved on {{ formatDateShort(extracted.approvedAt) }} — data is locked.
            <button class="reopen-link" @click="showReopenConfirm = true">
              Reopen for editing
            </button>
          </div>

          <div class="data-fields">
            <div class="field-group">
              <label class="field-label">Receipt Name</label>
              <input
                type="text"
                class="field-input"
                v-model="extracted.name"
                :disabled="extracted.status === 'approved'"
                maxlength="100"
              />
            </div>
            <div class="field-group">
              <label class="field-label">Seller Name</label>
              <input
                type="text"
                class="field-input"
                v-model="extracted.extractedData.sellerName"
                :disabled="extracted.status === 'approved'"
                maxlength="100"
              />
            </div>
            <div class="field-group">
              <label class="field-label">Date</label>
              <div class="input-with-icon">
                <input
                  type="date"
                  class="field-input"
                  v-model="extracted.extractedData.date"
                  :disabled="extracted.status === 'approved'"
                />
              </div>
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">
                  Total
                  <span v-if="extracted.extractedData.items.length > 0" class="computed-hint"
                    >(auto from items)</span
                  >
                </label>
                <input
                  type="number"
                  class="field-input"
                  :value="computedTotal"
                  @input="
                    extracted.extractedData.items.length === 0 &&
                    (extracted.extractedData.totalAmount = Math.min(
                      99999999,
                      parseFloat($event.target.value) || 0,
                    ))
                  "
                  :disabled="
                    extracted.status === 'approved' || extracted.extractedData.items.length > 0
                  "
                  min="0"
                  max="99999999"
                  step="0.01"
                />
              </div>
              <div class="field-group">
                <label class="field-label">Currency</label>
                <div class="select-wrap">
                  <select
                    class="field-input"
                    v-model="extracted.extractedData.currency"
                    :disabled="extracted.status === 'approved'"
                  >
                    <option class="currency-options">USD</option>
                    <option class="currency-options">EUR</option>
                    <option class="currency-options">BRL</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Tax</label>
              <input
                type="number"
                class="field-input"
                v-model.number="extracted.extractedData.taxAmount"
                :disabled="extracted.status === 'approved'"
                min="0"
                max="99999999"
                step="0.01"
                @input="
                  extracted.extractedData.taxAmount = Math.min(
                    99999999,
                    extracted.extractedData.taxAmount || 0,
                  )
                "
              />
            </div>
            <div class="field-group">
              <label class="field-label">Items</label>
              <div class="items-list">
                <div v-for="(item, i) in extracted.extractedData.items" :key="i" class="item-row">
                  <input
                    type="text"
                    class="field-input item-col-desc"
                    v-model="item.description"
                    placeholder="Item name"
                    :disabled="extracted.status === 'approved'"
                    maxlength="150"
                  />
                  <input
                    type="number"
                    class="field-input item-col-qty"
                    v-model.number="item.quantity"
                    placeholder="1"
                    :disabled="extracted.status === 'approved'"
                    min="0"
                    max="99999"
                    step="0.001"
                    @input="item.quantity = Math.min(99999, item.quantity || 0)"
                  />
                  <input
                    type="number"
                    class="field-input item-col-price"
                    v-model.number="item.unitPrice"
                    placeholder="0.00"
                    :disabled="extracted.status === 'approved'"
                    min="0"
                    max="99999999"
                    step="0.01"
                    @input="item.unitPrice = Math.min(99999999, item.unitPrice || 0)"
                  />
                  <span class="item-col-subtotal item-subtotal-val">
                    {{ ((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2) }}
                  </span>
                  <button
                    v-if="extracted.status !== 'approved'"
                    class="remove-item-btn"
                    @click="removeItem(i)"
                  >
                    ✕
                  </button>
                  <span v-else style="width: 24px; flex-shrink: 0"></span>
                </div>
                <div v-if="extracted.extractedData.items.length === 0" class="items-empty">
                  No items added
                </div>
              </div>
              <button v-if="extracted.status !== 'approved'" class="add-item-btn" @click="addItem">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                Add item
              </button>
            </div>
          </div>

          <p v-if="saveError" class="feedback-error">{{ saveError }}</p>

          <div class="panel-actions" v-if="extracted.status === 'needs_approval'">
            <button class="reject-btn" :disabled="saving" @click="rejectReceipt(extracted._id)">
              Reject
            </button>
            <button class="approve-btn" :disabled="saving" @click="handleApprove">
              <span v-if="saving" class="spinner" />
              <span v-else>Approve</span>
            </button>
          </div>

          <div class="panel-actions" v-if="extracted.status === 'approved'">
            <button class="add-report-btn" @click="openAddToReportModal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              Add to Expense Report
            </button>
          </div>
        </div>
      </div>
    </div>

    <Transition name="modal">
      <div v-if="showApprovalModal" class="modal-overlay" @click.self="showApprovalModal = false">
        <div class="modal-box">
          <div class="modal-icon green-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#34D399"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <h3 class="modal-title">Receipt Approved!</h3>
          <p class="modal-desc">What would you like to do with this receipt?</p>
          <div class="modal-choices">
            <button class="choice-btn" @click="openCreateReport">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              Create new Expense Report
            </button>
            <button class="choice-btn" @click="openAddExistingReport">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              Add to existing report
            </button>
            <button class="choice-skip" @click="showApprovalModal = false">Skip for now</button>
          </div>
        </div>
      </div>
    </Transition>

    <CreateExpenseReportModal
      v-model="showCreateReportModal"
      :loading="creatingReport"
      :error="reportError"
      @submit="submitCreateReport"
    />

    <Transition name="modal">
      <div
        v-if="showAddExistingModal"
        class="modal-overlay"
        @click.self="showAddExistingModal = false"
      >
        <div class="modal-box">
          <h3 class="modal-title">Add to Existing Report</h3>
          <p v-if="existingReports.length === 0" class="modal-desc">
            No draft reports found. Create one first.
          </p>
          <div v-else class="report-list">
            <button
              v-for="r in existingReports"
              :key="r._id"
              class="report-pick-btn"
              @click="addToExistingReport(r._id)"
            >
              <div class="report-pick-name">{{ r.name }}</div>
              <div class="report-pick-meta">{{ r.receiptCount }} receipts · {{ r.status }}</div>
            </button>
          </div>
          <p v-if="reportError" class="feedback-error">{{ reportError }}</p>
          <div class="modal-actions">
            <button class="modal-btn secondary" @click="showAddExistingModal = false">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showReopenConfirm" class="modal-overlay" @click.self="showReopenConfirm = false">
        <div class="modal-box">
          <h3 class="modal-title">Reopen Receipt?</h3>
          <p class="modal-desc">
            This will set the receipt back to "Needs Approval" and allow editing. Any reports that
            include this receipt will still reference it.
          </p>
          <div class="modal-actions">
            <button class="modal-btn secondary" @click="showReopenConfirm = false">Cancel</button>
            <button class="modal-btn danger" @click="reopenReceipt">Reopen</button>
          </div>
        </div>
      </div>
    </Transition>
  </AppLayout>
</template>

<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import AppLayout from './AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import CreateExpenseReportModal from '@/components/CreateExpenseReportModal.vue'
import api from '@/services/api'
import { formatDateShort } from '@/utils/formatters'
import { useRoute } from 'vue-router'
import router from '@/router/index.js'

const route = useRoute()
const id = route.params.id

const imgWidth = ref(280)
const WIDTH_STEP = 80
const WIDTH_MIN = 180
const WIDTH_MAX = 700
const saving = ref(false)
const saveError = ref('')

const showApprovalModal = ref(false)
const showCreateReportModal = ref(false)
const showAddExistingModal = ref(false)
const showReopenConfirm = ref(false)
const existingReports = ref([])
const creatingReport = ref(false)
const reportError = ref('')

function expand() {
  imgWidth.value = Math.min(WIDTH_MAX, imgWidth.value + WIDTH_STEP)
}
function shrink() {
  imgWidth.value = Math.max(WIDTH_MIN, imgWidth.value - WIDTH_STEP)
}

const computedTotal = computed(() => {
  const items = extracted.extractedData.items

  if (!items.length) {
    return extracted.extractedData.totalAmount
  }

  const total = items.reduce((acc, item) => {
    const subtotal = Number(((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2))

    return acc + subtotal
  }, 0)

  return Number(total.toFixed(2))
})

const extracted = reactive({
  name: '',
  status: '',
  approvedAt: null,
  extractedData: {
    sellerName: '',
    date: '',
    totalAmount: '',
    currency: 'USD',
    taxAmount: '',
    items: [],
  },
})

async function getReceiptData() {
  saveError.value = ''

  try {
    const response = await api.get(`receipts/${id}`)
    Object.assign(extracted, response.data)
  } catch (err) {
    saveError.value = err.response?.data?.message ?? 'Unable to load receipt.'
  }
}

async function handleApprove() {
  saving.value = true
  saveError.value = ''
  try {
    await api.put(`receipts/${id}/data`, {
      name: extracted.name,
      extractedData: {
        ...extracted.extractedData,
        totalAmount: computedTotal.value,
      },
    })

    await api.put(`receipts/${id}/approve`, {})
    extracted.status = 'approved'
    extracted.approvedAt = new Date().toISOString()
    showApprovalModal.value = true
  } catch (err) {
    saveError.value = err.response?.data?.message ?? 'Failed to approve receipt.'
  } finally {
    saving.value = false
  }
}

async function rejectReceipt(receiptId) {
  try {
    await api.put(`receipts/${receiptId}/reject`, {})
    router.push('/receipts')
  } catch (err) {
    saveError.value = err.response?.data?.message ?? 'Failed to reject receipt.'
  }
}

async function reopenReceipt() {
  saveError.value = ''

  try {
    await api.put(`receipts/${id}/reopen`, {})

    extracted.status = 'needs_approval'
    extracted.approvedAt = null
    showReopenConfirm.value = false
  } catch (err) {
    saveError.value = err.response?.data?.message ?? 'Failed to reopen receipt.'
  }
}
function openAddToReportModal() {
  showApprovalModal.value = true
}

async function openCreateReport() {
  showApprovalModal.value = false
  reportError.value = ''
  showCreateReportModal.value = true
}

async function openAddExistingReport() {
  showApprovalModal.value = false
  reportError.value = ''

  try {
    const res = await api.get('expense-reports')
    existingReports.value = res.data.filter((r) => r.status === 'draft')
  } catch (err) {
    existingReports.value = []
    reportError.value = err.response?.data?.message ?? 'Unable to load expense reports.'
  }

  showAddExistingModal.value = true
}

async function submitCreateReport(payload) {
  if (!payload.name.trim()) {
    reportError.value = 'Report name is required.'
    return
  }
  creatingReport.value = true
  reportError.value = ''
  try {
    await api.post('expense-reports', {
      ...payload,
      receiptId: id,
    })
    showCreateReportModal.value = false
    router.push('/expense-reports')
  } catch (err) {
    reportError.value = err.response?.data?.message || 'Failed to create report.'
  } finally {
    creatingReport.value = false
  }
}

async function addToExistingReport(reportId) {
  reportError.value = ''
  try {
    await api.post(`expense-reports/${reportId}/receipts`, { receiptId: id })
    showAddExistingModal.value = false
    router.push(`/expense-reports/${reportId}`)
  } catch (err) {
    reportError.value = err.response?.data?.message || 'Failed to add receipt.'
  }
}

function addItem() {
  extracted.extractedData.items.push({ description: '', unitPrice: 0, quantity: 1 })
}

function removeItem(i) {
  extracted.extractedData.items.splice(i, 1)
}

onMounted(() => {
  getReceiptData()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.detail-page {
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
.detail-layout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 28px;
  align-items: start;
}
.receipt-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: width 0.2s ease;
  position: sticky;
  top: 24px;
}
.receipt-image {
  width: 100%;
  border-radius: 8px;
  object-fit: contain;
}
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.zoom-btn {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #c8d5e8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.zoom-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}
.zoom-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.zoom-label {
  font-size: 12px;
  color: #7a8baa;
}

.data-panel {
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 24px 28px;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #f0f6ff;
}

.approved-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(52, 211, 153, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12.5px;
  color: #34d399;
  margin-bottom: 16px;
}
.reopen-link {
  background: transparent;
  border: none;
  color: #4a9eff;
  cursor: pointer;
  font-size: 12.5px;
  font-family: 'DM Sans', sans-serif;
  text-decoration: underline;
  padding: 0;
  margin-left: auto;
}

.data-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field-label {
  font-size: 12.5px;
  font-weight: 500;
  color: #7a8baa;
}
.field-input {
  width: 100%;
  padding: 9px 13px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13.5px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s;
  appearance: none;
}
.field-input:focus {
  border-color: #4a9eff;
}
.field-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.input-with-icon {
  position: relative;
}
.input-with-icon .field-input {
  padding-right: 36px;
}
.field-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a8baa;
  pointer-events: none;
}
.select-wrap {
  position: relative;
}
.select-chevron {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a8baa;
  pointer-events: none;
}
.currency-options {
  background: #0d1628;
  color: #e2e8f0;
  font-family: 'DM Sans', sans-serif;
}

.items-list {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  overflow: hidden;
}
.item-header {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07) !important;
}
.item-col-label {
  font-size: 11px;
  font-weight: 500;
  color: #4a5a70;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0;
}
.item-row {
  display: flex;
  align-items: center;
  padding: 9px 14px;
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  gap: 8px;
}
.item-row:last-child {
  border-bottom: none;
}
.item-col-desc {
  flex: 1;
  min-width: 0;
}
.item-col-qty {
  width: 64px;
  flex-shrink: 0;
}
.item-col-price {
  width: 90px;
  flex-shrink: 0;
}
.item-col-subtotal {
  width: 90px;
  flex-shrink: 0;
  text-align: right;
}
.remove-item-btn {
  background: transparent;
  border: none;
  color: #f87171;
  cursor: pointer;
  font-size: 13px;
  padding: 0 4px;
  flex-shrink: 0;
}
.add-item-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #4a9eff;
  font-size: 12.5px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  padding: 6px 0 0;
}
.add-item-btn:hover {
  opacity: 0.8;
}

.feedback-error {
  font-size: 12.5px;
  color: #f87171;
  margin-bottom: 12px;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  flex-wrap: wrap;
}
.reject-btn {
  padding: 9px 22px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #c8d5e8;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.reject-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
}
.approve-btn {
  padding: 9px 22px;
  background: #22c55e;
  border: none;
  color: #fff;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 7px;
}
.approve-btn:hover:not(:disabled) {
  background: #16a34a;
}
.approve-btn:disabled,
.reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.add-report-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: rgba(37, 99, 235, 0.15);
  border: 1px solid rgba(37, 99, 235, 0.3);
  color: #4a9eff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.add-report-btn:hover {
  background: rgba(37, 99, 235, 0.25);
}
.computed-hint {
  font-size: 11px;
  color: #4a9eff;
  font-weight: 400;
  margin-left: 4px;
}
.items-empty {
  padding: 12px 14px;
  font-size: 12.5px;
  color: #4a5a70;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
  width: 420px;
  max-width: calc(100vw - 32px);
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}
.green-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
  margin-bottom: 18px;
}
.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #f0f6ff;
  margin-bottom: 8px;
}
.modal-desc {
  font-size: 13.5px;
  color: #7a8baa;
  margin-bottom: 20px;
  line-height: 1.6;
}
.modal-choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.choice-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 10px;
  color: #d1dcf0;
  font-size: 13.5px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.choice-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}
.choice-skip {
  background: transparent;
  border: none;
  color: #7a8baa;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  padding: 8px 0;
  transition: color 0.15s;
}
.choice-skip:hover {
  color: #c8d5e8;
}
.report-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  max-height: 260px;
  overflow-y: auto;
}
.report-pick-btn {
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
}
.report-pick-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}
.report-pick-name {
  font-size: 13.5px;
  font-weight: 500;
  color: #d1dcf0;
}
.report-pick-meta {
  font-size: 12px;
  color: #7a8baa;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
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
  display: flex;
  align-items: center;
  gap: 7px;
}
.modal-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #c8d5e8;
}
.modal-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.08);
}
.modal-btn.danger {
  background: #dc2626;
  color: #fff;
}
.modal-btn.danger:hover {
  background: #b91c1c;
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
