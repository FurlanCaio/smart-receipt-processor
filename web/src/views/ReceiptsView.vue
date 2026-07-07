<template>
  <AppLayout>
    <div class="receipts-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Receipts</h1>
          <p class="page-subtitle">Manage and review all your processed receipts</p>
        </div>
        <router-link to="/upload" class="upload-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Upload Receipt
        </router-link>
      </div>

      <div class="filters-bar">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5" />
            <path d="M20 20l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <input
            v-model="search"
            type="text"
            class="search-input"
            placeholder="Search receipts..."
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="date-range">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <input type="date" v-model="startDate" />
          <span>até</span>
          <input type="date" v-model="endDate" />
        </div>

        <div class="action-filters-group">
          <button class="search-btn" @click="handleSearch">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
              <path d="M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            Search
          </button>
          
          <button class="clear-btn" @click="clearFilters">
            Clear Filters
          </button>
        </div>

        <div class="filter-group-wrapper">
          <div class="filter-group">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              :class="['filter-tab', { active: activeStatus === tab.value }]"
              @click="activeStatus = tab.value"
            >
              {{ tab.label }}
              <span class="tab-count">{{ tab.count }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="table-card">
        <table class="receipts-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  class="checkbox"
                  v-model="selectAll"
                  @change="toggleSelectAll"
                />
              </th>
              <th>Receipt</th>
              <th>Status</th>
              <th>Total</th>
              <th @click="changeSortOrder()" class="sortable">
                Date
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 10l4-4 4 4M8 14l4 4 4-4"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="receipt in receiptsList"
              :key="receipt._id"
              class="table-row"
              :class="{ selected: selectedIds.includes(receipt._id) }"
            >
              <td>
                <input
                  type="checkbox"
                  class="checkbox"
                  :value="receipt._id"
                  v-model="selectedIds"
                />
              </td>
              <td>
                <div class="receipt-info">
                  <div class="receipt-thumb">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                        stroke="#7A8BAA"
                        stroke-width="1.5"
                      />
                      <rect
                        x="9"
                        y="3"
                        width="6"
                        height="4"
                        rx="1"
                        stroke="#7A8BAA"
                        stroke-width="1.5"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="receipt-merchant">
                      {{ receipt.name || receipt.extractedData?.sellerName || 'Recibo sem nome' }}
                    </div>
                    <div class="receipt-file">{{ formatS3Key(receipt.s3Key) }}</div>
                  </div>
                </div>
              </td>
              <td>
                <StatusBadge :status="receipt.status" />
              </td>
              <td class="amount">{{ receipt.extractedData?.totalAmount || 0 }}</td>
              <td>
                <div class="date-cell">
                  {{ formatDate(receipt.createdAt) || 'Data unavailable.' }}
                </div>
                <div class="time-cell">
                  {{ formatTime(receipt.createdAt) || 'Time unavailable.' }}
                </div>
              </td>
              <td>
                <div class="actions-cell">
                  <button
                    class="action-btn"
                    title="View"
                    @click="$router.push('/receipts/' + receipt._id)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="currentColor"
                        stroke-width="1.5"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" />
                    </svg>
                  </button>
                  <button class="action-btn" title="Download" @click="downloadReceipt(receipt._id)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    class="action-btn danger"
                    title="Delete"
                    @click="openDeleteModal(receipt)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="receiptsList.length === 0">
              <td colspan="6">
                <div class="empty-state">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                      stroke="#4A5A70"
                      stroke-width="1.5"
                    />
                    <rect
                      x="9"
                      y="3"
                      width="6"
                      height="4"
                      rx="1"
                      stroke="#4A5A70"
                      stroke-width="1.5"
                    />
                  </svg>
                  <p>No receipts found</p>
                  <span>Try adjusting your search or filters</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <Transition name="slide-up">
          <div v-if="selectedIds.length > 0" class="bulk-bar">
            <span class="bulk-count">{{ selectedIds.length }} selected</span>
            <div class="bulk-actions">
              <button class="bulk-btn danger" :disabled="bulkDeleting" @click="openBulkDeleteModal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span v-if="bulkDeleting">Deleting...</span>
                <span v-else>Delete ({{ selectedIds.length }})</span>
              </button>
              <button class="bulk-cancel" @click="cancelSelection">Cancel</button>
            </div>
          </div>
        </Transition>

        <div class="pagination">
          <span class="pagination-info">
            Showing {{ receiptsList.length }} of {{ totalItems }} receipts
          </span>
          <div class="pagination-controls">
            <button
              class="page-btn"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
            <button
              v-for="p in totalPages"
              :key="p"
              :class="['page-num', { active: currentPage === p }]"
              @click="goToPage(p)"
            >
              {{ p }}
            </button>
            <button 
              class="page-btn" 
              :disabled="currentPage === totalPages" 
              @click="goToPage(currentPage + 1)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
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
    <ConfirmDeleteModal
      v-model="showDeleteModal"
      title="Delete receipt?"
      :description="deleteModalDescription"
      confirm-label="Delete Receipt"
      @confirm="confirmDelete"
    />

    <ConfirmDeleteModal
      v-model="showBulkDeleteModal"
      title="Delete selected receipts?"
      :description="bulkDeleteModalDescription"
      confirm-label="Delete all"
      :loading="bulkDeleting"
      @confirm="confirmBulkDelete"
    />
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppLayout from './AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import api from '@/services/api'
import { formatDate, formatTime, formatS3Key } from '@/utils/formatters'

const receiptsList = ref([])
const totalItems = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)

const search = ref('')
const activeStatus = ref('all')
const startDate = ref('')
const endDate = ref('')
const sortKey = ref('createdAt')
const sortOrder = ref('desc')
const countsByStatus = ref({})

const selectedIds = ref([])
const selectAll = ref(false)
const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const bulkDeleting = ref(false)
const receiptToDelete = ref(null)

function changeSortOrder() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

function goToPage(p) {
  if (p >= 1 && p <= totalPages.value) {
    currentPage.value = p
  }
}

function cancelSelection() {
  selectedIds.value = []
  selectAll.value = false
}

function toggleSelectAll() {
  if (selectAll.value) {
    selectedIds.value = receiptsList.value.map((r) => r._id)
  } else {
    selectedIds.value = []
  }
}

function openDeleteModal(receipt) {
  receiptToDelete.value = receipt
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  receiptToDelete.value = null
}

function openBulkDeleteModal() {
  showBulkDeleteModal.value = true
}

function closeBulkDeleteModal() {
  showBulkDeleteModal.value = false
}

async function downloadReceipt(receiptId) {
  try {
    const response = await api.get(`receipts/download/${receiptId}`)
    if (response.data?.url) {
      const a = document.createElement('a')
      a.href = response.data.url
      a.click()
    } else {
      throw new Error('Download URL missing.')
    }
  } catch (error) {
    console.error('Failed to download receipt:', error)
    alert('Unable to download the receipt. Please try again later.')
  }
}

async function getReceipts() {
  try {
    const response = await api.get('receipts', {
      params: {
        page: currentPage.value,
        limit: 10,
        sort: sortKey.value,
        order: sortOrder.value,
        search: search.value || undefined,
        status: activeStatus.value === 'all' ? undefined : activeStatus.value,
        startDate: startDate.value || undefined,
        endDate: endDate.value || undefined,
      },
    })

    receiptsList.value = response.data.data || []
    totalItems.value = response.data.total || 0
    totalPages.value = response.data.totalPages || 1
    countsByStatus.value = response.data.countsByStatus || {}
  } catch (error) {
    console.error('Error fetching receipts:', error)
    receiptsList.value = []
  }
}

async function confirmDelete() {
  if (!receiptToDelete.value) return

  try {
    await api.delete(`receipts/${receiptToDelete.value._id}`)
    closeDeleteModal()
    cancelSelection()
    await getReceipts()
  } catch (error) {
    console.error('Error deleting receipt:', error)
    alert('Unable to delete the receipt. Please try again.')
  }
}

async function confirmBulkDelete() {
  if (selectedIds.value.length === 0) return
  
  bulkDeleting.value = true
  try {
    await api.delete('receipts', { data: { ids: selectedIds.value } })
    closeBulkDeleteModal()
    cancelSelection()
    await getReceipts()
  } catch (error) {
    console.error('Error in bulk delete:', error)
    alert('Unable to delete the selected receipts. Please try again.')
  } finally {
    bulkDeleting.value = false
  }
}

watch([currentPage, sortKey, sortOrder, activeStatus], () => {
  getReceipts()
})

function handleSearch() {
  currentPage.value = 1
  getReceipts()
}

function clearFilters() {
  search.value = ''
  startDate.value = ''
  endDate.value = ''
  activeStatus.value = 'all'
  currentPage.value = 1
  getReceipts()
}

onMounted(() => {
  getReceipts()
})

const statusTabs = computed(() => {
  const counts = countsByStatus.value || {}
  return [
    { label: 'All', value: 'all', count: counts.all || 0 },
    { label: 'Pending', value: 'pending', count: counts.pending || 0 },
    { label: 'Processing', value: 'processing', count: counts.processing || 0 },
    { label: 'Needs Approval', value: 'needs_approval', count: counts.needs_approval || 0 },
    { label: 'Approved', value: 'approved', count: counts.approved || 0 },
    { label: 'Rejected', value: 'rejected', count: counts.rejected || 0 },
    { label: 'Failed', value: 'failed', count: counts.failed || 0 },
  ]
})

const deleteModalDescription = computed(() => {
  if (!receiptToDelete.value) return 'This action cannot be undone.'
  const name = receiptToDelete.value.name || formatS3Key(receiptToDelete.value.s3Key || '')
  return `This action cannot be undone. The receipt <strong>${name}</strong> will be permanently removed.`
})

const bulkDeleteModalDescription = computed(() => {
  const count = selectedIds.value.length
  return `This action cannot be undone. The <strong>${count} selected receipts</strong> will be permanently removed.`
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.date-range input {
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 6px;
  padding: 6px 8px;
  color: #e2e8f0;
  font-size: 13px;
}

.date-range input:focus {
  border-color: #4a9eff;
}

.date-range input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

.receipts-page {
  padding: 32px 36px;
  font-family: 'DM Sans', sans-serif;
  color: #e2e8f0;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
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

.upload-btn {
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
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;
}

.upload-btn:hover {
  background: #1d4ed8;
}

.filters-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.date-range {
  margin-left: 0;
}

.action-filters-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
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

.search-btn:hover {
  background: #1d4ed8;
}

.clear-btn {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #7a8baa;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.09);
  color: #e2e8f0;
}

.filter-group-wrapper {
  margin-left: auto;
}

@media (max-width: 1024px) {
  .filter-group-wrapper {
    margin-left: 0;
    width: 100%;
    overflow-x: auto;
  }
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 300px;
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

.filter-group {
  display: flex;
  gap: 2px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 3px;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: #7a8baa;
  font-size: 12.5px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
  white-space: nowrap;
}

.filter-tab:hover {
  color: #c8d5e8;
}

.filter-tab.active {
  background: #1e3a6e;
  color: #4a9eff;
}

.tab-count {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 6px;
  border-radius: 10px;
}

.filter-tab.active .tab-count {
  background: rgba(74, 158, 255, 0.2);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #7a8baa;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-left: auto;
  white-space: nowrap;
}

.table-card {
  background: #0d1628;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  overflow: hidden;
  position: relative;
}

.receipts-table {
  width: 100%;
  border-collapse: collapse;
}

.receipts-table th {
  font-size: 11.5px;
  font-weight: 500;
  color: #7a8baa;
  text-align: left;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.02);
  white-space: nowrap;
}

.receipts-table th.sortable {
  cursor: pointer;
  user-select: none;
  display: table-cell;
}

.receipts-table th.sortable:hover {
  color: #c8d5e8;
}

.receipts-table th svg {
  vertical-align: middle;
  margin-left: 4px;
  opacity: 0.5;
}

.receipts-table td {
  padding: 13px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 13px;
  vertical-align: middle;
}

.table-row {
  transition: background 0.1s;
}
.table-row:hover {
  background: rgba(255, 255, 255, 0.02);
}
.table-row.selected {
  background: rgba(37, 99, 235, 0.07);
}
.table-row:last-child td {
  border-bottom: none;
}

.checkbox {
  width: 15px;
  height: 15px;
  accent-color: #2563eb;
  cursor: pointer;
}

.receipt-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.receipt-thumb {
  width: 34px;
  height: 34px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.receipt-merchant {
  font-size: 13px;
  font-weight: 500;
  color: #d1dcf0;
}

.receipt-file {
  font-size: 11.5px;
  color: #4a5a70;
  margin-top: 1px;
}

.amount {
  color: #d1dcf0;
  font-weight: 600;
  font-size: 13.5px;
}

.date-cell {
  color: #c8d5e8;
  font-size: 13px;
}

.time-cell {
  color: #4a5a70;
  font-size: 11.5px;
  margin-top: 1px;
}

.actions-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  color: #7a8baa;
  cursor: pointer;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #c8d5e8;
}

.action-btn.danger:hover {
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 56px 20px;
}

.empty-state p {
  font-size: 14px;
  font-weight: 500;
  color: #7a8baa;
}

.empty-state span {
  font-size: 12.5px;
  color: #4a5a70;
}

.bulk-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #1e3a6e;
  border-top: 1px solid rgba(74, 158, 255, 0.2);
}

.bulk-count {
  font-size: 13px;
  font-weight: 500;
  color: #4a9eff;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bulk-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #d1dcf0;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.bulk-btn:hover {
  background: rgba(255, 255, 255, 0.13);
}

.bulk-btn.danger {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
}
.bulk-btn.danger:hover {
  background: rgba(248, 113, 113, 0.1);
}

.bulk-cancel {
  background: transparent;
  border: none;
  color: #7a8baa;
  font-size: 12.5px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  padding: 7px 10px;
  border-radius: 7px;
  transition: color 0.15s;
}

.bulk-cancel:hover {
  color: #c8d5e8;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.pagination-info {
  font-size: 12.5px;
  color: #4a5a70;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  width: 30px;
  height: 30px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.09);
  color: #7a8baa;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  color: #c8d5e8;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-num {
  width: 30px;
  height: 30px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.09);
  color: #7a8baa;
  border-radius: 7px;
  cursor: pointer;
  font-size: 12.5px;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
}

.page-num:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #c8d5e8;
}

.page-num.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
  font-weight: 600;
}
</style>
